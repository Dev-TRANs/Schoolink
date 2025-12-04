DROP TABLE `votes`;
DROP TABLE `events`;--> statement-breakpoint
DROP TABLE `polls`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint

CREATE TABLE `comments2` (
	`comment_uuid` text PRIMARY KEY NOT NULL,
	`post_uuid` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`content` text NOT NULL,
	`is_accepted` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts2`(`post_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_comments_membership_uuid` ON `comments2` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_comments_post_uuid` ON `comments2` (`post_uuid`);--> statement-breakpoint
CREATE TABLE `events2` (
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
	FOREIGN KEY (`post_uuid`) REFERENCES `posts2`(`post_uuid`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "event_dates_check" CHECK("events2"."end_at" > "events2"."start_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events2_event_id_unique` ON `events2` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_events_membership_uuid` ON `events2` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_events_event_id` ON `events2` (`event_id`);--> statement-breakpoint
CREATE TABLE `notification2` (
	`notification_uuid` text PRIMARY KEY NOT NULL,
	`membership_uuid` text NOT NULL,
	`content` text NOT NULL,
	`href` text,
	`is_accepted` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_membership_uuid` ON `notification2` (`membership_uuid`);--> statement-breakpoint
CREATE TABLE `polls2` (
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
	FOREIGN KEY (`post_uuid`) REFERENCES `posts2`(`post_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `polls2_poll_id_unique` ON `polls2` (`poll_id`);--> statement-breakpoint
CREATE INDEX `idx_polls_membership_uuid` ON `polls2` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_polls_poll_id` ON `polls2` (`poll_id`);--> statement-breakpoint
CREATE TABLE `posts2` (
	`post_uuid` text PRIMARY KEY NOT NULL,
	`post_type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects2` (
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
	FOREIGN KEY (`post_uuid`) REFERENCES `posts2`(`post_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects2_project_id_unique` ON `projects2` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_membership_uuid` ON `projects2` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_projects_project_id` ON `projects2` (`project_id`);--> statement-breakpoint
CREATE TABLE `questions2` (
	`question_uuid` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`thumbnail` text DEFAULT '/img/default/thumbnail.png' NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`post_uuid` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts2`(`post_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questions2_question_id_unique` ON `questions2` (`question_id`);--> statement-breakpoint
CREATE INDEX `idx_questions_membership_uuid` ON `questions2` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_questions_question_id` ON `questions2` (`question_id`);--> statement-breakpoint
CREATE TABLE `reqlies2` (
	`reply_uuid` text PRIMARY KEY NOT NULL,
	`comment_uuid` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`content` text NOT NULL,
	`is_accepted` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`comment_uuid`) REFERENCES `comments2`(`comment_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_replies_membership_uuid` ON `reqlies2` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_replies_comment_uuid` ON `reqlies2` (`comment_uuid`);--> statement-breakpoint
CREATE TABLE `votes2` (
	`vote_uuid` text PRIMARY KEY NOT NULL,
	`poll_uuid` text NOT NULL,
	`user_uuid` text NOT NULL,
	`is_guest` integer DEFAULT 1 NOT NULL,
	`choice_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`poll_uuid`) REFERENCES `polls2`(`poll_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_votes_poll_uuid` ON `votes2` (`poll_uuid`);--> statement-breakpoint
CREATE INDEX `idx_votes_user_uuid` ON `votes2` (`user_uuid`);--> statement-breakpoint