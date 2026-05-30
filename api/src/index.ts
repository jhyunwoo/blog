import { postInputSchema, loginInputSchema, visitInputSchema } from "@blog/shared";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, inArray, like, lt, or } from "drizzle-orm";
import { Hono } from "hono";
import { cache } from "hono/cache";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDb } from "./db";
import { loginAdmin, logoutAdmin, requireAdmin } from "./auth";
import { createId, sha256ArrayBuffer } from "./crypto";
import { renderMarkdown } from "./markdown";
import { mapMedia, mapPostDetail, mapPostSummary, mapTag, mapVisit } from "./mappers";
import { mediaAssets, posts, postTags, tags, visits } from "./schema";
import type { AppEnv, DbMediaAsset, DbPost, DbTag } from "./types";

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.CORS_ORIGIN.split(",").map((item: string) => item.trim());
      return allowed.includes(origin) ? origin : allowed[0] ?? origin;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400
  })
);

app.get("/health", (c) => c.json({ ok: true, now: new Date().toISOString() }));

app.get(
  "/posts",
  cache({ cacheName: "tech-blog-posts", cacheControl: "public, max-age=60, s-maxage=300" }),
  async (c) => {
    const db = createDb(c.env.DB);
    const rows = await db.query.posts.findMany({
      where: eq(posts.status, "published"),
      orderBy: [desc(posts.publishedAt)],
      limit: 50
    });

    const items = await Promise.all(rows.map((post) => hydrateSummary(db, post, c.env.PUBLIC_MEDIA_BASE_URL)));
    return c.json({ items, nextCursor: null });
  }
);

