import { Hono, Context } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and, desc } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, polls, votes, posts } from "../db/schema";
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
    let projectsBaseObject
    if (userId) {
        const [user] = await db.select().from(users).where(eq(users.userId, userId))
        if (!user) {
            return c.json(
                { success: false, message: "User not found" },
                404,
            );
        }
        const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid))
        projectsBaseObject = await db.select().from(projects).orderBy(desc(projects.createdAt)).where(and(eq(projects.membershipUuid, membership.membershipUuid), eq(projects.isValid, 1)))
    } else {
        projectsBaseObject = await db.select().from(projects).orderBy(desc(projects.createdAt)).where(eq(projects.isValid, 1))
    }
    const projectsObject = await Promise.all(projectsBaseObject.map(async (project) => {
        const [projectMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid))
        const [projectUser] = await db.select().from(users).where(eq(users.userUuid, projectMembership.userUuid))
        const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, projectMembership.userUuid))
        const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, projectMembership.organizationUuid))
        const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, projectMembership.organizationUuid))
        const data = {
            projectId: project.projectId,
            title: project.title,
            description: project.description,
            buttons: project.buttons,
            thumbnail: project.thumbnail,
            userId: projectUser.userId,
            userDisplayName: userProfile.displayName,
            userAvatar: userProfile.avatar,
            organizationId: organization.organizationId,
            organizationDisplayName: organizationProfile.displayName,
            organizationAvatar: organizationProfile.avatar
        }
        return data
    }))
    return c.json(
        { success: true, data: projectsObject }
    )
})

app.get('/:project_id', async (c) => {
    const projectId = c.req.param('project_id')
    const db = drizzle(c.env.DB)
    const [project] = await db.select().from(projects).where(eq(projects.projectId, projectId))
    if (!project) {
        return c.json(
            { success: false, message: "Project not found" },
            404,
        );
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid))
    const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid))
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid))
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid))
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid))
    const data = {
        projectId: project.projectId,
        title: project.title,
        description: project.description,
        buttons: project.buttons,
        thumbnail: project.thumbnail,
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
    const postUuid = crypto.randomUUID()
    const post: typeof posts.$inferInsert = {
        postUuid: postUuid,
        postType: "project"
    }
    await db.insert(posts).values(post).execute()
    const project: typeof projects.$inferInsert = {
        projectUuid: crypto.randomUUID(),
        projectId: generateId(),
        membershipUuid: membership.membershipUuid,
        title: title as string,
        description: description as string,
        buttons: JSON.parse(buttons as string) as Array<{ content: string, url: string }>,
        thumbnail: url,
        postUuid: postUuid
    }
    await db.insert(projects).values(project).execute()
    return c.json(
        { success: true, projectId: project.projectId },
    )
})

app.put('/:project_id', zValidator('form', z.object({
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
    const projectId = c.req.param("project_id")
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [project] = await db.select().from(projects).where(eq(projects.projectId, projectId))
    const [projectMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid))
    if (projectMembership.userUuid != session.userUuid) {
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
    await db.update(projects).set(updatedDetail).where(eq(projects.projectId, projectId)).execute()
    return c.json(
        { success: true }
    )
})

app.put('/:project_id/is_valid', zValidator('json', z.object({
    sessionUuid: z.string(),
})), async(c) => {
    const db = drizzle(c.env.DB)
    const projectId = c.req.param("project_id")
    const session = c.get("session")
    const [project] = await db.select().from(projects).where(eq(projects.projectId, projectId))
    const [projectMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid))
    if (projectMembership.userUuid != session.userUuid) {
        return c.json(
            { success: false, message: "Forbidden" },
            403,
        )
    }
    await db.update(projects).set({isValid: (project.isValid ? 0 : 1)}).where(eq(projects.projectId, projectId)).execute()
    return c.json(
        { success: true }
    )
})

export default app