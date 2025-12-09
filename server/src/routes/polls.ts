import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and, desc } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, polls, votes, questions, posts, comments, replies, notifications, subscriptions  } from "../db/schema";
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
    let pollsBaseObject
    if (userId) {
        const [user] = await db.select().from(users).where(eq(users.userId, userId))
        if (!user) {
            return c.json(
                { success: false, message: "User not found" },
                404,
            );
        }
        const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid))
        pollsBaseObject = await db.select().from(polls).orderBy(desc(polls.createdAt)).where(and(eq(polls.membershipUuid, membership.membershipUuid), eq(polls.isValid, 1)))
    } else {
        pollsBaseObject = await db.select().from(polls).orderBy(desc(polls.createdAt)).where(eq(polls.isValid, 1))
    }
    const pollsObject = await Promise.all(pollsBaseObject.map(async (poll) => {
        const [pollMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, poll.membershipUuid))
        const [pollUser] = await db.select().from(users).where(eq(users.userUuid, pollMembership.userUuid))
        const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, pollMembership.userUuid))
        const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, pollMembership.organizationUuid))
        const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, pollMembership.organizationUuid))
        const data = {
            pollId: poll.pollId,
            title: poll.title,
            description: poll.description,
            choices: poll.choices,
            thumbnail: poll.thumbnail,
            userId: pollUser.userId,
            userDisplayName: userProfile.displayName,
            userAvatar: userProfile.avatar,
            organizationId: organization.organizationId,
            organizationDisplayName: organizationProfile.displayName,
            organizationAvatar: organizationProfile.avatar
        }
        return data
    }))
    return c.json(
        { success: true, data: pollsObject }
    )
})

