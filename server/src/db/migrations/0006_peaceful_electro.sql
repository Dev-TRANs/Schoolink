PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_polls` (
	`poll_uuid` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`choices` text NOT NULL,
	`thumbnail` text DEFAULT '/img/default/thumbnail.png' NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_polls`("poll_uuid", "poll_id", "membership_uuid", "title", "description", "choices", "thumbnail", "is_valid", "created_at", "updated_at") SELECT "poll_uuid", "poll_id", "membership_uuid", "title", "description", "choices", "thumbnail", "is_valid", "created_at", "updated_at" FROM `polls`;--> statement-breakpoint
DROP TABLE `polls`;--> statement-breakpoint
ALTER TABLE `__new_polls` RENAME TO `polls`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `polls_poll_id_unique` ON `polls` (`poll_id`);--> statement-breakpoint
CREATE INDEX `idx_polls_membership_uuid` ON `polls` (`membership_uuid`);