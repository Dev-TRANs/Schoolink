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
ALTER TABLE `questions` ADD `best_comment` text REFERENCES comments(comment_uuid);