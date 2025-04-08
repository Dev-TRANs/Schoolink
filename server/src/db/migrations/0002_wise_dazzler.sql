ALTER TABLE `events` ADD `is_valid` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `matchings` ADD `is_valid` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `is_valid` integer DEFAULT 1 NOT NULL;