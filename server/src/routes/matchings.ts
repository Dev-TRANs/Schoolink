import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, matchings } from "../db/schema";
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
    let matchingsBaseObject
    if (userId) {
        const [user] = await db.select().from(users).where(eq(users.userId, userId))
        if (!user) {
            return c.json(
                { success: false, message: "User not found" },
                404,
            );
        }
        const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid))
        matchingsBaseObject = await db.select().from(matchings).where(and(eq(matchings.membershipUuid, membership.membershipUuid), eq(matchings.isValid, 1)))
    } else {
        matchingsBaseObject = await db.select().from(matchings).where(eq(matchings.isValid, 1))
    }
    const matchingsObject = await Promise.all(matchingsBaseObject.map(async (matching) => {
        const [matchingMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, matching.membershipUuid))
        const [matchingUser] = await db.select().from(users).where(eq(users.userUuid, matchingMembership.userUuid))
        const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, matchingMembership.userUuid))
        const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, matchingMembership.organizationUuid))
        const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, matchingMembership.organizationUuid))
        const data = {
            matchingId: matching.matchingId,
            title: matching.title,
            description: matching.description,
            buttons: matching.buttons,
            thumbnail: matching.thumbnail,
            userId: matchingUser.userId,
            userDisplayName: userProfile.displayName,
            userAvatar: userProfile.avatar,
            organizationId: organization.organizationId,
            organizationDisplayName: organizationProfile.displayName,
            organizationAvatar: organizationProfile.avatar
        }
        return data
    }))
    return c.json(
        { success: true, data: matchingsObject }
    )
})

app.get('/:matching_id', async (c) => {
    const matchingId = c.req.param('matching_id')
    const db = drizzle(c.env.DB)
    const [matching] = await db.select().from(matchings).where(eq(matchings.matchingId, matchingId))
    if (!matching) {
        return c.json(
            { success: false, message: "Matching not found" },
            404,
        );
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, matching.membershipUuid))
    const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid))
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid))
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid))
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid))
    const data = {
        matchingId: matching.matchingId,
        title: matching.title,
        description: matching.description,
        buttons: matching.buttons,
        thumbnail: matching.thumbnail,
        userId: user.userId,
        userDisplayName: userProfile.displayName,
        userAvatar: userProfile.avatar,
        organizationId: organization.organizationId,
        organizationDisplayName: organizationProfile.displayName,
        organizationAvatar: organizationProfile.avatar
    }
    return c.json(
        { success: true, data: data }
    )
})

app.use('/', checkOrgMembership("member"))

app.post('/', zValidator('form', z.object({
    sessionUuid: z.string(),
    organizationId: z.string(),
    title: z.string(),
    description: z.string(),
    buttons: z.string()
        .transform((str) => JSON.parse(str))
        .pipe(z.object({
            content: z.string(),
            url: z.string()
        }).array()),
    thumbnail: z.instanceof(File)
}).partial({
    description: true,
    thumbnail: true
})), async (c) => {
    const { title, description, buttons, thumbnail } = await c.req.parseBody();
    const db = drizzle(c.env.DB)
    const membership = c.get("membership")
    const forwardFormData = new FormData();
    let url: string | undefined
    if (thumbnail) {
        if (thumbnail instanceof File) {
            forwardFormData.append('file', thumbnail);
        } else {
            return c.json(
                { success: false, message: "Thumbnail must be a file" },
                400
            );
        }
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
        url = data.url
    }
    const matching: typeof matchings.$inferInsert = {
        matchingUuid: crypto.randomUUID(),
        matchingId: generateId(),
        membershipUuid: membership.membershipUuid,
        title: title as string,
        description: description as string,
        buttons: JSON.parse(buttons as string) as Array<{ content: string, url: string }>,
        thumbnail: url,
    }
    await db.insert(matchings).values(matching).execute()
    return c.json(
        { success: true, matchingId: matching.matchingId },
    )
})

app.put('/:matching_id', zValidator('form', z.object({
    sessionUuid: z.string(),
    title: z.string(),
    description: z.string(),
    buttons: z.string()
        .transform((str) => JSON.parse(str))
        .pipe(z.object({
            content: z.string(),
            url: z.string()
        }).array()),
    thumbnail: z.instanceof(File)
}).partial({
    title: true,
    description: true,
    buttons: true,
    thumbnail: true
})), async (c) => {
    const { title, description, buttons, thumbnail } = await c.req.parseBody();
    const matchingId = c.req.param("matching_id")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [matching] = await db.select().from(matchings).where(eq(matchings.matchingId, matchingId))
    const [matchingMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, matching.membershipUuid))
    if (matchingMembership.userUuid != session.userUuid) {
        return c.json(
            { success: false, message: "Forbidden" },
            403,
        )
    }
    const forwardFormData = new FormData();
    let url: string | undefined
    if (thumbnail) {
        if (thumbnail instanceof File) {
            forwardFormData.append('file', thumbnail);
        } else {
            return c.json(
                { success: false, message: "Thumbnail must be a file" },
                400
            );
        }
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
        url = data.url
    }
    const newDetail = {
        title: title,
        description: description,
        buttons: JSON.parse(buttons as string) as Array<{ content: string, url: string }>,
        thumbnail: url,
        updatedAt: Math.floor(Date.now() / 1000)
    }
    const updatedDetail = Object.fromEntries(
        Object.entries(newDetail).filter(([_, value]) => value !== null)
    );
    db.update(matchings).set(updatedDetail).where(eq(matchings.matchingId, matchingId)).execute()
    return c.json(
        { success: true }
    )
})

app.put('/:matching_id/is_valid', zValidator('json', z.object({
    sessionUuid: z.string(),
})), async(c) => {
    const db = drizzle(c.env.DB)
    const matchingId = c.req.param("matching_id")
    const session = c.get("session")
    const [matching] = await db.select().from(matchings).where(eq(matchings.matchingId, matchingId))
    const [matchingMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, matching.membershipUuid))
    if (matchingMembership.userUuid != session.userUuid) {
        return c.json(
            { success: false, message: "Forbidden" },
            403,
        )
    }
    db.update(matchings).set({isValid: (matching.isValid ? 0 : 1)}).where(eq(matchings.matchingId, matchingId)).execute()
    return c.json(
        { success: true }
    )
})

export default app