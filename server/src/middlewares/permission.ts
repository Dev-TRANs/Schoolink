import { Context, Next, MiddlewareHandler } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, matchings } from "../db/schema";
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
    const { organizationId } = await c.req.json()
    const db = drizzle(c.env.DB)
    const session = c.get("session")
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId.toLowerCase()))
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