app.get('/:poll_id', async (c) => {
    const pollId = c.req.param('poll_id')
    const db = drizzle(c.env.DB)
    const [poll] = await db.select().from(polls).where(eq(polls.pollId, pollId))
    if (!poll) {
        return c.json(
            { success: false, message: "Interaction not found" },
            404,
        );
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, poll.membershipUuid))
    const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid))
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid))
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid))
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid))
    const pollVotes = await db.select().from(votes).where(eq(votes.pollUuid, poll.pollUuid))
    const pollChoices = poll.choices.map((name: string) => ({ name, count: pollVotes.filter(v => v.choiceName === name).length }));
    const data = {
        pollId: poll.pollId,
        title: poll.title,
        description: poll.description,
        pollChoices: pollChoices,
        thumbnail: poll.thumbnail,
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

app.post('/:poll_id/vote', zValidator('json', z.object({
    choiceName: z.string().optional().nullable(),
    sessionUuid: z.string().optional().nullable(),
    clientUuid: z.string().optional().nullable()
})), async(c) => {
    const { choiceName, clientUuid } = c.req.valid('json')
    const pollId = c.req.param('poll_id')
    const userUuid = c.get("session")?.userUuid || clientUuid
    if (!userUuid) {
        return c.json(
            { success: false, message: "Session Uuid is required" },
            400,
        )
    }
    const db = drizzle(c.env.DB)
    const [user] = await db.select().from(users).where(eq(users.userUuid, userUuid))
    const [poll] = await db.select().from(polls).where(eq(polls.pollId, pollId))
    if (!poll) {
        return c.json(
            { success: false, message: "Interaction not found" },
            404,
        );
    }
    const [vote] = await db.select().from(votes).where(and(eq(votes.pollUuid, poll.pollUuid), eq(votes.userUuid, userUuid)))
    if (!choiceName) {
        return c.json(
            { success: true, data: { choiceName: vote?.choiceName }}
        )
    }
    if (!vote) {
        const voteData: typeof votes.$inferInsert = {
            voteUuid: crypto.randomUUID(),
            pollUuid: poll.pollUuid,
            userUuid: userUuid,
            isGuest: user ? 1 : 0,
            choiceName: choiceName,
        }
        await db.insert(votes).values(voteData).execute()
        return c.json(
            { success: true },
        )
    }
    await db.update(votes).set({choiceName: choiceName, updatedAt: Math.floor(Date.now() / 1000)}).where(and(eq(votes.pollUuid, poll.pollUuid), eq(votes.userUuid, userUuid))).execute()
    return c.json(
        { success: true }
    )
})

app.use('/', checkOrgMembership("member"))

app.post('/', zValidator('form', z.object({
    sessionUuid: z.string(),
    organizationId: z.string(),
    title: z.string(),
    description: z.string(),
    choices: z.string()
        .transform((str) => JSON.parse(str))
        .pipe(z.string().array().nonempty()),
    thumbnail: z.instanceof(File)
}).partial({
    description: true,
    thumbnail: true
})), async (c) => {
    const { title, description, choices, thumbnail } = await c.req.parseBody();
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
    const postUuid = crypto.randomUUID()
    const post: typeof posts.$inferInsert = {
        postUuid: postUuid,
        postType: "poll"
    }
    await db.insert(posts).values(post).execute()
    const poll: typeof polls.$inferInsert = {
        pollUuid: crypto.randomUUID(),
        pollId: generateId(),
        membershipUuid: membership.membershipUuid,
        title: title as string,
        description: description as string,
        choices: JSON.parse(choices as string) as Array<string>,
        thumbnail: url,
        postUuid: postUuid
    }
    await db.insert(polls).values(poll).execute()
    const subscription: typeof subscriptions.$inferInsert = {
        subscriptionUuid: crypto.randomUUID(),
        userUuid: membership.userUuid,
        postUuid: postUuid,
    }
    await db.insert(subscriptions).values(subscription).execute()
    return c.json(
        { success: true, pollId: poll.pollId },
    )
})

app.put('/:poll_id', zValidator('form', z.object({
    sessionUuid: z.string(),
    title: z.string(),
    description: z.string(),
    choices: z.string()
        .transform((str) => JSON.parse(str))
        .pipe(z.string().array()),
    thumbnail: z.instanceof(File)
}).partial({
    title: true,
    description: true,
    choices: true,
    thumbnail: true
})), async (c) => {
    const { title, description, choices, thumbnail } = await c.req.parseBody();
    const pollId = c.req.param("poll_id")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [poll] = await db.select().from(polls).where(eq(polls.pollId, pollId))
    const [pollMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, poll.membershipUuid))
    if (pollMembership.userUuid != session.userUuid) {
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
        choices: JSON.parse(choices as string) as Array<string>,
        thumbnail: url,
        updatedAt: Math.floor(Date.now() / 1000)
    }
    const updatedDetail = Object.fromEntries(
        Object.entries(newDetail).filter(([_, value]) => value !== null)
    );
    await db.update(polls).set(updatedDetail).where(eq(polls.pollId, pollId)).execute()
    const postsSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.postUuid, poll.postUuid))
    const newNotifications: typeof notifications.$inferInsert[] = postsSubscriptions.map(postSubscription => ({
        notificationUuid: crypto.randomUUID(),
        userUuid: postSubscription.userUuid,
        content: `投票:${poll.title}にあらたな変更がありました。`,
        href: `/polls/${poll.pollId}`
    }))
    await db.insert(notifications).values(newNotifications).execute()
    return c.json(
        { success: true }
    )
})

app.put('/:poll_id/is_valid', zValidator('json', z.object({
    sessionUuid: z.string(),
})), async(c) => {
    const db = drizzle(c.env.DB)
    const pollId = c.req.param("poll_id")
    const session = c.get("session")
    const [poll] = await db.select().from(polls).where(eq(polls.pollId, pollId))
    const [pollMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, poll.membershipUuid))
    if (pollMembership.userUuid != session.userUuid) {
        return c.json(
            { success: false, message: "Forbidden" },
            403,
        )
    }
    await db.update(polls).set({isValid: (poll.isValid ? 0 : 1)}).where(eq(polls.pollId, pollId)).execute()
    return c.json(
        { success: true }
    )
})

export default app