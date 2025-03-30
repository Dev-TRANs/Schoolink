import { sqliteTable, text, integer, check, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm"

export const organizations = sqliteTable('organizations', 
	{
		organizationUuid: text('organization_uuid').primaryKey(),
		organizationId: text('organization_id').unique().notNull(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
	}
);

export const users = sqliteTable('users', 
	{
		userUuid: text('user_uuid').primaryKey(),
		userId: text('user_id').unique().notNull(),
		hashedPassword: text('hashed_password').notNull(),
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
		isFrozen: integer('is_frozen').notNull().default(0).$type<0|1>(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
	}
);

// Users - Organizations Junction Table
export const memberships = sqliteTable('memberships', 
	{
		membershipUuid: text('membership_uuid').primaryKey(),
		organizationUuid: text('organization_uuid').notNull().references(() => organizations.organizationUuid, { onDelete: 'cascade' }),
		userUuid: text("user_uuid").notNull().references(() => users.userUuid, { onDelete: "cascade" }),
		role: text("role").notNull().$type<"admin" | "member">(),
		joinedAt: integer('joined_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		uniqueIndex('uniq_user_org').on(table.userUuid, table.organizationUuid),
		index("idx_memberships_user_uuid").on(table.userUuid),
		index("idx_memberships_organization_uuid").on(table.organizationUuid),
	]
);

export const profiles = sqliteTable(
	"profiles", 
	{
  		profileUuid: text("profile_uuid").primaryKey(),
  		profileType: text("profile_type").notNull().$type<"organization" | "user">(),
  		organizationUuid: text("organization_uuid").references(() => organizations.organizationUuid, { onDelete: "cascade" }),
  		userUuid: text("user_uuid").references(() => users.userUuid, { onDelete: "cascade" }),
  		displayName: text("display_name").notNull(),
  		bio: text("bio"),
  		avatar: text("avatar").notNull().default("/img/default/avatar.png"),
  		instagramId: text("instagram_id"),
  		threadsId: text("threads_id"),
  		twitterId: text("twitter_id"),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		check("profile_check", sql`
			(${table.profileType} = 'organization' AND ${table.organizationUuid} IS NOT NULL AND ${table.userUuid} IS NULL) 
    		OR 
    		(${table.profileType} = 'user' AND ${table.userUuid} IS NOT NULL AND ${table.organizationUuid} IS NULL)
		`),
		index("idx_profiles_user_uuid").on(table.userUuid),
    	index("idx_profiles_organization_uuid").on(table.organizationUuid),
	]
);

export const sessions = sqliteTable('sessions', 
	{
		sessionUuid: text('session_uuid').primaryKey(),
		userUuid: text("user_uuid").notNull().references(() => users.userUuid, { onDelete: "cascade" }),
		userAgent: text("user_agent"),
		ipAddress: text("ip_address"),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		expiresAt: integer('expires_at').notNull(),
		lastActiveAt: integer('last_active_at').notNull().default(sql`(unixepoch())`),
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
	},
	(table) => [
		index("idx_sessions_user_uuid").on(table.userUuid),
	]
);

export const projects = sqliteTable('projects', 
	{
		projectUuid: text('project_uuid').primaryKey(),
		projectId: text('project_id').unique().notNull(),
		membershipUuid: text('membership_uuid').notNull().references(() => memberships.membershipUuid),
		title: text('title').notNull(),
		description: text('description'),
		buttons: text('buttons', { mode: "json" }).notNull().$type<Array<{ content: string; url: string }>>(),
		thumbnail: text('thumbnail').notNull().default("/img/default/thumbnail.png"),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_projects_membership_uuid").on(table.membershipUuid),
	]
);

export const events = sqliteTable('events', 
	{
		eventUuid: text('event_uuid').primaryKey(),
		eventId: text('event_id').unique().notNull(),
		membershipUuid: text('membership_uuid').notNull().references(() => memberships.membershipUuid),
		title: text('title').notNull(),
		description: text('description'),
		buttons: text('buttons', { mode: "json" }).notNull().$type<Array<{ content: string; url: string }>>(),
		thumbnail: text('thumbnail').notNull().default("/img/default/thumbnail.png"),
		startAt: integer('start_at').notNull(),
		endAt: integer('end_at').notNull(),
		place: text('place').notNull(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_events_membership_uuid").on(table.membershipUuid),
		check("event_dates_check", sql`${table.endAt} > ${table.startAt}`)
	]
);

export const matchings = sqliteTable('matchings', 
	{
		matchingUuid: text('matching_uuid').primaryKey(),
		matchingId: text('matching_id').unique().notNull(),
		membershipUuid: text('membership_uuid').notNull().references(() => memberships.membershipUuid),
		title: text('title').notNull(),
		description: text('description'),
		buttons: text('buttons', { mode: "json" }).notNull().$type<Array<{ content: string; url: string }>>(),
		thumbnail: text('thumbnail').notNull().default("/img/default/thumbnail.png"),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_matchings_membership_uuid").on(table.membershipUuid),
	]
);
