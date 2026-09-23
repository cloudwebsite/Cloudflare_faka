CREATE TABLE `site_article` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`summary` text,
	`coverImage` text,
	`bodyHtml` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`publishedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX `site_article_type_slug_unique` ON `site_article` (`type`,`slug`);--> statement-breakpoint
CREATE INDEX `site_article_type_status_pin_sort_idx` ON `site_article` (`type`,`status`,`pinned`,`sort`,`publishedAt`);
