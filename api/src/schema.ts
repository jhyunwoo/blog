import { relations } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    adminId: text("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("sessions_token_hash_idx").on(table.tokenHash),
    expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt)
  })
);

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    kind: text("kind", { enum: ["image", "video", "file"] }).notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
  },
  (table) => ({
    createdAtIdx: index("media_assets_created_at_idx").on(table.createdAt)
  })
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    markdown: text("markdown").notNull(),
    html: text("html").notNull(),
    excerpt: text("excerpt").notNull(),
    status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
    coverMediaId: text("cover_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    publishedAt: text("published_at"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
    readingTime: integer("reading_time").notNull().default(1),
    tocJson: text("toc_json").notNull().default("[]")
  },
  (table) => ({
    statusPublishedAtIdx: index("posts_status_published_at_idx").on(table.status, table.publishedAt),
    slugIdx: index("posts_slug_idx").on(table.slug)
  })
);

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique()
});

export const postTags = sqliteTable(
  "post_tags",
  {
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.tagId] })
  })
);

export const visits = sqliteTable(
  "visits",
  {
    id: text("id").primaryKey(),
    path: text("path").notNull(),
    postId: text("post_id").references(() => posts.id, { onDelete: "set null" }),
    referrer: text("referrer"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    colo: text("colo"),
    device: text("device"),
    screen: text("screen"),
    language: text("language"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
  },
  (table) => ({
    createdAtIdx: index("visits_created_at_idx").on(table.createdAt),
    pathIdx: index("visits_path_idx").on(table.path)
  })
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  coverMedia: one(mediaAssets, {
    fields: [posts.coverMediaId],
    references: [mediaAssets.id]
  }),
  postTags: many(postTags)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  admin: one(admins, {
    fields: [sessions.adminId],
    references: [admins.id]
  })
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags)
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id]
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id]
  })
}));
