import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, polls, questions, comments, replies, notifications, subscriptions, posts } from "../db/schema";
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

// postUuid + postType から個別ページ href を組み立てる
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

// commentUuidを受け取ってリプライ一覧を返す
app.get("/", zValidator('query', z.object({
    commentUuid: z.string(),
})), async (c) => {
    const { commentUuid } = c.req.valid('query')
    const db = drizzle(c.env.DB)
    const repliesBaseObject = await db.select().from(replies).orderBy(desc(replies.createdAt)).where(and(eq(replies.commentUuid, commentUuid), eq(replies.isValid, 1)))
    const repliesObject = await Promise.all(repliesBaseObject.map(async (reply) => {
        const [replyMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, reply.membershipUuid))
        const [replyUser] = await db.select().from(users).where(eq(users.userUuid, replyMembership.userUuid))
        const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, replyMembership.userUuid))
        return {
            replyUuid: reply.replyUuid,
            commentUuid: reply.commentUuid,
            content: reply.content,
            userId: replyUser.userId,
            userDisplayName: userProfile.displayName,
            userAvatar: userProfile.avatar,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
        }
    }))
    return c.json({ success: true, data: repliesObject })
})

app.use('/', checkOrgMembership("member"))

app.post('/', zValidator('json', z.object({
    sessionUuid: z.string(),
    organizationId: z.string(),
    commentUuid: z.string(),
    content: z.string().min(1),
})), async (c) => {
    const { commentUuid, content } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const membership = c.get("membership")

    const [comment] = await db.select().from(comments).where(eq(comments.commentUuid, commentUuid)).execute()
    if (!comment) {
        return c.json({ success: false, message: "Comment not found" }, 404);
    }

    const reply: typeof replies.$inferInsert = {
        replyUuid: crypto.randomUUID(),
        commentUuid,
        membershipUuid: membership.membershipUuid,
        content,
    }
    await db.insert(replies).values(reply).execute()

    // コメント投稿者へのリプライ通知（個別ページへのhref付き）
    const [commentMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, comment.membershipUuid))
    if (commentMembership.userUuid !== membership.userUuid) {
        const [post] = await db.select().from(posts).where(eq(posts.postUuid, comment.postUuid)).execute()
        const href = post ? await buildHref(db, comment.postUuid, post.postType) : undefined
        const notification: typeof notifications.$inferInsert = {
            notificationUuid: crypto.randomUUID(),
            userUuid: commentMembership.userUuid,
            content: `あなたのコメントに返信がありました。`,
            href,
        }
        await db.insert(notifications).values(notification).execute()
    }
    return c.json({ success: true, replyUuid: reply.replyUuid })
})

app.patch('/:reply_uuid', zValidator('json', z.object({
    sessionUuid: z.string(),
    content: z.string().min(1),
})), async (c) => {
    const { content } = c.req.valid('json')
    const replyUuid = c.req.param("reply_uuid")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [reply] = await db.select().from(replies).where(eq(replies.replyUuid, replyUuid))
    if (!reply) return c.json({ success: false, message: "Reply not found" }, 404);
    const [replyMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, reply.membershipUuid))
    if (replyMembership.userUuid !== session.userUuid) {
        return c.json({ success: false, message: "Forbidden" }, 403);
    }
    await db.update(replies).set({ content, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(replies.replyUuid, replyUuid)).execute()
    return c.json({ success: true })
})

app.patch('/:reply_uuid/is_valid', zValidator('json', z.object({
    sessionUuid: z.string(),
})), async (c) => {
    const replyUuid = c.req.param("reply_uuid")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [reply] = await db.select().from(replies).where(eq(replies.replyUuid, replyUuid))
    if (!reply) return c.json({ success: false, message: "Reply not found" }, 404);
    const [replyMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, reply.membershipUuid))
    if (replyMembership.userUuid !== session.userUuid) {
        return c.json({ success: false, message: "Forbidden" }, 403);
    }
    await db.update(replies).set({ isValid: (reply.isValid ? 0 : 1) }).where(eq(replies.replyUuid, replyUuid)).execute()
    return c.json({ success: true })
})

export default app