import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, polls, votes } from "../db/schema";
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
    let eventsBaseObject
    if (userId) {
        const [user] = await db.select().from(users).where(eq(users.userId, userId))
        if (!user) {
            return c.json(
                { success: false, message: "User not found" },
                404,
            );
        }
        const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid))
        eventsBaseObject = await db.select().from(events).where(and(eq(events.membershipUuid, membership.membershipUuid), eq(events.isValid, 1)))
    } else {
        eventsBaseObject = await db.select().from(events).where(eq(events.isValid, 1))
    }
    const eventsObject = await Promise.all(eventsBaseObject.map(async (event) => {
        const [eventMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid))
        const [eventUser] = await db.select().from(users).where(eq(users.userUuid, eventMembership.userUuid))
        const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, eventMembership.userUuid))
        const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, eventMembership.organizationUuid))
        const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, eventMembership.organizationUuid))
        const data = {
            eventId: event.eventId,
            title: event.title,
            description: event.description,
            buttons: event.buttons,
            thumbnail: event.thumbnail,
            place: event.place,
            startAt: event.startAt,
            endAt: event.endAt,
            userId: eventUser.userId,
            userDisplayName: userProfile.displayName,
            userAvatar: userProfile.avatar,
            organizationId: organization.organizationId,
            organizationDisplayName: organizationProfile.displayName,
            organizationAvatar: organizationProfile.avatar
        }
        return data
    }))
    return c.json(
        { success: true, data: eventsObject }
    )
})

app.get('/:event_id', async (c) => {
    const eventId = c.req.param('event_id')
    const db = drizzle(c.env.DB)
    const [event] = await db.select().from(events).where(eq(events.eventId, eventId))
    if (!event) {
        return c.json(
            { success: false, message: "Event not found" },
            404,
        );
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid))
    const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid))
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid))
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid))
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid))
    const data = {
        eventId: event.eventId,
        title: event.title,
        description: event.description,
        buttons: event.buttons,
        thumbnail: event.thumbnail,
        place: event.place,
        startAt: event.startAt,
        endAt: event.endAt,
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
    thumbnail: z.instanceof(File),
    startAt: z.string(),
    endAt: z.string(),
    place: z.string()
}).partial({
    description: true,
    thumbnail: true
})), async (c) => {
    const { title, description, buttons, thumbnail, startAt, endAt, place } = await c.req.parseBody();
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
    const event: typeof events.$inferInsert = {
        eventUuid: crypto.randomUUID(),
        eventId: generateId(),
        membershipUuid: membership.membershipUuid,
        title: title as string,
        description: description as string,
        buttons: JSON.parse(buttons as string) as Array<{ content: string, url: string }>,
        thumbnail: url,
        startAt: Number(startAt),
        endAt: Number(endAt),
        place: place as string
    }
    await db.insert(events).values(event).execute()
    return c.json(
        { success: true, eventId: event.eventId },
    )
})

app.put('/:event_id', zValidator('form', z.object({
    sessionUuid: z.string(),
    title: z.string(),
    description: z.string(),
    buttons: z.string()
        .transform((str) => JSON.parse(str))
        .pipe(z.object({
            content: z.string(),
            url: z.string()
        }).array()),
    thumbnail: z.instanceof(File),
    startAt: z.string(),
    endAt: z.string(),
    place: z.string()
}).partial({
    title: true,
    description: true,
    buttons: true,
    thumbnail: true,
    startAt: true,
    endAt: true,
    place: true
})), async (c) => {
    const { title, description, buttons, thumbnail, startAt, endAt, place } = await c.req.parseBody();
    const eventId = c.req.param("event_id")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [event] = await db.select().from(events).where(eq(events.eventId, eventId))
    const [eventMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid))
    if (eventMembership.userUuid != session.userUuid) {
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
        startAt: startAt && Number(startAt),
        endAt: endAt && Number(endAt),
        place: place,
        updatedAt: Math.floor(Date.now() / 1000)
    }
    const updatedDetail = Object.fromEntries(
        Object.entries(newDetail).filter(([_, value]) => value !== null)
    );
    await db.update(events).set(updatedDetail).where(eq(events.eventId, eventId)).execute()
    return c.json(
        { success: true }
    )
})

app.put('/:event_id/is_valid', zValidator('json', z.object({
    sessionUuid: z.string(),
})), async(c) => {
    const db = drizzle(c.env.DB)
    const eventId = c.req.param("event_id")
    const session = c.get("session")
    const [event] = await db.select().from(events).where(eq(events.eventId, eventId))
    const [eventMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid))
    if (eventMembership.userUuid != session.userUuid) {
        return c.json(
            { success: false, message: "Forbidden" },
            403,
        )
    }
    await db.update(events).set({isValid: (event.isValid ? 0 : 1)}).where(eq(events.eventId, eventId)).execute()
    return c.json(
        { success: true }
    )
})

export default app