import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, polls, votes, questions, posts, comments, replies, notifications, subscriptions  } from "../db/schema";
import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { checkOrgMembership, checkUserSession } from '../middlewares/permission';

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
    organizationId: z.string(),
}).required()), async (c: any) => {
    const { organizationId } = c.req.valid('query')
    const db = drizzle(c.env.DB)
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute()
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    if (!organization) {
        return c.json(
            { success: false, message: "Organization not found" },
            404,
        );
    }
    const membershipObject = await db.select().from(memberships).where(eq(memberships.organizationUuid, organization.organizationUuid))
    const usersObject = await Promise.all(membershipObject.map(async (membership) => {
        const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid)).execute()
        const [profile] = await db.select().from(profiles).where(eq(profiles.userUuid, user.userUuid)).execute()
        const data = {
            userId: user.userId,
            displayName: profile.displayName,
            bio: profile.bio,
            avatar: profile.avatar,
            instagramId: profile.instagramId,
            threadsId: profile.threadsId,
            twitterId: profile.twitterId,
            organizationId: organization.organizationId,
            organizationDisplayName: organizationProfile.displayName,
            organizationAvatar: organizationProfile.avatar,
            role: membership.role
        }
        return data
    }))
    return c.json(
        { success: true, data: usersObject }
    )
})

app.get("/:user_id", async (c) => {
    const userId = c.req.param('user_id')
    const db = drizzle(c.env.DB)
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).execute()
    if (!user) {
        return c.json(
            { success: false, message: "User not found" },
            404,
        );
    }
    const [profile] = await db.select().from(profiles).where(eq(profiles.userUuid, user.userUuid)).execute()
    const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid)).execute()
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid)).execute()
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    const data = {
        userId: user.userId,
        displayName: profile.displayName,
        bio: profile.bio,
        avatar: profile.avatar,
        instagramId: profile.instagramId,
        threadsId: profile.threadsId,
        twitterId: profile.twitterId,
        organizationId: organization.organizationId,
        organizationDisplayName: organizationProfile.displayName,
        organizationAvatar: organizationProfile.avatar,
        role: membership.role
    }
    return c.json(
        { success: true, data: data },
    )
})

app.use("/:user_id/id", checkUserSession)

app.put("/:user_id/id", zValidator('json', z.object({
    sessionUuid: z.string(),
    newUserId: z.string()
})), async (c) => {
    const { newUserId } = c.req.valid("json")
    const session = c.get("session")
    const db = drizzle(c.env.DB)
    await db.update(users).set({ userId: newUserId.toLowerCase() }).where(eq(users.userUuid, session.userUuid)).execute()
    return c.json(
        { success: true }
    )
})

app.use("/:user_id", checkUserSession)

app.put("/:user_id", zValidator('form', z.object({
    sessionUuid: z.string(),
    displayName: z.string(),
    bio: z.string(),
    instagramId: z.string(),
    threadsId: z.string(),
    twitterId: z.string()
}).partial()), async (c) => {
    const { displayName, bio, instagramId, threadsId, twitterId } = await c.req.parseBody();
    const session = c.get("session")
    const db = drizzle(c.env.DB)
    const newProfile = {
        displayName: displayName,
        bio: bio,
        instagramId: instagramId,
        threadsId: threadsId,
        twitterId: twitterId,
        updatedAt: Math.floor(Date.now() / 1000)
    }
    const updatedProfile = Object.fromEntries(
        Object.entries(newProfile).filter(([_, value]) => value !== null)
    );
    await db.update(profiles).set(updatedProfile).where(eq(profiles.userUuid, session.userUuid)).execute()
    return c.json(
        { success: true }
    )
})

app.use("/:user_id/avatar", checkUserSession)

app.post("/:user_id/avatar", zValidator('form', z.object({
    sessionUuid: z.string(),
    avatar: z.instanceof(File)
})), async (c) => {
    const { avatar } = await c.req.parseBody();
    const session = c.get("session")
    const db = drizzle(c.env.DB)
    const forwardFormData = new FormData();
    if (!(avatar instanceof File)) {
        return c.json(
            { success: false, message: "Avatar must be a file" },
            400
        );
    }
    forwardFormData.append('file', avatar);
    forwardFormData.append('scriptId', c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
        method: 'POST',
        body: forwardFormData,
    });
    const data: any = await response.json();
    if (!response.ok) {
        return c.json(
            { success: false, message: `Image API Error (${response.status}): ${data.error}` },
            500,
        );
    }
    await db.update(profiles).set({ avatar: data.url, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(profiles.userUuid, session.userUuid)).execute()
    return c.json(
        { success: true }
    )
})

app.use("/:user_id/role", checkOrgMembership("admin"))

app.put("/:user_id/role", zValidator('json', z.object({
    sessionUuid: z.string(),
    organizationId: z.string(),
})), async (c) => {
    const targetUserId = c.req.param("user_id")
    const db = drizzle(c.env.DB)
    const requesterMembership = c.get("membership")
    const [targetUser] = await db.select().from(users).where(eq(users.userId, targetUserId)).execute()
    if (!targetUser) {
        return c.json(
            { success: false, message: "User not found" },
            404,
        );
    }
    const [targetMembership] = await db.select().from(memberships).where(eq(memberships.userUuid, targetUser.userUuid)).execute()
    if (targetMembership.organizationUuid != requesterMembership.organizationUuid) {
        return c.json(
            { success: false, message: "Forbidden" },
            403,
        )
    }
    await db.update(memberships).set({ role: (targetMembership.role == "member" ? "admin" : "member") }).where(eq(memberships.userUuid, targetUser.userUuid)).execute()
    return c.json(
        { success: true }
    )
})

app.use("/:user_id/is_valid", checkOrgMembership("admin"))

app.put("/:user_id/is_valid", zValidator('json', z.object({
    sessionUuid: z.string(),
    organizationId: z.string(),
})), async (c: any) => {
    const targetUserId = c.req.param("user_id")
    const db = drizzle(c.env.DB)
    const requesterMembership = c.get("membership")
    const [targetUser] = await db.select().from(users).where(eq(users.userId, targetUserId)).execute()
    if (!targetUser) {
        return c.json(
            { success: false, message: "User not found" },
            404,
        );
    }
    const [targetMembership] = await db.select().from(memberships).where(eq(memberships.userUuid, targetUser.userUuid)).execute()
    if (targetMembership.organizationUuid != requesterMembership.organizationUuid) {
        return c.json(
            { success: false, message: "Forbidden" },
            403,
        )
    }
    await db.update(users).set({ isValid: (targetUser.isValid == 1 ? 0 : 1) }).where(eq(users.userUuid, targetUser.userUuid)).execute()
    return c.json(
        { success: true }
    )
})

export default app