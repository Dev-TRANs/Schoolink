import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, matchings } from "../db/schema";
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

app.post("/sign_in", zValidator('json', z.object({
    userId: z.string(),
    hashedPassword: z.string(),
})), async (c) => {
    const { userId, hashedPassword } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const [ user ] = await db.select().from(users).where(eq(users.userId, userId.toLowerCase())).execute()
    if (!user || user.hashedPassword !== hashedPassword) {
        return c.json(
            { success: false, message: "Invalid credentials" },
            401
        );
    }
    const session = {
        sessionUuid: crypto.randomUUID(),
        userUuid: user.userUuid,
        userAgent: c.req.header('User-Agent'),
        ipAddress: c.req.header('X-Forwarded-For'),
        expiresAt: Math.floor(new Date().setMonth(new Date().getMonth() + 1) / 1000),
    }
    await db.insert(sessions).values(session).execute();
    return c.json(
        { success: true, userUuid: user.userUuid, sessionUuid: session.sessionUuid }
    )
})

app.post("/sign_out", zValidator('json', z.object({
    sessionUuid: z.string(),
})), async (c) => {
    const { sessionUuid } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    await db.update(sessions).set({ isValid: 0 }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    return c.json(
        { success: true },
    )
})

app.use("/create_account", checkOrgMembership("admin"))

app.post("/create_account", zValidator('json', z.object({
    newUserId: z.string(),
    organizationId: z.string(),
    hashedPassword: z.string(),
    displayName: z.string(),
    sessionUuid: z.string(),
})), async (c) => {
    const { newUserId, hashedPassword, displayName } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const organization = c.get("organization")
    const user: typeof users.$inferInsert = {
        userUuid: crypto.randomUUID(),
        userId: newUserId.toLowerCase(),
        hashedPassword: hashedPassword,
    }
    const profile: typeof profiles.$inferInsert = {
        profileUuid: crypto.randomUUID(),
        profileType: "user",
        organizationUuid: null,
        userUuid: user.userUuid,
        displayName: displayName,
        bio: null,
        avatar: "/img/default/avatar.png",
        instagramId: null,
        threadsId: null,
        twitterId: null
    }
    const membership: typeof memberships.$inferInsert = {
        membershipUuid: crypto.randomUUID(),
        organizationUuid: organization.organizationUuid,
        userUuid: user.userUuid,
        role: "member"
    }
    await db.insert(users).values(user).execute()
    await db.insert(profiles).values(profile).execute()
    await db.insert(memberships).values(membership).execute()
    return c.json(
        { success: true },
        500,
    );
})

app.post("/change_password", zValidator('json', z.object({
    sessionUuid: z.string(),
    hashedCurrentPassword: z.string(),
    hashedNewPassword: z.string(),
})), async (c) => {
    const { hashedCurrentPassword, hashedNewPassword } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [ user ] = await db.select().from(users).where(eq(users.userUuid, session.userUuid)).execute()
    if (user.hashedPassword != hashedCurrentPassword) {
        return c.json(
            { success: false, message: "Invalid credentials" },
            401
        );
    }
    await db.update(users).set({ hashedPassword: hashedNewPassword }).where(eq(users.userUuid, session.userUuid)).execute()
    return c.json(
        { success: true }
    )
})

export default app