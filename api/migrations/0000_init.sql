CREATE TABLE `admins` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  `updated_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_id` text NOT NULL REFERENCES `admins`(`id`) ON DELETE CASCADE,
  `token_hash` text NOT NULL UNIQUE,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE `media_assets` (
  `id` text PRIMARY KEY NOT NULL,
  `key` text NOT NULL UNIQUE,
  `kind` text NOT NULL,
  `filename` text NOT NULL,
  `content_type` text NOT NULL,
  `byte_size` integer NOT NULL,
  `width` integer,
  `height` integer,
  `duration_seconds` integer,
  `created_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE `posts` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `markdown` text NOT NULL,
  `html` text NOT NULL,
  `excerpt` text NOT NULL,
  `status` text NOT NULL DEFAULT 'draft',
  `cover_media_id` text REFERENCES `media_assets`(`id`) ON DELETE SET NULL,
  `published_at` text,
  `updated_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  `reading_time` integer NOT NULL DEFAULT 1,
  `toc_json` text NOT NULL DEFAULT '[]'
);

CREATE TABLE `tags` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL UNIQUE
);

CREATE TABLE `post_tags` (
  `post_id` text NOT NULL REFERENCES `posts`(`id`) ON DELETE CASCADE,
  `tag_id` text NOT NULL REFERENCES `tags`(`id`) ON DELETE CASCADE,
  PRIMARY KEY (`post_id`, `tag_id`)
);

CREATE TABLE `visits` (
  `id` text PRIMARY KEY NOT NULL,
  `path` text NOT NULL,
  `post_id` text REFERENCES `posts`(`id`) ON DELETE SET NULL,
  `referrer` text,
  `ip` text,
  `user_agent` text,
  `country` text,
  `region` text,
  `city` text,
  `colo` text,
  `device` text,
  `screen` text,
  `language` text,
  `created_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX `sessions_token_hash_idx` ON `sessions` (`token_hash`);
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);
CREATE INDEX `posts_status_published_at_idx` ON `posts` (`status`, `published_at`);
CREATE INDEX `posts_slug_idx` ON `posts` (`slug`);
CREATE INDEX `media_assets_created_at_idx` ON `media_assets` (`created_at`);
CREATE INDEX `visits_created_at_idx` ON `visits` (`created_at`);
CREATE INDEX `visits_path_idx` ON `visits` (`path`);
