CREATE TABLE `telegramSupportConfig` (
	`id` integer PRIMARY KEY NOT NULL,
	`isEnabled` integer DEFAULT false NOT NULL,
	`configJson` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `telegramSupportSession` (
	`chatId` text PRIMARY KEY NOT NULL,
	`state` text DEFAULT 'idle' NOT NULL,
	`pendingOrderNo` text,
	`updatedAt` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `telegramSupportSession_updatedAt_idx` ON `telegramSupportSession` (`updatedAt`);
