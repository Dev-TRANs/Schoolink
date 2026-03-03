import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, questions, posts, projects, events, polls, comments, replies, notifications, subscriptions } from "../db/schema";
import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { checkOrgMembership } from '../middlewares/permission';

type Env = {
    Bindings: {
        DB: D1Database;
        SCRIPT_ID: string;
    };
    Variables: {
        session: typeof sessions.$inferSelect;
        membership: typeof memberships.$inferSelect;
        organization: typeof organizations.$inferSelect
    }
}

const app = new Hono<Env>();

// postUuid から個別ページの href を組み立てる
async function buildHref(db: ReturnType<typeof drizzle>, postUuid: string, postType: string): Promise<string | undefined> {
    if (postType === "project") {
        const [row] = await db.select({ projectId: projects.projectId }).from(projects).where(eq(projects.postUuid, postUuid)).execute()
        return row ? `/projects/${row.projectId}` : undefined
    }
    if (postType === "event") {
        const [row] = await db.select({ eventId: events.eventId }).from(events).where(eq(events.postUuid, postUuid)).execute()
        return row ? `/events/${row.eventId}` : undefined
    }
    if (postType === "poll") {
        const [row] = await db.select({ pollId: polls.pollId }).from(polls).where(eq(polls.postUuid, postUuid)).execute()
        return row ? `/polls/${row.pollId}` : undefined
    }
    if (postType === "question") {
        const [row] = await db.select({ questionId: questions.questionId }).from(questions).where(eq(questions.postUuid, postUuid)).execute()
        return row ? `/questions/${row.questionId}` : undefined
    }
    return undefined
}

// postUuidを受け取ってコメント一覧を返す
app.get("/", zValidator('query', z.object({
    postUuid: z.string(),
})), async (c) => {
    const { postUuid } = c.req.valid('query')
    const db = drizzle(c.env.DB)
    const commentsBaseObject = await db.select().from(comments).orderBy(desc(comments.createdAt)).where(and(eq(comments.postUuid, postUuid), eq(comments.isValid, 1)))
    const commentsObject = await Promise.all(commentsBaseObject.map(async (comment) => {
        const [commentMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, comment.membershipUuid))
        const [commentUser] = await db.select().from(users).where(eq(users.userUuid, commentMembership.userUuid))
        const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, commentMembership.userUuid))
        return {
            commentUuid: comment.commentUuid,
            postUuid: comment.postUuid,
            content: comment.content,
            userId: commentUser.userId,
            userDisplayName: userProfile.displayName,
            userAvatar: userProfile.avatar,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        }
    }))
    return c.json({ success: true, data: commentsObject })
})

app.use('/', checkOrgMembership("member"))

app.post('/', zValidator('json', z.object({
    sessionUuid: z.string(),
    organizationId: z.string(),
    postUuid: z.string(),
    content: z.string().min(1),
})), async (c) => {
    const { postUuid, content } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const membership = c.get("membership")

    const [post] = await db.select().from(posts).where(eq(posts.postUuid, postUuid)).execute()
    if (!post) {
        return c.json({ success: false, message: "Post not found" }, 404);
    }

    const comment: typeof comments.$inferInsert = {
        commentUuid: crypto.randomUUID(),
        postUuid,
        membershipUuid: membership.membershipUuid,
        content,
    }
    await db.insert(comments).values(comment).execute()

    // サブスクライバーへの通知（個別ページへのhref付き）
    const postsSubscriptions = await db.select().from(subscriptions)
        .where(and(eq(subscriptions.postUuid, postUuid), eq(subscriptions.isValid, 1)))
    if (postsSubscriptions.length > 0) {
        const href = await buildHref(db, postUuid, post.postType)
        const newNotifications: typeof notifications.$inferInsert[] = postsSubscriptions
            .filter(s => s.userUuid !== membership.userUuid)
            .map(s => ({
                notificationUuid: crypto.randomUUID(),
                userUuid: s.userUuid,
                content: `あなたがサブスクライブしている投稿に新しいコメントがありました。`,
                href,
            }))
        if (newNotifications.length > 0) {
            await db.insert(notifications).values(newNotifications).execute()
        }
    }
    return c.json({ success: true, commentUuid: comment.commentUuid })
})

app.patch('/:comment_uuid', zValidator('json', z.object({
    sessionUuid: z.string(),
    content: z.string().min(1),
})), async (c) => {
    const { content } = c.req.valid('json')
    const commentUuid = c.req.param("comment_uuid")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [comment] = await db.select().from(comments).where(eq(comments.commentUuid, commentUuid))
    if (!comment) return c.json({ success: false, message: "Comment not found" }, 404);
    const [commentMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, comment.membershipUuid))
    if (commentMembership.userUuid !== session.userUuid) {
        return c.json({ success: false, message: "Forbidden" }, 403);
    }
    await db.update(comments).set({ content, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(comments.commentUuid, commentUuid)).execute()
    return c.json({ success: true })
})

app.patch('/:comment_uuid/is_valid', zValidator('json', z.object({
    sessionUuid: z.string(),
})), async (c) => {
    const commentUuid = c.req.param("comment_uuid")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [comment] = await db.select().from(comments).where(eq(comments.commentUuid, commentUuid))
    if (!comment) return c.json({ success: false, message: "Comment not found" }, 404);
    const [commentMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, comment.membershipUuid))
    if (commentMembership.userUuid !== session.userUuid) {
        return c.json({ success: false, message: "Forbidden" }, 403);
    }
    await db.update(comments).set({ isValid: (comment.isValid ? 0 : 1) }).where(eq(comments.commentUuid, commentUuid)).execute()
    return c.json({ success: true })
})

export default app