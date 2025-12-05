PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_memberships` (
	`membership_uuid` text PRIMARY KEY NOT NULL,
	`organization_uuid` text NOT NULL,
	`user_uuid` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_uuid`) REFERENCES `organizations`(`organization_uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_uuid`) REFERENCES `users`(`user_uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_memberships`("membership_uuid", "organization_uuid", "user_uuid", "role", "joined_at") SELECT "membership_uuid", "organization_uuid", "user_uuid", "role", "joined_at" FROM `memberships`;--> statement-breakpoint
DROP TABLE `memberships`;--> statement-breakpoint
ALTER TABLE `__new_memberships` RENAME TO `memberships`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_user_org` ON `memberships` (`user_uuid`,`organization_uuid`);--> statement-breakpoint
CREATE INDEX `idx_memberships_user_uuid` ON `memberships` (`user_uuid`);--> statement-breakpoint
CREATE INDEX `idx_memberships_organization_uuid` ON `memberships` (`organization_uuid`);--> statement-breakpoint
CREATE TABLE `__new_organizations` (
	`organization_uuid` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_organizations`("organization_uuid", "organization_id", "created_at") SELECT "organization_uuid", "organization_id", "created_at" FROM `organizations`;--> statement-breakpoint
DROP TABLE `organizations`;--> statement-breakpoint
ALTER TABLE `__new_organizations` RENAME TO `organizations`;--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_organization_id_unique` ON `organizations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_organizations_organization_id` ON `organizations` (`organization_id`);--> statement-breakpoint
CREATE TABLE `__new_profiles` (
	`profile_uuid` text PRIMARY KEY NOT NULL,
	`profile_type` text NOT NULL,
	`organization_uuid` text,
	`user_uuid` text,
	`display_name` text NOT NULL,
	`bio` text,
	`avatar` text DEFAULT '/img/default/avatar.png' NOT NULL,
	`instagram_id` text,
	`threads_id` text,
	`twitter_id` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_uuid`) REFERENCES `organizations`(`organization_uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_uuid`) REFERENCES `users`(`user_uuid`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "profile_check" CHECK(
			("__new_profiles"."profile_type" = 'organization' AND "__new_profiles"."organization_uuid" IS NOT NULL AND "__new_profiles"."user_uuid" IS NULL) 
    		OR 
    		("__new_profiles"."profile_type" = 'user' AND "__new_profiles"."user_uuid" IS NOT NULL AND "__new_profiles"."organization_uuid" IS NULL)
		)
);
--> statement-breakpoint
INSERT INTO `__new_profiles`("profile_uuid", "profile_type", "organization_uuid", "user_uuid", "display_name", "bio", "avatar", "instagram_id", "threads_id", "twitter_id", "updated_at") SELECT "profile_uuid", "profile_type", "organization_uuid", "user_uuid", "display_name", "bio", "avatar", "instagram_id", "threads_id", "twitter_id", "updated_at" FROM `profiles`;--> statement-breakpoint
DROP TABLE `profiles`;--> statement-breakpoint
ALTER TABLE `__new_profiles` RENAME TO `profiles`;--> statement-breakpoint
CREATE INDEX `idx_profiles_user_uuid` ON `profiles` (`user_uuid`);--> statement-breakpoint
CREATE INDEX `idx_profiles_organization_uuid` ON `profiles` (`organization_uuid`);--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`session_uuid` text PRIMARY KEY NOT NULL,
	`user_uuid` text NOT NULL,
	`user_agent` text,
	`ip_address` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	`last_active_at` integer DEFAULT (unixepoch()) NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`user_uuid`) REFERENCES `users`(`user_uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("session_uuid", "user_uuid", "user_agent", "ip_address", "created_at", "expires_at", "last_active_at", "is_valid") SELECT "session_uuid", "user_uuid", "user_agent", "ip_address", "created_at", "expires_at", "last_active_at", "is_valid" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
CREATE INDEX `idx_sessions_user_uuid` ON `sessions` (`user_uuid`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`user_uuid` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`hashed_password` text NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`is_frozen` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("user_uuid", "user_id", "hashed_password", "is_valid", "is_frozen", "created_at") SELECT "user_uuid", "user_id", "hashed_password", "is_valid", "is_frozen", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_user_id_unique` ON `users` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_users_user_id` ON `users` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`post_uuid` text PRIMARY KEY NOT NULL,
	`post_type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_posts`("post_uuid", "post_type", "created_at", "updated_at") SELECT "post_uuid", "post_type", "created_at", "updated_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`notification_uuid` text PRIMARY KEY NOT NULL,
	`membership_uuid` text NOT NULL,
	`content` text NOT NULL,
	`href` text,
	`is_accepted` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("notification_uuid", "membership_uuid", "content", "href", "is_accepted", "created_at") SELECT "notification_uuid", "membership_uuid", "content", "href", "is_accepted", "created_at" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
CREATE INDEX `idx_notifications_membership_uuid` ON `notifications` (`membership_uuid`);--> statement-breakpoint
CREATE TABLE `__new_polls` (
	`poll_uuid` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`choices` text NOT NULL,
	`thumbnail` text DEFAULT '/img/default/thumbnail.png' NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`post_uuid` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts`(`post_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_polls`("poll_uuid", "poll_id", "membership_uuid", "title", "description", "choices", "thumbnail", "is_valid", "post_uuid", "created_at", "updated_at") SELECT "poll_uuid", "poll_id", "membership_uuid", "title", "description", "choices", "thumbnail", "is_valid", "post_uuid", "created_at", "updated_at" FROM `polls`;--> statement-breakpoint
DROP TABLE `polls`;--> statement-breakpoint
ALTER TABLE `__new_polls` RENAME TO `polls`;--> statement-breakpoint
CREATE UNIQUE INDEX `polls_poll_id_unique` ON `polls` (`poll_id`);--> statement-breakpoint
CREATE INDEX `idx_polls_membership_uuid` ON `polls` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_polls_poll_id` ON `polls` (`poll_id`);--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`project_uuid` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`buttons` text NOT NULL,
	`thumbnail` text DEFAULT '/img/default/thumbnail.png' NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`post_uuid` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts`(`post_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_projects`("project_uuid", "project_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "is_valid", "post_uuid", "created_at", "updated_at") SELECT "project_uuid", "project_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "is_valid", "post_uuid", "created_at", "updated_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_project_id_unique` ON `projects` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_membership_uuid` ON `projects` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_projects_project_id` ON `projects` (`project_id`);--> statement-breakpoint
CREATE TABLE `__new_questions` (
	`question_uuid` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`thumbnail` text DEFAULT '/img/default/thumbnail.png' NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`post_uuid` text NOT NULL,
	`best_comment` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts`(`post_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`best_comment`) REFERENCES `comments`(`comment_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_questions`("question_uuid", "question_id", "membership_uuid", "title", "description", "thumbnail", "is_valid", "post_uuid", "best_comment", "created_at", "updated_at") SELECT "question_uuid", "question_id", "membership_uuid", "title", "description", "thumbnail", "is_valid", "post_uuid", "best_comment", "created_at", "updated_at" FROM `questions`;--> statement-breakpoint
DROP TABLE `questions`;--> statement-breakpoint
ALTER TABLE `__new_questions` RENAME TO `questions`;--> statement-breakpoint
CREATE UNIQUE INDEX `questions_question_id_unique` ON `questions` (`question_id`);--> statement-breakpoint
CREATE INDEX `idx_questions_membership_uuid` ON `questions` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_questions_question_id` ON `questions` (`question_id`);--> statement-breakpoint
CREATE TABLE `__new_reqlies` (
	`reply_uuid` text PRIMARY KEY NOT NULL,
	`comment_uuid` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`content` text NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`comment_uuid`) REFERENCES `comments`(`comment_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_reqlies`("reply_uuid", "comment_uuid", "membership_uuid", "content", "is_valid", "created_at", "updated_at") SELECT "reply_uuid", "comment_uuid", "membership_uuid", "content", "is_valid", "created_at", "updated_at" FROM `reqlies`;--> statement-breakpoint
DROP TABLE `reqlies`;--> statement-breakpoint
ALTER TABLE `__new_reqlies` RENAME TO `reqlies`;--> statement-breakpoint
CREATE INDEX `idx_replies_membership_uuid` ON `reqlies` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_replies_comment_uuid` ON `reqlies` (`comment_uuid`);--> statement-breakpoint
CREATE TABLE `__new_votes` (
	`vote_uuid` text PRIMARY KEY NOT NULL,
	`poll_uuid` text NOT NULL,
	`user_uuid` text NOT NULL,
	`is_guest` integer DEFAULT 1 NOT NULL,
	`choice_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`poll_uuid`) REFERENCES `polls`(`poll_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_votes`("vote_uuid", "poll_uuid", "user_uuid", "is_guest", "choice_name", "created_at", "updated_at") SELECT "vote_uuid", "poll_uuid", "user_uuid", "is_guest", "choice_name", "created_at", "updated_at" FROM `votes`;--> statement-breakpoint
DROP TABLE `votes`;--> statement-breakpoint
ALTER TABLE `__new_votes` RENAME TO `votes`;--> statement-breakpoint
CREATE INDEX `idx_votes_poll_uuid` ON `votes` (`poll_uuid`);--> statement-breakpoint
CREATE INDEX `idx_votes_user_uuid` ON `votes` (`user_uuid`);--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`comment_uuid` text PRIMARY KEY NOT NULL,
	`post_uuid` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`content` text NOT NULL,
	`is_accepted` integer DEFAULT 0 NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts`(`post_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_comments`("comment_uuid", "post_uuid", "membership_uuid", "content", "is_accepted", "is_valid", "created_at", "updated_at") SELECT "comment_uuid", "post_uuid", "membership_uuid", "content", "is_accepted", "is_valid", "created_at", "updated_at" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
CREATE INDEX `idx_comments_membership_uuid` ON `comments` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_comments_post_uuid` ON `comments` (`post_uuid`);--> statement-breakpoint
CREATE TABLE `__new_subscriptions` (
	`notification_uuid` text PRIMARY KEY NOT NULL,
	`membership_uuid` text NOT NULL,
	`post_uuid` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts`(`post_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_subscriptions`("notification_uuid", "membership_uuid", "post_uuid", "created_at") SELECT "notification_uuid", "membership_uuid", "post_uuid", "created_at" FROM `subscriptions`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_subscriptions` RENAME TO `subscriptions`;--> statement-breakpoint
CREATE INDEX `idx_subscriptions_membership_uuid` ON `subscriptions` (`membership_uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_membership_post` ON `subscriptions` (`membership_uuid`,`post_uuid`);