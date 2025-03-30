CREATE TABLE `events` (
	`event_uuid` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`buttons` text NOT NULL,
	`thumbnail` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`place` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "event_dates_check" CHECK("events"."end_at" > "events"."start_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_event_id_unique` ON `events` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_events_membership_uuid` ON `events` (`membership_uuid`);--> statement-breakpoint
CREATE TABLE `matchings` (
	`matching_uuid` text PRIMARY KEY NOT NULL,
	`matching_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`buttons` text NOT NULL,
	`thumbnail` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matchings_matching_id_unique` ON `matchings` (`matching_id`);--> statement-breakpoint
CREATE INDEX `idx_matchings_membership_uuid` ON `matchings` (`membership_uuid`);--> statement-breakpoint
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
CREATE TABLE `organizations` (
	`organization_uuid` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_organization_id_unique` ON `organizations` (`organization_id`);--> statement-breakpoint
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
	`thumbnail` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_project_id_unique` ON `projects` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_membership_uuid` ON `projects` (`membership_uuid`);--> statement-breakpoint
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
CREATE TABLE `users` (
	`user_uuid` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`hashed_password` text NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`is_frozen` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_user_id_unique` ON `users` (`user_id`);