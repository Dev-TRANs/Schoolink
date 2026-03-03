import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, questions, posts, comments, notifications, subscriptions } from "../db/schema";
import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { generateId } from '../utils';
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

app.get("/", zValidator('query', z.object({
    userId: z.string(),
}).partial()), async (c) => {
    const { userId } = c.req.valid('query')
    const db = drizzle(c.env.DB)
    let questionsBaseObject
    if (userId) {
        const [user] = await db.select().from(users).where(eq(users.userId, userId))
        if (!user) {
            return c.json(
                { success: false, message: "User not found" },
                404,
            );
        }
        const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid))
        questionsBaseObject = await db.select().from(questions).orderBy(desc(questions.createdAt)).where(and(eq(questions.membershipUuid, membership.membershipUuid), eq(questions.isValid, 1)))
    } else {
        questionsBaseObject = await db.select().from(questions).orderBy(desc(questions.createdAt)).where(eq(questions.isValid, 1))
    }
    const questionsObject = await Promise.all(questionsBaseObject.map(async (question) => {
        const [questionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid))
        const [questionUser] = await db.select().from(users).where(eq(users.userUuid, questionMembership.userUuid))
        const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, questionMembership.userUuid))
        const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, questionMembership.organizationUuid))
        const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, questionMembership.organizationUuid))
        return {
            questionId: question.questionId,
            title: question.title,
            description: question.description,
            thumbnail: question.thumbnail,
            bestCommentUuid: question.bestCommentUuid,
            userId: questionUser.userId,
            userDisplayName: userProfile.displayName,
            userAvatar: userProfile.avatar,
            organizationId: organization.organizationId,
            organizationDisplayName: organizationProfile.displayName,
            organizationAvatar: organizationProfile.avatar,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
        }
    }))
    return c.json({ success: true, data: questionsObject })
})

app.get('/:question_id', async (c) => {
    const questionId = c.req.param('question_id')
    const db = drizzle(c.env.DB)
    const [question] = await db.select().from(questions).where(eq(questions.questionId, questionId))
    if (!question) {
        return c.json({ success: false, message: "Question not found" }, 404);
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid))
    const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid))
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid))
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid))
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid))
    return c.json({
        success: true,
        data: {
            questionId: question.questionId,
            title: question.title,
            description: question.description,
            thumbnail: question.thumbnail,
            bestCommentUuid: question.bestCommentUuid,
            postUuid: question.postUuid,
            userId: user.userId,
            userDisplayName: userProfile.displayName,
            userAvatar: userProfile.avatar,
            organizationId: organization.organizationId,
            organizationDisplayName: organizationProfile.displayName,
            organizationAvatar: organizationProfile.avatar,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
        }
    })
})

app.use('/', checkOrgMembership("member"))

app.post('/', zValidator('form', z.object({
    sessionUuid: z.string(),
    organizationId: z.string(),
    title: z.string(),
    description: z.string(),
    thumbnail: z.instanceof(File)
}).partial({ description: true, thumbnail: true })), async (c) => {
    const { title, description, thumbnail } = await c.req.parseBody();
    const db = drizzle(c.env.DB)
    const membership = c.get("membership")
    let url: string | undefined
    if (thumbnail) {
        if (!(thumbnail instanceof File)) {
            return c.json({ success: false, message: "Thumbnail must be a file" }, 400);
        }
        const forwardFormData = new FormData();
        forwardFormData.append('file', thumbnail);
        forwardFormData.append('scriptId', c.env.SCRIPT_ID);
        const response = await fetch("https://image.stki.org/", { method: 'POST', body: forwardFormData });
        const data: any = await response.json();
        if (!response.ok) {
            return c.json({ success: false, message: `Image API Error (${response.status}): ${data.error}` }, 500);
        }
        url = data.url
    }
    const postUuid = crypto.randomUUID()
    await db.insert(posts).values({ postUuid, postType: "question" }).execute()
    const question: typeof questions.$inferInsert = {
        questionUuid: crypto.randomUUID(),
        questionId: generateId(),
        membershipUuid: membership.membershipUuid,
        title: title as string,
        description: description as string,
        thumbnail: url,
        postUuid,
    }
    await db.insert(questions).values(question).execute()
    await db.insert(subscriptions).values({
        subscriptionUuid: crypto.randomUUID(),
        userUuid: membership.userUuid,
        postUuid,
    }).execute()
    return c.json({ success: true, questionId: question.questionId })
})

