-- Columns may already exist after a partial apply of an earlier ADD COLUMN version.
-- Prefer ensure-storefront-migration.ts to mark this applied when present.
-- For DBs that still lack the columns, rebuild siteSetting with defaults.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE IF EXISTS `__new_siteSetting`;--> statement-breakpoint
CREATE TABLE `__new_siteSetting` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`siteName` text NOT NULL,
	`siteUrl` text,
	`siteSubtitle` text,
	`logo` text,
	`logoIcon` text,
	`notice` text,
	`supportContact` text,
	`footerText` text,
	`orderNotice` text,
	`headCode` text,
	`footerCode` text,
	`registrationEnabled` integer DEFAULT false NOT NULL,
	`timezone` text DEFAULT 'Asia/Shanghai' NOT NULL,
	`storefrontLayout` text DEFAULT 'classic' NOT NULL,
	`storefrontSkin` text DEFAULT 'default' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);--> statement-breakpoint
INSERT INTO `__new_siteSetting`("id", "siteName", "siteUrl", "siteSubtitle", "logo", "logoIcon", "notice", "supportContact", "footerText", "orderNotice", "headCode", "footerCode", "registrationEnabled", "timezone", "storefrontLayout", "storefrontSkin", "createdAt", "updatedAt") SELECT "id", "siteName", "siteUrl", "siteSubtitle", "logo", "logoIcon", "notice", "supportContact", "footerText", "orderNotice", "headCode", "footerCode", "registrationEnabled", "timezone", 'classic', 'default', "createdAt", "updatedAt" FROM `siteSetting`;--> statement-breakpoint
DROP TABLE `siteSetting`;--> statement-breakpoint
ALTER TABLE `__new_siteSetting` RENAME TO `siteSetting`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
