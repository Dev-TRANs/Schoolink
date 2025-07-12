import { Hono, Context } from 'hono';
import routes from './routes';
import { sessionChecker } from './middlewares/auth'
import { organizations, users, memberships, profiles, sessions, projects, events, polls, votes } from "./db/schema"
import { cors } from 'hono/cors'

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

app.use(
    '*',
    cors({
        origin: ['http://localhost:5173', 'https://schoolink.stki.org'],
    })
)


app.onError((e, c) => {
    console.error('Error:', e);
    return c.json(
        { success: false, message: e.message || 'Internal Server Error' },
        500
    );
});

app.use("*", async (c: Context<Env>, next) => {
    if (c.req.method == "GET") {
        return next()
    }
    if (c.req.path.startsWith('/auth/sign_in')) {
        return next()
    }
    let isGuestAllowed = false
    if (c.req.path.endsWith('vote')) {
        isGuestAllowed = true
    }
    return sessionChecker(isGuestAllowed)(c, next)
})

app.route('/', routes);

export type AppType = typeof app
export default app