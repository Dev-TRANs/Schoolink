import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, interactions } from "../db/schema";
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
    let interactionsBaseObject
    if (userId) {
        const [user] = await db.select().from(users).where(eq(users.userId, userId))
        if (!user) {
            return c.json(
                { success: false, message: "User not found" },
                404,
            );
        }
        const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid))
        interactionsBaseObject = await db.select().from(interactions).where(and(eq(interactions.membershipUuid, membership.membershipUuid), eq(interactions.isValid, 1)))
    } else {
        interactionsBaseObject = await db.select().from(interactions).where(eq(interactions.isValid, 1))
    }
    const interactionsObject = await Promise.all(interactionsBaseObject.map(async (interaction) => {
        const [interactionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, interaction.membershipUuid))
        const [interactionUser] = await db.select().from(users).where(eq(users.userUuid, interactionMembership.userUuid))
        const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, interactionMembership.userUuid))
        const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, interactionMembership.organizationUuid))
        const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, interactionMembership.organizationUuid))
        const data = {
            interactionId: interaction.interactionId,
            title: interaction.title,
            description: interaction.description,
            buttons: interaction.buttons,
            thumbnail: interaction.thumbnail,
            userId: interactionUser.userId,
            userDisplayName: userProfile.displayName,
            userAvatar: userProfile.avatar,
            organizationId: organization.organizationId,
            organizationDisplayName: organizationProfile.displayName,
            organizationAvatar: organizationProfile.avatar
        }
        return data
    }))
    return c.json(
        { success: true, data: interactionsObject }
    )
})

app.get('/:interaction_id', async (c) => {
    const interactionId = c.req.param('interaction_id')
    const db = drizzle(c.env.DB)
    const [interaction] = await db.select().from(interactions).where(eq(interactions.interactionId, interactionId))
    if (!interaction) {
        return c.json(
            { success: false, message: "Interaction not found" },
            404,
        );
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, interaction.membershipUuid))
    const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid))
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid))
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid))
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid))
    const data = {
        interactionId: interaction.interactionId,
        title: interaction.title,
        description: interaction.description,
        buttons: interaction.buttons,
        thumbnail: interaction.thumbnail,
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
    const interaction: typeof interactions.$inferInsert = {
        interactionUuid: crypto.randomUUID(),
        interactionId: generateId(),
        membershipUuid: membership.membershipUuid,
        title: title as string,
        description: description as string,
        buttons: JSON.parse(buttons as string) as Array<{ content: string, url: string }>,
        thumbnail: url,
    }
    await db.insert(interactions).values(interaction).execute()
    return c.json(
        { success: true, interactionId: interaction.interactionId },
    )
})

app.put('/:interaction_id', zValidator('form', z.object({
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
    const interactionId = c.req.param("interaction_id")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [interaction] = await db.select().from(interactions).where(eq(interactions.interactionId, interactionId))
    const [interactionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, interaction.membershipUuid))
    if (interactionMembership.userUuid != session.userUuid) {
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
    db.update(interactions).set(updatedDetail).where(eq(interactions.interactionId, interactionId)).execute()
    return c.json(
        { success: true }
    )
})

app.put('/:interaction_id/is_valid', zValidator('json', z.object({
    sessionUuid: z.string(),
})), async(c) => {
    const db = drizzle(c.env.DB)
    const interactionId = c.req.param("interaction_id")
    const session = c.get("session")
    const [interaction] = await db.select().from(interactions).where(eq(interactions.interactionId, interactionId))
    const [interactionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, interaction.membershipUuid))
    if (interactionMembership.userUuid != session.userUuid) {
        return c.json(
            { success: false, message: "Forbidden" },
            403,
        )
    }
    db.update(interactions).set({isValid: (interaction.isValid ? 0 : 1)}).where(eq(interactions.interactionId, interactionId)).execute()
    return c.json(
        { success: true }
    )
})

export default app