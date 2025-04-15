import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, interactions } from "../db/schema";
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

app.get("/:organization_id", async (c) => {
    const organizationId = c.req.param('organization_id')
    const db = drizzle(c.env.DB)
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute()
    if (!organization) {
        return c.json(
            { success: false, message: "Organization not found" },
            404,
        );
    }
    const [profile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    const organizationMemberships = await db.select().from(memberships).where(eq(memberships.organizationUuid, organization.organizationUuid))
    const organizationUsers = await Promise.all(organizationMemberships.map(async(organizationMembership) => {
        const [user] = await db.select().from(users).where(eq(users.userUuid, organizationMembership.userUuid)).execute()
        const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, organizationMembership.userUuid)).execute()
        const userData = {
            userId: user.userId,
            displayName: userProfile.displayName,
            bio: userProfile.bio,
            avatar: userProfile.avatar,
            instagramId: userProfile.instagramId,
            threadsId: userProfile.threadsId,
            twitterId: userProfile.twitterId,
            role: organizationMembership.role
        }
        return userData
    }))
    const data = {
        organizationId: organization.organizationId,
        displayName: profile.displayName,
        bio: profile.bio,
        avatar: profile.avatar,
        instagramId: profile.instagramId,
        threadsId: profile.threadsId,
        twitterId: profile.twitterId,
        users: organizationUsers
    }
    return c.json(
        { success: true, data: data }
    )
})

app.use("/:organization_id", checkOrgMembership("admin"))

app.put("/:organization_id", zValidator('form', z.object({
    sessionUuid: z.string(),
    displayName: z.string(),
    bio: z.string(),
    instagramId: z.string(),
    threadsId: z.string(),
    twitterId: z.string()
}).partial()), async (c) => {
    const { displayName, bio, instagramId, threadsId, twitterId } = await c.req.parseBody();
    const organization = c.get("organization")
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
    await db.update(profiles).set(updatedProfile).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    return c.json(
        { success: true }
    )
})

app.use("/:organization_id/id", checkOrgMembership("admin"))

app.put("/:organization_id/id", zValidator('json', z.object({
    sessionUuid: z.string(),
    newOrganizationId: z.string()
})), async (c) => {
    const { newOrganizationId } = c.req.valid("json")
    const organization = c.get("organization")
    const db = drizzle(c.env.DB)
    await db.update(organizations).set({ organizationId: newOrganizationId.toLowerCase() }).where(eq(organizations.organizationUuid, organization.organizationUuid)).execute()
    return c.json(
        { success: true }
    )
})

app.use("/:organization_id/avatar", checkOrgMembership("admin"))

app.post("/:organization_id/avatar", zValidator('form', z.object({
    sessionUuid: z.string(),
    avatar: z.instanceof(File)
})), async (c) => {
    const { avatar } = await c.req.parseBody();
    const organization = c.get("organization")
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
    await db.update(profiles).set({ avatar: data.url, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    return c.json(
        { success: true }
    )
})

export default app