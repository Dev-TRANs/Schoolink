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

app.post("/subscriptions", zValidator('json', z.object({
    sessionUuid: z.string(),
    postType: z.enum(["project", "event", "poll", "question"]),
    postId: z.string()
})), async (c) => {
    const { postType, postId } = c.req.valid("json")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const postTargetDBs = {
        project: {
            db: projects,
            id: projects.projectId
        },
        event: {
            db: events,
            id: events.eventId
        },
        poll: {
            db: polls,
            id: polls.pollId
        },
        question: {
            db: questions,
            id: questions.questionId
        },
    }
    const [ postTarget ] = await db.select().from(postTargetDBs[postType].db).where(eq(postTargetDBs[postType].id, postId)).execute()
    // const [ post ] = await db.select().from(posts).where(eq(posts.postUuid, postTarget.postUuid)).execute()
    const subscription: typeof subscriptions.$inferInsert = {
        subscriptionUuid: crypto.randomUUID(),
        userUuid: session.userUuid,
        postUuid: postTarget.postUuid,
    }
    await db.insert(subscriptions).values(subscription).execute()
    return c.json({
        success: true,
    })
})

app.put("/subscriptions/is_valid", zValidator('json', z.object({
    sessionUuid: z.string(),
    postType: z.enum(["project", "event", "poll", "question"]),
    postId: z.string()
})), async (c) => {
    const { postType, postId } = c.req.valid("json")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const postTargetDBs = {
        project: {
            db: projects,
            id: projects.projectId
        },
        event: {
            db: events,
            id: events.eventId
        },
        poll: {
            db: polls,
            id: polls.pollId
        },
        question: {
            db: questions,
            id: questions.questionId
        },
    }
    const [ postTarget ] = await db.select().from(postTargetDBs[postType].db).where(eq(postTargetDBs[postType].id, postId)).execute()
    await db.update(subscriptions).set({isValid: (subscriptions.isValid ? 0 : 1)}).where(and(eq(subscriptions.postUuid, postTarget.postUuid), eq(subscriptions.userUuid, session.userUuid))).execute()
    return c.json({
        success: true,
    })
})

app.post("/subscriptions/query", zValidator('json', z.object({
    sessionUuid: z.string(),
})), async (c) => {
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const userSubscriptions = await db.select().from(subscriptions).where(and(eq(subscriptions.userUuid, session.userUuid), eq(subscriptions.isValid, 1))).execute()
    return c.json({
        success: true,
        data: userSubscriptions
    })
})

app.post("/query", zValidator('json', z.object({
    sessionUuid: z.string(),
})), async (c) => {
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const userNotifications = await db.select().from(notifications).where(and(eq(notifications.userUuid, session.userUuid), eq(notifications.isValid, 1))).execute()
    return c.json({
        success: true,
        data: userNotifications
    })
})

export default app