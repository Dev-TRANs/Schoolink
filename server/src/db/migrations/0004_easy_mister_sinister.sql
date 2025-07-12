CREATE TABLE `polls` (
	`poll_uuid` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`choices` text NOT NULL,
	`thumbnail` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `polls_poll_id_unique` ON `polls` (`poll_id`);--> statement-breakpoint
CREATE INDEX `idx_polls_membership_uuid` ON `polls` (`membership_uuid`);--> statement-breakpoint
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