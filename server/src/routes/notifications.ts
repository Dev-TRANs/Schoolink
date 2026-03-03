import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and, desc } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, polls, votes, questions, posts, comments, replies, notifications, subscriptions  } from "../db/schema";
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

// postType → テーブル/IDカラムのマップ
const postTargetDBs = {
    project: { db: projects, id: projects.projectId },
    event:   { db: events,   id: events.eventId },
    poll:    { db: polls,    id: polls.pollId },
    question:{ db: questions,id: questions.questionId },
}

app.post("/subscriptions", zValidator('json', z.object({
    sessionUuid: z.string(),
    postType: z.enum(["project", "event", "poll", "question"]),
    postId: z.string()
})), async (c) => {
    const { postType, postId } = c.req.valid("json")
    const db = drizzle(c.env.DB)
    const session = c.get("session")

    const [ postTarget ] = await db.select().from(postTargetDBs[postType].db).where(eq(postTargetDBs[postType].id, postId)).execute()
    if (!postTarget) return c.json({ success: false, message: "Post not found" }, 404)

    // 既存サブスクリプションがあれば isValid=1 に戻す（重複insert防止）
    const [ existing ] = await db.select().from(subscriptions)
        .where(and(eq(subscriptions.postUuid, postTarget.postUuid), eq(subscriptions.userUuid, session.userUuid)))
        .execute()

    if (existing) {
        if (existing.isValid === 1) {
            // すでに有効 → 何もしない
            return c.json({ success: true })
        }
        // isValid=0 → 再有効化
        await db.update(subscriptions)
            .set({ isValid: 1 })
            .where(and(eq(subscriptions.postUuid, postTarget.postUuid), eq(subscriptions.userUuid, session.userUuid)))
            .execute()
        return c.json({ success: true })
    }

    // 新規insert
    const subscription: typeof subscriptions.$inferInsert = {
        subscriptionUuid: crypto.randomUUID(),
        userUuid: session.userUuid,
        postUuid: postTarget.postUuid,
    }
    await db.insert(subscriptions).values(subscription).execute()
    return c.json({ success: true })
})

app.patch("/subscriptions/:post_type/:post_id/is_valid", zValidator('json', z.object({
    sessionUuid: z.string(),
})), zValidator('param', z.object({
    post_type: z.enum(["project", "event", "poll", "question"]),
    post_id: z.string()
})), async (c) => {
    const { post_type: postType, post_id: postId } = c.req.valid("param")
    const db = drizzle(c.env.DB)
    const session = c.get("session")

    const [ postTarget ] = await db.select().from(postTargetDBs[postType].db).where(eq(postTargetDBs[postType].id, postId)).execute()
    if (!postTarget) return c.json({ success: false, message: "Post not found" }, 404)

    const [ currentSubscription ] = await db.select().from(subscriptions)
        .where(and(eq(subscriptions.postUuid, postTarget.postUuid), eq(subscriptions.userUuid, session.userUuid)))
        .execute()
    if (!currentSubscription) {
        return c.json({ success: false, message: "Subscription not found" }, 404)
    }
    await db.update(subscriptions)
        .set({ isValid: (currentSubscription.isValid ? 0 : 1) })
        .where(and(eq(subscriptions.postUuid, postTarget.postUuid), eq(subscriptions.userUuid, session.userUuid)))
        .execute()
    return c.json({ success: true })
})

app.post("/subscriptions/query", zValidator('json', z.object({
    sessionUuid: z.string(),
})), async (c) => {
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const userSubscriptions = await db.select().from(subscriptions)
        .where(and(eq(subscriptions.userUuid, session.userUuid), eq(subscriptions.isValid, 1)))
        .execute()
    return c.json({ success: true, data: userSubscriptions })
})

app.post("/query", zValidator('json', z.object({
    sessionUuid: z.string(),
})), async (c) => {
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const userNotifications = await db.select().from(notifications)
        .where(and(eq(notifications.userUuid, session.userUuid), eq(notifications.isValid, 1)))
        .execute()
    return c.json({ success: true, data: userNotifications })
})

app.patch("/:notification_uuid/is_opened", async (c) => {
    const notificationUuid = c.req.param("notification_uuid")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [notification] = await db.select().from(notifications)
        .where(and(eq(notifications.userUuid, session.userUuid), eq(notifications.notificationUuid, notificationUuid)))
    await db.update(notifications)
        .set({ isOpened: (notification.isOpened ? 0 : 1) })
        .where(and(eq(notifications.userUuid, session.userUuid), eq(notifications.notificationUuid, notificationUuid)))
        .execute()
    return c.json({ success: true })
})

export default app