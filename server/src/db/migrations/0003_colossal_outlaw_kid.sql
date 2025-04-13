ALTER TABLE `matchings` RENAME TO `interactions`;--> statement-breakpoint
ALTER TABLE `interactions` RENAME COLUMN "matching_uuid" TO "interaction_uuid";--> statement-breakpoint
ALTER TABLE `interactions` RENAME COLUMN "matching_id" TO "interaction_id";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_interactions` (
	`interaction_uuid` text PRIMARY KEY NOT NULL,
	`interaction_id` text NOT NULL,
	`membership_uuid` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`buttons` text NOT NULL,
	`thumbnail` text DEFAULT '/img/default/thumbnail.png' NOT NULL,
	`is_valid` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`membership_uuid`) REFERENCES `memberships`(`membership_uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_interactions`("interaction_uuid", "interaction_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "is_valid", "created_at", "updated_at") SELECT "interaction_uuid", "interaction_id", "membership_uuid", "title", "description", "buttons", "thumbnail", "is_valid", "created_at", "updated_at" FROM `interactions`;--> statement-breakpoint
DROP TABLE `interactions`;--> statement-breakpoint
ALTER TABLE `__new_interactions` RENAME TO `interactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `interactions_interaction_id_unique` ON `interactions` (`interaction_id`);--> statement-breakpoint
CREATE INDEX `idx_interactions_membership_uuid` ON `interactions` (`membership_uuid`);