app.patch('/:question_id', zValidator('form', z.object({
    sessionUuid: z.string(),
    title: z.string(),
    description: z.string(),
    thumbnail: z.instanceof(File)
}).partial({ title: true, description: true, thumbnail: true })), async (c) => {
    const { title, description, thumbnail } = await c.req.parseBody();
    const questionId = c.req.param("question_id")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [question] = await db.select().from(questions).where(eq(questions.questionId, questionId))
    if (!question) return c.json({ success: false, message: "Question not found" }, 404);
    const [questionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid))
    if (questionMembership.userUuid !== session.userUuid) {
        return c.json({ success: false, message: "Forbidden" }, 403);
    }
    let url: string | undefined
    if (thumbnail) {
        if (!(thumbnail instanceof File)) {
            return c.json({ success: false, message: "Thumbnail must be a file" }, 400);
        }
        const forwardFormData = new FormData();
        forwardFormData.append('file', thumbnail);
        forwardFormData.append('scriptId', c.env.SCRIPT_ID);
        const response = await fetch("https://image.stki.org/", { method: 'POST', body: forwardFormData });
        const data: any = await response.json();
        if (!response.ok) {
            return c.json({ success: false, message: `Image API Error (${response.status}): ${data.error}` }, 500);
        }
        url = data.url
    }
    const newDetail = { title, description, thumbnail: url, updatedAt: Math.floor(Date.now() / 1000) }
    const updatedDetail = Object.fromEntries(Object.entries(newDetail).filter(([_, v]) => v !== undefined && v !== null));
    await db.update(questions).set(updatedDetail).where(eq(questions.questionId, questionId)).execute()
    const postsSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.postUuid, question.postUuid))
    if (postsSubscriptions.length > 0) {
        const newNotifications: typeof notifications.$inferInsert[] = postsSubscriptions.filter(postsSubscription => postsSubscription.userUuid !== session.userUuid).map(postsSubscription => ({
            notificationUuid: crypto.randomUUID(),
            userUuid: postsSubscription.userUuid,
            content: `質問:${question.title}にあらたな変更がありました。`,
            href: `/questions/${question.questionId}`
        }))
        await db.insert(notifications).values(newNotifications).execute()
    }
    return c.json({ success: true })
})

app.patch('/:question_id/best_comment', zValidator('json', z.object({
    sessionUuid: z.string(),
    commentUuid: z.string(),
})), async (c) => {
    const { commentUuid } = c.req.valid('json')
    const questionId = c.req.param("question_id")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [question] = await db.select().from(questions).where(eq(questions.questionId, questionId))
    if (!question) return c.json({ success: false, message: "Question not found" }, 404);
    const [questionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid))
    if (questionMembership.userUuid !== session.userUuid) {
        return c.json({ success: false, message: "Forbidden" }, 403);
    }
    await db.update(questions).set({ bestCommentUuid: commentUuid, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(questions.questionId, questionId)).execute()
    return c.json({ success: true })
})

app.patch('/:question_id/is_valid', zValidator('json', z.object({
    sessionUuid: z.string(),
})), async (c) => {
    const db = drizzle(c.env.DB)
    const questionId = c.req.param("question_id")
    const session = c.get("session")
    const [question] = await db.select().from(questions).where(eq(questions.questionId, questionId))
    if (!question) return c.json({ success: false, message: "Question not found" }, 404);
    const [questionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid))
    if (questionMembership.userUuid !== session.userUuid) {
        return c.json({ success: false, message: "Forbidden" }, 403);
    }
    await db.update(questions).set({ isValid: (question.isValid ? 0 : 1) }).where(eq(questions.questionId, questionId)).execute()
    return c.json({ success: true })
})

export default app