app.get(
  "/posts/:slug",
  cache({ cacheName: "tech-blog-post", cacheControl: "public, max-age=60, s-maxage=600" }),
  async (c) => {
    const db = createDb(c.env.DB);
    const post = await db.query.posts.findFirst({
      where: and(eq(posts.slug, c.req.param("slug")), eq(posts.status, "published"))
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    return c.json(await hydrateDetail(db, post, c.env.PUBLIC_MEDIA_BASE_URL));
  }
);

app.get(
  "/tags",
  cache({ cacheName: "tech-blog-tags", cacheControl: "public, max-age=300, s-maxage=1800" }),
  async (c) => {
    const rows = await createDb(c.env.DB).query.tags.findMany({
      orderBy: [asc(tags.name)]
    });
    return c.json({ items: rows.map(mapTag), nextCursor: null });
  }
);

app.post("/visits", zValidator("json", visitInputSchema), async (c) => {
  const input = c.req.valid("json");
  const cf = c.req.raw.cf;
  const db = createDb(c.env.DB);

  await pruneVisits(db, c.env.VISIT_LOG_RETENTION_DAYS);

  const [visit] = await db
    .insert(visits)
    .values({
      id: createId("vis"),
      path: input.path,
      postId: input.postId ?? null,
      referrer: input.referrer ?? c.req.header("referer") ?? null,
      ip: c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? null,
      userAgent: c.req.header("user-agent") ?? null,
      country: readCfString(cf, "country"),
      region: readCfString(cf, "region"),
      city: readCfString(cf, "city"),
      colo: readCfString(cf, "colo"),
      device: c.req.header("sec-ch-ua-platform") ?? null,
      screen: input.screen ?? null,
      language: input.language ?? c.req.header("accept-language") ?? null,
      createdAt: new Date().toISOString()
    })
    .returning();

  return c.json(mapVisit(assertRow(visit, "Failed to create visit")), 201);
});

app.get("/media/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const range = parseByteRange(c.req.header("range"));
  const object = await c.env.MEDIA.get(
    key,
    range
      ? {
          range: range.length ? { offset: range.offset, length: range.length } : { offset: range.offset }
        }
      : undefined
  );

  if (!object) {
    return c.json({ error: "Media not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=31536000, immutable");

  if (range) {
    const length = range.length ?? object.size - range.offset;
    const end = range.offset + length - 1;
    headers.set("content-range", `bytes ${range.offset}-${end}/${object.size}`);
    headers.set("content-length", String(length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("content-length", String(object.size));
  return new Response(object.body, { headers });
});

app.post("/auth/login", zValidator("json", loginInputSchema), async (c) => {
  const input = c.req.valid("json");
  const admin = await loginAdmin(c, input.email, input.password);

  if (!admin) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  return c.json({ email: admin.email });
});

app.post("/auth/logout", async (c) => {
  await logoutAdmin(c);
  return c.json({ ok: true });
});

app.get("/auth/me", requireAdmin, (c) => {
  const admin = c.get("admin");
  return c.json({ email: admin.email });
});

app.use("/admin/*", requireAdmin);

app.get("/admin/posts", async (c) => {
  const query = c.req.query("q");
  const db = createDb(c.env.DB);
  const rows = await db.query.posts.findMany({
    where: query ? or(like(posts.title, `%${query}%`), like(posts.slug, `%${query}%`)) : undefined,
    orderBy: [desc(posts.updatedAt)],
    limit: 100
  });

  const items = await Promise.all(rows.map((post) => hydrateSummary(db, post, c.env.PUBLIC_MEDIA_BASE_URL)));
  return c.json({ items, nextCursor: null });
});

app.post("/admin/posts", zValidator("json", postInputSchema), async (c) => {
  const input = c.req.valid("json");
  const db = createDb(c.env.DB);
  const rendered = await renderMarkdown(input.markdown, input.excerpt);
  const now = new Date().toISOString();
  const id = createId("pst");
  const publishedAt = input.status === "published" ? now : null;

  const [post] = await db
    .insert(posts)
    .values({
      id,
      slug: input.slug,
      title: input.title,
      markdown: input.markdown,
      html: rendered.html,
      excerpt: rendered.excerpt,
      status: input.status,
      coverMediaId: input.coverMediaId ?? null,
      publishedAt,
      updatedAt: now,
      readingTime: rendered.readingTime,
      tocJson: JSON.stringify(rendered.toc)
    })
    .returning();

  const created = assertRow(post, "Failed to create post");
  await replaceTags(db, created.id, input.tagSlugs);
  return c.json(await hydrateDetail(db, created, c.env.PUBLIC_MEDIA_BASE_URL, true), 201);
});

app.get("/admin/posts/:id", async (c) => {
  const db = createDb(c.env.DB);
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, c.req.param("id"))
  });

  if (!post) {
    return c.json({ error: "Post not found" }, 404);
  }

  return c.json(await hydrateDetail(db, post, c.env.PUBLIC_MEDIA_BASE_URL, true));
});

app.put("/admin/posts/:id", zValidator("json", postInputSchema), async (c) => {
  const input = c.req.valid("json");
  const db = createDb(c.env.DB);
  const existing = await db.query.posts.findFirst({
    where: eq(posts.id, c.req.param("id"))
  });

  if (!existing) {
    return c.json({ error: "Post not found" }, 404);
  }

  const rendered = await renderMarkdown(input.markdown, input.excerpt);
  const now = new Date().toISOString();
  const [post] = await db
    .update(posts)
    .set({
      slug: input.slug,
      title: input.title,
      markdown: input.markdown,
      html: rendered.html,
      excerpt: rendered.excerpt,
      status: input.status,
      coverMediaId: input.coverMediaId ?? null,
      publishedAt: existing.publishedAt ?? (input.status === "published" ? now : null),
      updatedAt: now,
      readingTime: rendered.readingTime,
      tocJson: JSON.stringify(rendered.toc)
    })
    .where(eq(posts.id, existing.id))
    .returning();

  const updated = assertRow(post, "Failed to update post");
  await replaceTags(db, updated.id, input.tagSlugs);
  return c.json(await hydrateDetail(db, updated, c.env.PUBLIC_MEDIA_BASE_URL, true));
});

app.delete("/admin/posts/:id", async (c) => {
  await createDb(c.env.DB).delete(posts).where(eq(posts.id, c.req.param("id")));
  return c.json({ ok: true });
});

app.get("/admin/media", async (c) => {
  const rows = await createDb(c.env.DB).query.mediaAssets.findMany({
    orderBy: [desc(mediaAssets.createdAt)],
    limit: 100
  });
  return c.json({ items: rows.map((asset) => mapMedia(asset, c.env.PUBLIC_MEDIA_BASE_URL)), nextCursor: null });
});

app.post("/admin/media", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return c.json({ error: "Expected multipart field named file" }, 400);
  }

  const buffer = await file.arrayBuffer();
  const digest = await sha256ArrayBuffer(buffer);
  const kind = mediaKind(file.type);
  const extension = extensionFromName(file.name);
  const key = `${kind}/${digest}${extension}`;

  await c.env.MEDIA.put(key, buffer, {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
      contentDisposition: `inline; filename="${encodeURIComponent(file.name)}"`
    },
    customMetadata: {
      originalName: file.name
    }
  });

  const [asset] = await createDb(c.env.DB)
    .insert(mediaAssets)
    .values({
      id: createId("med"),
      key,
      kind,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      byteSize: file.size,
      createdAt: new Date().toISOString()
    })
    .onConflictDoUpdate({
      target: mediaAssets.key,
      set: {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        byteSize: file.size
      }
    })
    .returning();

  return c.json(mapMedia(assertRow(asset, "Failed to create media asset"), c.env.PUBLIC_MEDIA_BASE_URL), 201);
});

