ALTER TABLE `comments2` RENAME TO `comments`;--> statement-breakpoint
ALTER TABLE `events2` RENAME TO `events`;--> statement-breakpoint
ALTER TABLE `notification2` RENAME TO `notifications`;--> statement-breakpoint
ALTER TABLE `polls2` RENAME TO `polls`;--> statement-breakpoint
ALTER TABLE `posts2` RENAME TO `posts`;--> statement-breakpoint
ALTER TABLE `projects2` RENAME TO `projects`;--> statement-breakpoint
ALTER TABLE `questions2` RENAME TO `questions`;--> statement-breakpoint
ALTER TABLE `reqlies2` RENAME TO `reqlies`;--> statement-breakpoint
ALTER TABLE `votes2` RENAME TO `votes`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`comment_uuid` text PRIMARY KEY NOT NULL,
	`post_uuid` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`content` text NOT NULL,
	`is_accepted` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts`(`post_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_comments`("comment_uuid", "post_uuid", "membership_uuid", "content", "is_accepted", "created_at", "updated_at") SELECT "comment_uuid", "post_uuid", "membership_uuid", "content", "is_accepted", "created_at", "updated_at" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_comments_membership_uuid` ON `comments` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_comments_post_uuid` ON `comments` (`post_uuid`);--> statement-breakpoint
CREATE TABLE `__new_events` (
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
	CONSTRAINT "event_dates_check" CHECK("__new_events"."end_at" > "__new_events"."start_at")
);
--> statement-breakpoint
INSERT INTO `__new_events`("event_uuid", "event_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "start_at", "end_at", "place", "is_valid", "post_uuid", "created_at", "updated_at") SELECT "event_uuid", "event_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "start_at", "end_at", "place", "is_valid", "post_uuid", "created_at", "updated_at" FROM `events`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
ALTER TABLE `__new_events` RENAME TO `events`;--> statement-breakpoint
CREATE UNIQUE INDEX `events_event_id_unique` ON `events` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_events_membership_uuid` ON `events` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_events_event_id` ON `events` (`event_id`);--> statement-breakpoint
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
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_uuid`) REFERENCES `posts`(`post_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_questions`("question_uuid", "question_id", "membership_uuid", "title", "description", "thumbnail", "is_valid", "post_uuid", "created_at", "updated_at") SELECT "question_uuid", "question_id", "membership_uuid", "title", "description", "thumbnail", "is_valid", "post_uuid", "created_at", "updated_at" FROM `questions`;--> statement-breakpoint
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
	`is_accepted` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`comment_uuid`) REFERENCES `comments`(`comment_uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_reqlies`("reply_uuid", "comment_uuid", "membership_uuid", "content", "is_accepted", "created_at", "updated_at") SELECT "reply_uuid", "comment_uuid", "membership_uuid", "content", "is_accepted", "created_at", "updated_at" FROM `reqlies`;--> statement-breakpoint
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
CREATE INDEX `idx_votes_user_uuid` ON `votes` (`user_uuid`);