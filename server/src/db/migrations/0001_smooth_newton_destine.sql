PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "event_dates_check" CHECK("__new_events"."end_at" > "__new_events"."start_at")
);
--> statement-breakpoint
INSERT INTO `__new_events`("event_uuid", "event_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "start_at", "end_at", "place", "created_at", "updated_at") SELECT "event_uuid", "event_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "start_at", "end_at", "place", "created_at", "updated_at" FROM `events`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
ALTER TABLE `__new_events` RENAME TO `events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `events_event_id_unique` ON `events` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_events_membership_uuid` ON `events` (`membership_uuid`);--> statement-breakpoint
CREATE TABLE `__new_matchings` (
	`matching_uuid` text PRIMARY KEY NOT NULL,
	`matching_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`buttons` text NOT NULL,
	`thumbnail` text DEFAULT '/img/default/thumbnail.png' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_matchings`("matching_uuid", "matching_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "created_at", "updated_at") SELECT "matching_uuid", "matching_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "created_at", "updated_at" FROM `matchings`;--> statement-breakpoint
DROP TABLE `matchings`;--> statement-breakpoint
ALTER TABLE `__new_matchings` RENAME TO `matchings`;--> statement-breakpoint
CREATE UNIQUE INDEX `matchings_matching_id_unique` ON `matchings` (`matching_id`);--> statement-breakpoint
CREATE INDEX `idx_matchings_membership_uuid` ON `matchings` (`membership_uuid`);--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`project_uuid` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`buttons` text NOT NULL,
	`thumbnail` text DEFAULT '/img/default/thumbnail.png' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_projects`("project_uuid", "project_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "created_at", "updated_at") SELECT "project_uuid", "project_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "created_at", "updated_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_project_id_unique` ON `projects` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_membership_uuid` ON `projects` (`membership_uuid`);