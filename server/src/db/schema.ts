import { sqliteTable, text, integer, check, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm"

export const organizations = sqliteTable('organizations', 
	{
		organizationUuid: text('organization_uuid').primaryKey(),
		organizationId: text('organization_id').unique().notNull(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_organizations_organization_id").on(table.organizationId),
	]
);

export const users = sqliteTable('users', 
	{
		userUuid: text('user_uuid').primaryKey(),
		userId: text('user_id').unique().notNull(),
		hashedPassword: text('hashed_password').notNull(),
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
		isFrozen: integer('is_frozen').notNull().default(0).$type<0|1>(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_users_user_id").on(table.userId),
	]
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
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
		postUuid: text('post_uuid').notNull().references(() => posts.postUuid),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_projects_membership_uuid").on(table.membershipUuid),
		index("idx_projects_project_id").on(table.projectId),
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
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
		postUuid: text('post_uuid').notNull().references(() => posts.postUuid),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_events_membership_uuid").on(table.membershipUuid),
		index("idx_events_event_id").on(table.eventId),
		check("event_dates_check", sql`${table.endAt} > ${table.startAt}`)
	]
);

export const polls = sqliteTable('polls', 
	{
		pollUuid: text('poll_uuid').primaryKey(),
		pollId: text('poll_id').unique().notNull(),
		membershipUuid: text('membership_uuid').notNull().references(() => memberships.membershipUuid),
		title: text('title').notNull(),
		description: text('description'),
		choices: text('choices', { mode: "json" }).notNull().$type<Array<string>>(),
		thumbnail: text('thumbnail').notNull().default("/img/default/thumbnail.png"),
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
		postUuid: text('post_uuid').notNull().references(() => posts.postUuid),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_polls_membership_uuid").on(table.membershipUuid),
		index("idx_polls_poll_id").on(table.pollId),
	]
)

export const votes = sqliteTable('votes', 
	{
		voteUuid: text('vote_uuid').primaryKey(),
		pollUuid: text('poll_uuid').notNull().references(() => polls.pollUuid),
		userUuid: text('user_uuid').notNull(),
		isGuest: integer('is_guest').notNull().default(1).$type<0|1>(),
		choiceName: text('choice_name').notNull(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_votes_poll_uuid").on(table.pollUuid),
		index("idx_votes_user_uuid").on(table.userUuid),
	]
) 

export const questions = sqliteTable('questions', 
	{
		questionUuid: text('question_uuid').primaryKey(),
		questionId: text('question_id').unique().notNull(),
		membershipUuid: text('membership_uuid').notNull().references(() => memberships.membershipUuid),
		title: text('title').notNull(),
		description: text('description'),
		thumbnail: text('thumbnail').notNull().default("/img/default/thumbnail.png"),
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
		postUuid: text('post_uuid').notNull().references(() => posts.postUuid),
		bestCommentUuid: text('best_comment').references(() => comments.commentUuid),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_questions_membership_uuid").on(table.membershipUuid),
		index("idx_questions_question_id").on(table.questionId),
	]
)

export const posts = sqliteTable('posts', 
	{
		postUuid: text('post_uuid').primaryKey(),
		postType: text("post_type").notNull().$type<"project" | "event" | "poll" | "question">(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	}
)

export const comments = sqliteTable('comments', 
	{
		commentUuid: text('comment_uuid').primaryKey(),
		postUuid: text('post_uuid').notNull().references(() => posts.postUuid),
		membershipUuid: text('membership_uuid').notNull().references(() => memberships.membershipUuid),
		content: text('content').notNull(),
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_comments_membership_uuid").on(table.membershipUuid),
		index("idx_comments_post_uuid").on(table.postUuid),
	]
)

export const replies = sqliteTable('reqlies', 
	{
		replyUuid: text('reply_uuid').primaryKey(),
		commentUuid: text('comment_uuid').notNull().references(() => comments.commentUuid),
		membershipUuid: text('membership_uuid').notNull().references(() => memberships.membershipUuid),
		content: text('content').notNull(),
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("idx_replies_membership_uuid").on(table.membershipUuid),
		index("idx_replies_comment_uuid").on(table.commentUuid),
	]
)

export const notifications = sqliteTable('notifications', 
	{
		notificationUuid: text('notification_uuid').primaryKey(),
		userUuid: text('user_uuid').notNull().references(() => users.userUuid),
		content: text('content').notNull(),
		href: text('href'),
		isOpened: integer('is_accepted').notNull().default(0).$type<0|1>(),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
	},
	(table) => [
		index("idx_notifications_membership_uuid").on(table.userUuid),
	]
)

export const subscriptions = sqliteTable('subscriptions', 
	{
		subscriptionUuid: text('notification_uuid').primaryKey(),
		userUuid: text('user_uuid').notNull().references(() => users.userUuid),
		postUuid: text('post_uuid').notNull().references(() => posts.postUuid),
		createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
		isValid: integer('is_valid').notNull().default(1).$type<0|1>(),
	},
	(table) => [
		index("idx_subscriptions_user_uuid").on(table.userUuid),
		uniqueIndex('uniq_user_post').on(table.userUuid, table.postUuid),
	]
)