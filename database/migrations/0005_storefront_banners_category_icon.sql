ALTER TABLE `category` ADD `icon` text;--> statement-breakpoint
CREATE TABLE `storefront_banner` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`imageUrl` text NOT NULL,
	`linkUrl` text,
	`sort` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `storefront_banner_status_sort_idx` ON `storefront_banner` (`status`,`sort`);
