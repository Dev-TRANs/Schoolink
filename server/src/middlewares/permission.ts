import { Context, Next, MiddlewareHandler } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, interactions } from "../db/schema";
import type { D1Database } from "@cloudflare/workers-types";

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

export const checkOrgMembership = (requiredRole = "member"): MiddlewareHandler<Env> => async (c: Context<Env>, next: Next) => {
    if (c.req.method == "GET") {
        return next()
    }
    let organizationId: string;
    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        const body = await c.req.parseBody();
        organizationId = (body?.organizationId as string)?.toLowerCase();
    } else if (contentType.includes('application/json')) {
        const jsonBody = await c.req.json();
        organizationId = (jsonBody?.organizationId as string)?.toLowerCase();
    } else {
        return c.json({ success: false, message: "Unsupported Content-Type" }, 415);
    }
    if (!organizationId) {
        organizationId = c.req.param('organization_id')
    }
    if (!organizationId) {
        return c.json({ success: false, message: "Organization ID is required" }, 400);
    }
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId.toLowerCase()))
    if (!organization) {
        return c.json(
            { success: false, message: "Organization not found" },
            404,
        );
    }
    const [ membership ] = await db.select().from(memberships).where(and(eq(memberships.userUuid, session.userUuid), eq(memberships.organizationUuid, organization.organizationUuid))).execute()
    if (!membership) {
        return c.json(
            { success: false, message: "User is not a member of this organization" },
            403
        );
    }
    c.set("membership", membership)
    c.set("organization", organization)
    if (requiredRole === "admin" && membership.role !== "admin") {
        return c.json(
            { success: false, message: "Insufficient permissions" },
            403
        );
    }
    return next()
}

export const checkUserSession: MiddlewareHandler<Env> = async (c: Context<Env>, next: Next) => {
    if (c.req.method == "GET") {
        return next()
    }
    let userId: string;
    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        const body = await c.req.parseBody();
        userId = (body?.userId as string)?.toLowerCase();
    } else if (contentType.includes('application/json')) {
        const jsonBody = await c.req.json();
        userId = (jsonBody?.userId as string)?.toLowerCase();
    } else {
        return c.json({ success: false, message: "Unsupported Content-Type" }, 415);
    }
    if (!userId) {
        userId = c.req.param('user_id')
    }
    if (!userId) {
        return c.json({ success: false, message: "User ID is required" }, 400);
    }
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).execute()
    if (user.userUuid !== session.userUuid) {
        return c.json(
            { success: false, message: "Forbidden" },
            403,
        )
    }
    return next()
}