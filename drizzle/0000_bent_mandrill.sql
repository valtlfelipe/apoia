CREATE TABLE `supports` (
	`id` text PRIMARY KEY NOT NULL,
	`correlation_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_charge_id` text,
	`product_slug` text,
	`amount_cents` integer NOT NULL,
	`paid_amount_cents` integer,
	`display_name` text,
	`message` text,
	`is_public` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`br_code` text,
	`qr_code_image` text,
	`payment_link_url` text,
	`expires_at` integer,
	`paid_at` integer,
	`last_polled_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `supports_status_paid_at_idx` ON `supports` (`status`,`paid_at`);--> statement-breakpoint
CREATE INDEX `supports_product_slug_idx` ON `supports` (`product_slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `supports_correlation_id_unique` ON `supports` (`correlation_id`);--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_key` text NOT NULL,
	`provider` text NOT NULL,
	`event` text NOT NULL,
	`payload` text NOT NULL,
	`received_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_events_event_key_unique` ON `webhook_events` (`event_key`);