app.get("/admin/visits", async (c) => {
  const path = c.req.query("path");
  const db = createDb(c.env.DB);
  const rows = await db.query.visits.findMany({
    where: path ? like(visits.path, `%${path}%`) : undefined,
    orderBy: [desc(visits.createdAt)],
    limit: Number(c.req.query("limit") ?? 100)
  });
  return c.json({ items: rows.map(mapVisit), nextCursor: null });
});

async function hydrateSummary(db: ReturnType<typeof createDb>, post: DbPost, mediaBaseUrl?: string) {
  const [postTagRows, coverMedia] = await Promise.all([
    tagsForPost(db, post.id),
    post.coverMediaId ? db.query.mediaAssets.findFirst({ where: eq(mediaAssets.id, post.coverMediaId) }) : null
  ]);

  return mapPostSummary(post, postTagRows, coverMedia ?? null, mediaBaseUrl);
}

async function hydrateDetail(
  db: ReturnType<typeof createDb>,
  post: DbPost,
  mediaBaseUrl?: string,
  includeMarkdown = false
) {
  const [postTagRows, coverMedia] = await Promise.all([
    tagsForPost(db, post.id),
    post.coverMediaId ? db.query.mediaAssets.findFirst({ where: eq(mediaAssets.id, post.coverMediaId) }) : null
  ]);

  return mapPostDetail(post, postTagRows, coverMedia ?? null, mediaBaseUrl, includeMarkdown);
}

async function tagsForPost(db: ReturnType<typeof createDb>, postId: string): Promise<DbTag[]> {
  const rows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, postId));
  return rows;
}

async function replaceTags(db: ReturnType<typeof createDb>, postId: string, tagSlugs: string[]) {
  await db.delete(postTags).where(eq(postTags.postId, postId));

  const normalized = [...new Set(tagSlugs.map(slugify).filter(Boolean))];
  if (normalized.length === 0) {
    return;
  }

  const existingTags = await db.query.tags.findMany({
    where: inArray(tags.slug, normalized)
  });
  const existingBySlug = new Map(existingTags.map((tag) => [tag.slug, tag]));
  const missing = normalized.filter((slug) => !existingBySlug.has(slug));

  if (missing.length > 0) {
    const inserted = await db
      .insert(tags)
      .values(missing.map((slug) => ({ id: createId("tag"), slug, name: unslug(slug) })))
      .returning();
    for (const tag of inserted) {
      existingBySlug.set(tag.slug, tag);
    }
  }

  await db.insert(postTags).values(
    normalized.map((slug) => ({
      postId,
      tagId: existingBySlug.get(slug)!.id
    }))
  );
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unslug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mediaKind(contentType: string): "image" | "video" | "file" {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return "file";
}

function extensionFromName(name: string): string {
  const match = name.match(/\.[a-z0-9]{1,8}$/i);
  return match?.[0].toLowerCase() ?? "";
}

function parseByteRange(range: string | undefined): { offset: number; length?: number } | null {
  if (!range) {
    return null;
  }

  const match = range.match(/^bytes=(\d+)-(\d*)$/);
  if (!match) {
    return null;
  }

  const offset = Number(match[1] ?? NaN);
  const end = match[2] ? Number(match[2]) : undefined;

  if (!Number.isFinite(offset)) {
    return null;
  }

  return end && end >= offset ? { offset, length: end - offset + 1 } : { offset };
}

function readCfString(cf: unknown, key: string): string | null {
  const value = (cf as Record<string, unknown> | undefined)?.[key];
  return typeof value === "string" ? value : null;
}

function assertRow<T>(row: T | undefined, message: string): T {
  if (!row) {
    throw new Error(message);
  }
  return row;
}

async function pruneVisits(db: ReturnType<typeof createDb>, daysValue: string | undefined) {
  const days = Number(daysValue ?? 90);
  if (!Number.isFinite(days) || days <= 0) {
    return;
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  await db.delete(visits).where(lt(visits.createdAt, cutoff));
}

export default app;
