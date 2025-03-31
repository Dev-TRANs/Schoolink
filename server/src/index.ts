import { Hono } from "hono";
import { env } from 'hono/adapter'
import { drizzle } from "drizzle-orm/d1";
import { eq, or, and } from "drizzle-orm";
import { organizations, users, memberships, profiles, sessions, projects, events, matchings } from "./db/schema";
import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

//TODO: org, user: paramの反映（put/post）
//TODO: user 権限回り未設定

type Bindings = {
  DB: D1Database;
  SCRIPT_ID: string;
};

const generateId = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const app = new Hono<{ Bindings: Bindings }>();

//TODO: sessionの無効化処理（期限）
//TODO: projects他のorganizationsによる検索

app.post("/auth/sign_in", zValidator('json', z.object({
  userId: z.string(),
  hashedPassword: z.string(),
})), async (c: any) => {
  try {
    const { userId, hashedPassword } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).execute()
    if (!user) {
      return c.json(
        { isSuccessful: false, message: "user not found" },
        404,
      );
    }
    if (user.hashedPassword != hashedPassword) {
      return c.json(
        { isSuccessful: false, message: "incorrect password" },
        401,
      );
    }
    const session = {
      sessionUuid: crypto.randomUUID(),
      userUuid: user.userUuid,
      userAgent: c.req.header('User-Agent'),
      ipAddress: c.req.header('X-Forwarded-For'),
      expiresAt: Math.floor(new Date().setMonth(new Date().getMonth() + 1) / 1000),
    }
    await db.insert(sessions).values(session).execute();
    return c.json(
      { isSuccessful: true, userUuid: user.userUuid, sessionUuid: session.sessionUuid }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.post("/auth/sign_out", zValidator('json', z.object({
  sessionUuid: z.string(),
})), async (c: any) => {
  try {
    const { sessionUuid } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    await db.update(sessions).set({ isValid: 0 }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.post("/auth/create_account", zValidator('json', z.object({
  newUserId: z.string(),
  organizationId: z.string(),
  hashedPassword: z.string(),
  displayName: z.string(),
  sessionUuid: z.string(),
})), async (c: any) => {
  try {
    const { newUserId, organizationId, hashedPassword, displayName, sessionUuid } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [requesterMembership] = await db.select().from(memberships).where(eq(memberships.userUuid, session.userUuid)).execute()
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute()
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    if (requesterMembership.role != "admin" || requesterMembership.organizationUuid != organization.organizationUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    const user = {
      userUuid: crypto.randomUUID(),
      userId: newUserId,
      hashedPassword: hashedPassword,
    }
    const profile = {
      profileUuid: crypto.randomUUID(),
      profileType: "user",
      organizationUuid: null,
      userUuid: user.userUuid,
      displayName: displayName,
      bio: null,
      avatar: "/img/default/avatar.png",
      instagramId: null,
      threadsId: null,
      twitterId: null
    }
    const membership = {
      membershipUuid: crypto.randomUUID(),
      organizationUuid: organization.organizationUuid,
      userUuid: user.userUuid,
      role: "member"
    }
    await db.insert(users).values(user).execute()
    //@ts-ignore
    await db.insert(profiles).values(profile).execute()
    //@ts-ignore
    await db.insert(memberships).values(membership).execute()
    return c.json(
      { isSuccessful: true },
      500,
    );
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.post("/auth/change_password", zValidator('json', z.object({
  sessionUuid: z.string(),
  hashedCurrentPassword: z.string(),
  hashedNewPassword: z.string(),
})), async (c: any) => {
  try {
    const { sessionUuid, hashedCurrentPassword, hashedNewPassword } = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [user] = await db.select().from(users).where(eq(users.userUuid, session.userUuid)).execute()
    if (user.hashedPassword != hashedCurrentPassword) {
      return c.json(
        { isSuccessful: false, message: "incorrect password" },
        401,
      );
    }
    await db.update(users).set({hashedPassword: hashedNewPassword}).where(eq(users.userUuid, session.userUuid)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.get("/organizations/:organization_id", async (c) => {
  try {
    const organizationId = c.req.param('organization_id')
    const db = drizzle(c.env.DB)
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute()
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    const [ profile ] = await db.select().from(profiles).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    const data = {
      organizationId: organization.organizationId,
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar,
      instagramId: profile.instagramId,
      threadsId: profile.threadsId,
      twitterId: profile.twitterId
    }
    return c.json(
      { isSuccessful: true, data: data }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put("/organizations/:organization_id", zValidator('json', z.object({
  sessionUuid: z.string(),
  organizationId: z.string(),
  displayName: z.string(),
  bio: z.string(),
  instagramId: z.string(),
  threadsId: z.string(),
  twitterId: z.string()
})), async (c: any) => {
  try {
    const { sessionUuid, organizationId, displayName, bio, instagramId, threadsId, twitterId } = c.req.valid("json")
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, session.userUuid)).execute()
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute()
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    if (membership.role != "admin" || membership.organizationUuid != organization.organizationUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    const newProfile = {
      displayName: displayName, 
      bio: bio,
      instagramId: instagramId,
      threadsId: threadsId,
      twitterId: twitterId,
      updatedAt: Math.floor(Date.now() / 1000)
    }
    const updatedProfile = Object.fromEntries(
      Object.entries(newProfile).filter(([_, value]) => value !== null)
    );
    db.update(profiles).set(updatedProfile).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put("/organizations/:organization_id/id", zValidator('json', z.object({
  sessionUuid: z.string(),
  organizationCurrentId: z.string(),
  organizationNewId: z.string()
})), async (c: any) => {
  try {
    const { sessionUuid, organizationCurrentId, organizationNewId } = c.req.valid("json")
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, session.userUuid)).execute()
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationCurrentId)).execute()
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    if (membership.role != "admin" || membership.organizationUuid != organization.organizationUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    db.update(organizations).set({organizationId: organizationNewId}).where(eq(organizations.organizationId, organizationCurrentId)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put("/organizations/:organization_id/avatar", async (c: any) => {
  try {
    const formData = await c.req.formData();
    const sessionUuid = formData.get('sessionUuid')
    const organizationId = formData.get('organizationId')
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, session.userUuid)).execute()
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute()
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    if (membership.role != "admin" || membership.organizationUuid != organization.organizationUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    const file = formData.get('avatar');
    const forwardFormData = new FormData();
    forwardFormData.append('file', file);
    forwardFormData.append('scriptId',c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: 'POST',
      body: forwardFormData,
    });
    const data: any = await response.json();
    if (!response.ok) {
      return c.json(
        { isSuccessful: false, message:`Image API Error (${response.status}): ${data.error}` },
        500,
      );
    }
    db.update(profiles).set({avatar: data.url}).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.get("/users/:user_id", async (c) => {
  try {
    const userId = c.req.param('user_id')
    const db = drizzle(c.env.DB)
    const [ user ] = await db.select().from(users).where(eq(users.userId, userId)).execute()
    if (!user) {
      return c.json(
        { isSuccessful: false, message: "user not found" },
        404,
      );
    }
    const [ profile ] = await db.select().from(profiles).where(eq(profiles.userUuid, user.userUuid)).execute()
    const [ membership ] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid)).execute()
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid)).execute()
    const [ organizationProfile ] = await db.select().from(profiles).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    const data = {
      userId: user.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar,
      instagramId: profile.instagramId,
      threadsId: profile.threadsId,
      twitterId: profile.twitterId,
      organizationId: organization.organizationId,
      organizationDisplayName: organizationProfile.displayName,
      organizationAvatar: organizationProfile.avatar,
      role: membership.role
    }
    return c.json(
      { isSuccessful: true, data: data }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put("/users/:user_id", zValidator('json', z.object({
  sessionUuid: z.string(),
  displayName: z.string(),
  bio: z.string(),
  instagramId: z.string(),
  threadsId: z.string(),
  twitterId: z.string()
})), async (c: any) => {
  try {
    const { sessionUuid, displayName, bio, instagramId, threadsId, twitterId } = c.req.valid("json")
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const newProfile = {
      displayName: displayName, 
      bio: bio,
      instagramId: instagramId,
      threadsId: threadsId,
      twitterId: twitterId,
      updatedAt: Math.floor(Date.now() / 1000)
    }
    const updatedProfile = Object.fromEntries(
      Object.entries(newProfile).filter(([_, value]) => value !== null)
    );
    db.update(profiles).set(updatedProfile).where(eq(profiles.userUuid, session.userUuid)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put("/users/:user_id/id", zValidator('json', z.object({
  sessionUuid: z.string(),
  userNewId: z.string()
})), async (c: any) => {
  try {
    const { sessionUuid, userNewId } = c.req.valid("json")
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    db.update(users).set({userId: userNewId}).where(eq(users.userUuid, session.userUuid)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put("/users/:user_id/avatar", async (c: any) => {
  try {
    const formData = await c.req.formData();
    const sessionUuid = formData.get('sessionUuid')
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const file = formData.get('avatar');
    const forwardFormData = new FormData();
    forwardFormData.append('file', file);
    forwardFormData.append('scriptId',c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: 'POST',
      body: forwardFormData,
    });
    const data: any = await response.json();
    if (!response.ok) {
      return c.json(
        { isSuccessful: false, message:`Image API Error (${response.status}): ${data.error}` },
        500,
      );
    }
    db.update(profiles).set({avatar: data.url}).where(eq(profiles.userUuid, session.userUuid)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put("/users/:user_id/role", zValidator('json', z.object({
  sessionUuid: z.string(),
  targetUserId: z.string(),
  organizationId: z.string(),
})), async(c: any) => {
  try {
    const { sessionUuid, targetUserId, organizationId } = c.req.valid("json")
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [requesterMembership] = await db.select().from(memberships).where(eq(memberships.userUuid, session.userUuid)).execute()
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute()
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    if (requesterMembership.role != "admin" || requesterMembership.organizationUuid != organization.organizationUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    const [targetUser] = await db.select().from(users).where(eq(users.userId, targetUserId)).execute()
    if (!targetUser) {
      return c.json(
        { isSuccessful: false, message: "user not found" },
        404,
      );
    }
    const [targetMembership] = await db.select().from(memberships).where(eq(memberships.userUuid, targetUser.userUuid)).execute()
    if (targetMembership.organizationUuid != requesterMembership.organizationUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    //@ts-ignore
    db.update(memberships).set({role: (targetMembership.role == "member" ? "admin" : "member")}).where(eq(memberships.userUuid, targetUser.userUuid)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put("/users/:user_id/is_valid", zValidator('json', z.object({
  sessionUuid: z.string(),
  targetUserId: z.string(),
  organizationId: z.string(),
})), async(c: any) => {
  try {
    const { sessionUuid, targetUserId, organizationId } = c.req.valid("json")
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [requesterMembership] = await db.select().from(memberships).where(eq(memberships.userUuid, session.userUuid)).execute()
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute()
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    if (requesterMembership.role != "admin" || requesterMembership.organizationUuid != organization.organizationUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    const [targetUser] = await db.select().from(users).where(eq(users.userId, targetUserId)).execute()
    if (!targetUser) {
      return c.json(
        { isSuccessful: false, message: "user not found" },
        404,
      );
    }
    //@ts-ignore
    db.update(users).set({isValid: (targetUser.isValid == 1 ? 0 : 1)}).where(eq(users.userUuid, targetUser.userUuid)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.get("/users", zValidator('query', z.object({
  organizationId: z.string(),
}).required()), async (c: any) => {
  try {
    const { organizationId } = c.req.valid('query')
    const db = drizzle(c.env.DB)
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute()
    const [ organizationProfile ] = await db.select().from(profiles).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute()
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    const membershipObject = await db.select().from(memberships).where(eq(memberships.organizationUuid, organization.organizationUuid))
    const usersObject = await Promise.all(membershipObject.map(async (membership) => {
      const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid)).execute()
      const [ profile ] = await db.select().from(profiles).where(eq(profiles.userUuid, user.userUuid)).execute()
      const data = {
        userId: user.userId,
        displayName: profile.displayName,
        bio: profile.bio,
        avatar: profile.avatar,
        instagramId: profile.instagramId,
        threadsId: profile.threadsId,
        twitterId: profile.twitterId,
        organizationId: organization.organizationId,
        organizationDisplayName: organizationProfile.displayName,
        organizationAvatar: organizationProfile.avatar,
        role: membership.role
      }
      return data
    }))
    return c.json(
      { isSuccessful: true, data: usersObject }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.get("/projects", zValidator('query', z.object({
  userId: z.string(),
}).partial()), async (c: any) => {
  try {
    const { userId } = c.req.valid('query')
    const db = drizzle(c.env.DB)
    let projectsBaseObject
    if (userId) {
      const [ user ] = await db.select().from(users).where(eq(users.userId, userId))
      if (!user) {
        return c.json(
          { isSuccessful: false, message: "user not found" },
          404,
        );
      }
      const [ membership ] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid))
      projectsBaseObject = await db.select().from(projects).where(eq(projects.membershipUuid, membership.membershipUuid))
    } else {
      projectsBaseObject = await db.select().from(projects)
    }
    const projectsObject = await Promise.all(projectsBaseObject.map(async(project) => {
      const [ projectMembership ] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid))
      const [ projectUser ] = await db.select().from(users).where(eq(users.userUuid, projectMembership.userUuid))
      const [ userProfile ] = await db.select().from(profiles).where(eq(profiles.userUuid, projectMembership.userUuid))
      const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationUuid, projectMembership.organizationUuid))
      const [ organizationProfile ] = await db.select().from(profiles).where(eq(profiles.organizationUuid, projectMembership.organizationUuid))
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
      { isSuccessful: true, data: projectsObject }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.get('/projects/:project_id', async (c) => {
  try {
    const projectId = c.req.param('project_id')
    const db = drizzle(c.env.DB)
    const [ project ] = await db.select().from(projects).where(eq(projects.projectId, projectId))
    if (!project) {
      return c.json(
        { isSuccessful: false, message: "project not found" },
        404,
      );
    } 
    const [ membership ] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid))
    const [ user ] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid))
    const [ userProfile ] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid))
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid))
    const [ organizationProfile ] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid))
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
      { isSuccessful: true, data: data }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.post('/projects', async(c: any) => {
  try {
    const formData = await c.req.formData();
    const sessionUuid = formData.get('sessionUuid')
    const organizationId = formData.get('organizationId')
    const title = formData.get('title')
    const description = formData.get('description')
    const buttons = formData.get('buttons')
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [ user ] = await db.select().from(users).where(eq(users.userUuid, session.userUuid))
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId))
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    const [ membership ] = await db.select().from(memberships).where(and(eq(memberships.userUuid, user.userUuid), eq(memberships.organizationUuid, organization.organizationUuid)))
    const file = formData.get('thumbnail')
    const forwardFormData = new FormData();
    forwardFormData.append('file', file);
    forwardFormData.append('scriptId',c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: 'POST',
      body: forwardFormData,
    });
    const data: any = await response.json();
    if (!response.ok) {
      return c.json(
        { isSuccessful: false, message:`Image API Error (${response.status}): ${data.error}` },
        500,
      );
    }
    const project = {
      projectUuid: crypto.randomUUID(),
      projectId: generateId(),
      membershipUuid: membership.membershipUuid,
      title: title,
      description: description,
      buttons: buttons,
      thumbnail: data.url,
    }
    await db.insert(projects).values(project).execute()
    return c.json(
      { isSuccessful: true, projectId: project.projectId }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put('/projects/:project_id', async(c: any) => {
  try {
    const formData = await c.req.formData();
    const sessionUuid = formData.get('sessionUuid')
    const title = formData.get('title')
    const description = formData.get('description')
    const buttons = formData.get('buttons')
    const projectId = c.req.param("project_id")
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [project] = await db.select().from(projects).where(eq(projects.projectId, projectId))
    const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid))
    if (membership.userUuid != session.userUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    const file = formData.get('thumbnail')
    let thumbnail = null
    if(file){
      const forwardFormData = new FormData();
      forwardFormData.append('file', file);
      forwardFormData.append('scriptId',c.env.SCRIPT_ID);
      const response = await fetch("https://image.stki.org/", {
        method: 'POST',
        body: forwardFormData,
      });
      const data: any = await response.json();
      if (!response.ok) {
        return c.json(
          { isSuccessful: false, message:`Image API Error (${response.status}): ${data.error}` },
          500,
        );
      }
      thumbnail = data.url 
    }
    const newDetail = {
      title: title,
      description: description,
      buttons: buttons,
      thumbnail: thumbnail,
    }
    const updatedDetail = Object.fromEntries(
      Object.entries(newDetail).filter(([_, value]) => value !== null)
    );
    db.update(projects).set(updatedDetail).where(eq(projects.projectId, projectId)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.get("/events", zValidator('query', z.object({
  userId: z.string(),
}).partial()), async (c: any) => {
  try {
    const { userId } = c.req.valid('query')
    const db = drizzle(c.env.DB)
    let eventsBaseObject
    if (userId) {
      const [ user ] = await db.select().from(users).where(eq(users.userId, userId))
      if (!user) {
        return c.json(
          { isSuccessful: false, message: "user not found" },
          404,
        );
      }
      const [ membership ] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid))
      eventsBaseObject = await db.select().from(events).where(eq(events.membershipUuid, membership.membershipUuid))
    } else {
      eventsBaseObject = await db.select().from(events)
    }
    const eventsObject = await Promise.all(eventsBaseObject.map(async(event) => {
      const [ eventMembership ] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid))
      const [ eventUser ] = await db.select().from(users).where(eq(users.userUuid, eventMembership.userUuid))
      const [ userProfile ] = await db.select().from(profiles).where(eq(profiles.userUuid, eventMembership.userUuid))
      const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationUuid, eventMembership.organizationUuid))
      const [ organizationProfile ] = await db.select().from(profiles).where(eq(profiles.organizationUuid, eventMembership.organizationUuid))
      const data = {
        eventId: event.eventId,
        title: event.title,
        description: event.description,
        buttons: event.buttons,
        thumbnail: event.thumbnail,
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
      { isSuccessful: true, data: eventsObject }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.get('/events/:event_id', async (c) => {
  try {
    const eventId = c.req.param('event_id')
    const db = drizzle(c.env.DB)
    const [ event ] = await db.select().from(events).where(eq(events.eventId, eventId))
    if (!event) {
      return c.json(
        { isSuccessful: false, message: "event not found" },
        404,
      );
    } 
    const [ membership ] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid))
    const [ user ] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid))
    const [ userProfile ] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid))
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid))
    const [ organizationProfile ] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid))
    const data = {
      eventId: event.eventId,
      title: event.title,
      description: event.description,
      buttons: event.buttons,
      thumbnail: event.thumbnail,
      userId: user.userId,
      userDisplayName: userProfile.displayName,
      userAvatar: userProfile.avatar,
      organizationId: organization.organizationId,
      organizationDisplayName: organizationProfile.displayName,
      organizationAvatar: organizationProfile.avatar
    }
    return c.json(
      { isSuccessful: true, data: data }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.post('/events', async(c: any) => {
  try {
    const formData = await c.req.formData();
    const sessionUuid = formData.get('sessionUuid')
    const organizationId = formData.get('organizationId')
    const title = formData.get('title')
    const description = formData.get('description')
    const buttons = formData.get('buttons')
    const startAt = formData.get('startAt')
    const endAt = formData.get('endAt')
    const place = formData.get('place')
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [ user ] = await db.select().from(users).where(eq(users.userUuid, session.userUuid))
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId))
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    const [ membership ] = await db.select().from(memberships).where(and(eq(memberships.userUuid, user.userUuid), eq(memberships.organizationUuid, organization.organizationUuid)))
    const file = formData.get('thumbnail')
    const forwardFormData = new FormData();
    forwardFormData.append('file', file);
    forwardFormData.append('scriptId',c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: 'POST',
      body: forwardFormData,
    });
    const data: any = await response.json();
    if (!response.ok) {
      return c.json(
        { isSuccessful: false, message:`Image API Error (${response.status}): ${data.error}` },
        500,
      );
    }
    const event = {
      eventUuid: crypto.randomUUID(),
      eventId: generateId(),
      membershipUuid: membership.membershipUuid,
      title: title,
      description: description,
      buttons: buttons,
      thumbnail: data.url,
      startAt: startAt,
      endAt: endAt,
      place: place
    }
    await db.insert(events).values(event).execute()
    return c.json(
      { isSuccessful: true, eventId: event.eventId }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put('/events/:event_id', async(c: any) => {
  try {
    const formData = await c.req.formData();
    const sessionUuid = formData.get('sessionUuid')
    const title = formData.get('title')
    const description = formData.get('description')
    const buttons = formData.get('buttons')
    const startAt = formData.get('startAt')
    const endAt = formData.get('endAt')
    const place = formData.get('place')
    const eventId = c.req.param("event_id")
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [event] = await db.select().from(events).where(eq(events.eventId, eventId))
    const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid))
    if (membership.userUuid != session.userUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    const file = formData.get('thumbnail')
    let thumbnail = null
    if(file){
      const forwardFormData = new FormData();
      forwardFormData.append('file', file);
      forwardFormData.append('scriptId',c.env.SCRIPT_ID);
      const response = await fetch("https://image.stki.org/", {
        method: 'POST',
        body: forwardFormData,
      });
      const data: any = await response.json();
      if (!response.ok) {
        return c.json(
          { isSuccessful: false, message:`Image API Error (${response.status}): ${data.error}` },
          500,
        );
      }
      thumbnail = data.url 
    }
    const newDetail = {
      title: title,
      description: description,
      buttons: buttons,
      thumbnail: thumbnail,
      startAt: startAt,
      endAt: endAt,
      place: place
    }
    const updatedDetail = Object.fromEntries(
      Object.entries(newDetail).filter(([_, value]) => value !== null)
    );
    db.update(events).set(updatedDetail).where(eq(events.eventId, eventId)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.get("/matchings", zValidator('query', z.object({
  userId: z.string(),
}).partial()), async (c: any) => {
  try {
    const { userId } = c.req.valid('query')
    const db = drizzle(c.env.DB)
    let matchingsBaseObject
    if (userId) {
      const [ user ] = await db.select().from(users).where(eq(users.userId, userId))
      if (!user) {
        return c.json(
          { isSuccessful: false, message: "user not found" },
          404,
        );
      }
      const [ membership ] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid))
      matchingsBaseObject = await db.select().from(matchings).where(eq(matchings.membershipUuid, membership.membershipUuid))
    } else {
      matchingsBaseObject = await db.select().from(matchings)
    }
    const matchingsObject = await Promise.all(matchingsBaseObject.map(async(matching) => {
      const [ matchingMembership ] = await db.select().from(memberships).where(eq(memberships.membershipUuid, matching.membershipUuid))
      const [ matchingUser ] = await db.select().from(users).where(eq(users.userUuid, matchingMembership.userUuid))
      const [ userProfile ] = await db.select().from(profiles).where(eq(profiles.userUuid, matchingMembership.userUuid))
      const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationUuid, matchingMembership.organizationUuid))
      const [ organizationProfile ] = await db.select().from(profiles).where(eq(profiles.organizationUuid, matchingMembership.organizationUuid))
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
      { isSuccessful: true, data: matchingsObject }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.get('/matchings/:matching_id', async (c) => {
  try {
    const matchingId = c.req.param('matching_id')
    const db = drizzle(c.env.DB)
    const [ matching ] = await db.select().from(matchings).where(eq(matchings.matchingId, matchingId))
    if (!matching) {
      return c.json(
        { isSuccessful: false, message: "matching not found" },
        404,
      );
    } 
    const [ membership ] = await db.select().from(memberships).where(eq(memberships.membershipUuid, matching.membershipUuid))
    const [ user ] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid))
    const [ userProfile ] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid))
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid))
    const [ organizationProfile ] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid))
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
      { isSuccessful: true, data: data }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.post('/matchings', async(c: any) => {
  try {
    const formData = await c.req.formData();
    const sessionUuid = formData.get('sessionUuid')
    const organizationId = formData.get('organizationId')
    const title = formData.get('title')
    const description = formData.get('description')
    const buttons = formData.get('buttons')
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [ user ] = await db.select().from(users).where(eq(users.userUuid, session.userUuid))
    const [ organization ] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId))
    if (!organization) {
      return c.json(
        { isSuccessful: false, message: "organization not found" },
        404,
      );
    }
    const [ membership ] = await db.select().from(memberships).where(and(eq(memberships.userUuid, user.userUuid), eq(memberships.organizationUuid, organization.organizationUuid)))
    const file = formData.get('thumbnail')
    const forwardFormData = new FormData();
    forwardFormData.append('file', file);
    forwardFormData.append('scriptId',c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: 'POST',
      body: forwardFormData,
    });
    const data: any = await response.json();
    if (!response.ok) {
      return c.json(
        { isSuccessful: false, message:`Image API Error (${response.status}): ${data.error}` },
        500,
      );
    }
    const matching = {
      matchingUuid: crypto.randomUUID(),
      matchingId: generateId(),
      membershipUuid: membership.membershipUuid,
      title: title,
      description: description,
      buttons: buttons,
      thumbnail: data.url,
    }
    await db.insert(matchings).values(matching).execute()
    return c.json(
      { isSuccessful: true, matchingId: matching.matchingId }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

app.put('/matchings/:matching_id', async(c: any) => {
  try {
    const formData = await c.req.formData();
    const sessionUuid = formData.get('sessionUuid')
    const title = formData.get('title')
    const description = formData.get('description')
    const buttons = formData.get('buttons')
    const matchingId = c.req.param("matching_id")
    const db = drizzle(c.env.DB)
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    if (!session || !session.isValid) {
      return c.json(
        { isSuccessful: false, message: "invalid session" },
        401,
      );
    }
    await db.update(sessions).set({ lastActiveAt: Math.floor(Date.now() / 1000) }).where(eq(sessions.sessionUuid, sessionUuid)).execute()
    const [matching] = await db.select().from(matchings).where(eq(matchings.matchingId, matchingId))
    const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, matching.membershipUuid))
    if (membership.userUuid != session.userUuid) {
      return c.json(
        { isSuccessful: false, message: "forbidden" },
        403,
      )
    }
    const file = formData.get('thumbnail')
    let thumbnail = null
    if(file){
      const forwardFormData = new FormData();
      forwardFormData.append('file', file);
      forwardFormData.append('scriptId',c.env.SCRIPT_ID);
      const response = await fetch("https://image.stki.org/", {
        method: 'POST',
        body: forwardFormData,
      });
      const data: any = await response.json();
      if (!response.ok) {
        return c.json(
          { isSuccessful: false, message:`Image API Error (${response.status}): ${data.error}` },
          500,
        );
      }
      thumbnail = data.url 
    }
    const newDetail = {
      title: title,
      description: description,
      buttons: buttons,
      thumbnail: thumbnail,
    }
    const updatedDetail = Object.fromEntries(
      Object.entries(newDetail).filter(([_, value]) => value !== null)
    );
    db.update(matchings).set(updatedDetail).where(eq(matchings.matchingId, matchingId)).execute()
    return c.json(
      { isSuccessful: true }
    )
  } catch (e: any) {
    return c.json(
      { isSuccessful: false, message: e.message },
      500,
    );
  }
})

export type AppType = typeof app

export default new Hono().route('/', app);