import { Hono, Context } from 'hono';
import routes from './routes';
import { sessionChecker } from './middlewares/auth'
import { organizations, users, memberships, profiles, sessions, projects, events, matchings } from "./db/schema"

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

app.onError((e, c) => {
    console.error('Error:', e);
    return c.json(
        { success: false, message: e.message || 'Internal Server Error' },
        500
    );
});

app.use("*", async(c: Context<Env>, next) => {
    if (c.req.method == "GET") {
        return next()
    }
    if (c.req.path.startsWith('/auth/sign_in')) {
        return next()
    }
    return sessionChecker(c, next)
})

app.route('/', routes);

export type AppType = typeof app
export default app