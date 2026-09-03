CREATE TABLE `settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`creator_name` text,
	`creator_short_name` text,
	`creator_tagline` text,
	`creator_avatar_url` text,
	`creator_links` text,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "settings_single_row" CHECK("settings"."id" = 1)
);
