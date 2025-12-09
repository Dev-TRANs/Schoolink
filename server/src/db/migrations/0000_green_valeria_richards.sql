CREATE TABLE `comments` (
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
CREATE INDEX `idx_comments_membership_uuid` ON `comments` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_comments_post_uuid` ON `comments` (`post_uuid`);--> statement-breakpoint
CREATE TABLE `events` (
	`event_uuid` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`buttons` text NOT NULL,
	`thumbnail` text DEFAULT '/img/default/thumbnail.png' NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`place` text NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`post_uuid` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts`(`post_uuid`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "event_dates_check" CHECK("events"."end_at" > "events"."start_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_event_id_unique` ON `events` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_events_membership_uuid` ON `events` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_events_event_id` ON `events` (`event_id`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`membership_uuid` text PRIMARY KEY NOT NULL,
	`organization_uuid` text NOT NULL,
	`user_uuid` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_uuid`) REFERENCES `organizations`(`organization_uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_uuid`) REFERENCES `users`(`user_uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_user_org` ON `memberships` (`user_uuid`,`organization_uuid`);--> statement-breakpoint
CREATE INDEX `idx_memberships_user_uuid` ON `memberships` (`user_uuid`);--> statement-breakpoint
CREATE INDEX `idx_memberships_organization_uuid` ON `memberships` (`organization_uuid`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`notification_uuid` text PRIMARY KEY NOT NULL,
	`membership_uuid` text NOT NULL,
	`content` text NOT NULL,
	`href` text,
	`is_accepted` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_membership_uuid` ON `notifications` (`membership_uuid`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`organization_uuid` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_organization_id_unique` ON `organizations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_organizations_organization_id` ON `organizations` (`organization_id`);--> statement-breakpoint
CREATE TABLE `polls` (
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
CREATE UNIQUE INDEX `polls_poll_id_unique` ON `polls` (`poll_id`);--> statement-breakpoint
CREATE INDEX `idx_polls_membership_uuid` ON `polls` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_polls_poll_id` ON `polls` (`poll_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`post_uuid` text PRIMARY KEY NOT NULL,
	`post_type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
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
			("profiles"."profile_type" = 'organization' AND "profiles"."organization_uuid" IS NOT NULL AND "profiles"."user_uuid" IS NULL) 
    		OR 
    		("profiles"."profile_type" = 'user' AND "profiles"."user_uuid" IS NOT NULL AND "profiles"."organization_uuid" IS NULL)
		)
);
--> statement-breakpoint
CREATE INDEX `idx_profiles_user_uuid` ON `profiles` (`user_uuid`);--> statement-breakpoint
CREATE INDEX `idx_profiles_organization_uuid` ON `profiles` (`organization_uuid`);--> statement-breakpoint
CREATE TABLE `projects` (
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
CREATE UNIQUE INDEX `projects_project_id_unique` ON `projects` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_membership_uuid` ON `projects` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_projects_project_id` ON `projects` (`project_id`);--> statement-breakpoint
CREATE TABLE `questions` (
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
CREATE UNIQUE INDEX `questions_question_id_unique` ON `questions` (`question_id`);--> statement-breakpoint
CREATE INDEX `idx_questions_membership_uuid` ON `questions` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_questions_question_id` ON `questions` (`question_id`);--> statement-breakpoint
CREATE TABLE `reqlies` (
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
CREATE INDEX `idx_replies_membership_uuid` ON `reqlies` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_replies_comment_uuid` ON `reqlies` (`comment_uuid`);--> statement-breakpoint
CREATE TABLE `sessions` (
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
CREATE INDEX `idx_sessions_user_uuid` ON `sessions` (`user_uuid`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`notification_uuid` text PRIMARY KEY NOT NULL,
	`membership_uuid` text NOT NULL,
	`post_uuid` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts`(`post_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_subscriptions_membership_uuid` ON `subscriptions` (`membership_uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_membership_post` ON `subscriptions` (`membership_uuid`,`post_uuid`);--> statement-breakpoint
CREATE TABLE `users` (
	`user_uuid` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`hashed_password` text NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`is_frozen` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_user_id_unique` ON `users` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_users_user_id` ON `users` (`user_id`);--> statement-breakpoint
CREATE TABLE `votes` (
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
CREATE INDEX `idx_votes_poll_uuid` ON `votes` (`poll_uuid`);--> statement-breakpoint
CREATE INDEX `idx_votes_user_uuid` ON `votes` (`user_uuid`);