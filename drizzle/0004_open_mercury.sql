ALTER TABLE `settings` ADD `amount_presets` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `min_amount_cents` integer;--> statement-breakpoint
ALTER TABLE `settings` ADD `max_amount_cents` integer;--> statement-breakpoint
ALTER TABLE `settings` ADD `default_public` integer;--> statement-breakpoint
ALTER TABLE `settings` ADD `show_total_count` integer;--> statement-breakpoint
ALTER TABLE `settings` ADD `show_total_amount` integer;--> statement-breakpoint
ALTER TABLE `settings` ADD `avatar_style` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `charge_expires_in_seconds` integer;