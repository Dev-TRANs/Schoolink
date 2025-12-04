ALTER TABLE `reqlies` RENAME COLUMN "is_accepted" TO "is_valid";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_comments_membership_uuid` ON `comments` (`membership_uuid`);--> statement-breakpoint
CREATE INDEX `idx_comments_post_uuid` ON `comments` (`post_uuid`);