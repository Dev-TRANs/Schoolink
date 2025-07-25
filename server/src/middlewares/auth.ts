import { Context, Next, MiddlewareHandler } from 'hono';
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, polls, votes } from "../db/schema";
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

export const sessionChecker = (isGuestAllowed: boolean = false): MiddlewareHandler<Env> => async (c: Context<Env>, next: Next) => {
    if (c.req.method == "GET") {
        return next()
    }
    let sessionUuid: string;
    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        const body = await c.req.parseBody();
        sessionUuid = (body?.sessionUuid as string)?.toLowerCase();
    } else if (contentType.includes('application/json')) {
        const jsonBody = await c.req.json();
        sessionUuid = (jsonBody?.sessionUuid as string)?.toLowerCase();
    } else {
        return c.json({ success: false, message: "Unsupported Content-Type" }, 415);
    }
    if(!sessionUuid){
        if(!isGuestAllowed) return c.json(
            { success: false, message: "Session Uuid is required" },
            401,
        );
        const jsonBody = await c.req.json();
        const clientUuid = (jsonBody?.clientUuid as string)?.toLowerCase(); 
        if(!clientUuid) return c.json(
            { success: false, message: "Session Uuid is required" },
            401,
        );
        return next()
    }
    const db = drizzle(c.env.DB)
    const [ session ] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { success: false, message: "Invalid session" },
        401,
      );
    }
    c.set("session", session)
    return next()
}