import { z } from "zod";

export const postStatusSchema = z.enum(["draft", "published", "archived"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

export const mediaKindSchema = z.enum(["image", "video", "file"]);
export type MediaKind = z.infer<typeof mediaKindSchema>;

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string()
});

export const mediaAssetSchema = z.object({
  id: z.string(),
  key: z.string(),
  kind: mediaKindSchema,
  filename: z.string(),
  contentType: z.string(),
  byteSize: z.number(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  durationSeconds: z.number().nullable().optional(),
  publicUrl: z.string(),
  createdAt: z.string()
});

export const postSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  status: postStatusSchema,
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
  readingTime: z.number(),
  coverMedia: mediaAssetSchema.nullable(),
  tags: z.array(tagSchema)
});

export const postDetailSchema = postSummarySchema.extend({
  markdown: z.string().optional(),
  html: z.string(),
  toc: z.array(
    z.object({
      id: z.string(),
      depth: z.number(),
      text: z.string()
    })
  )
});

export const postInputSchema = z.object({
  title: z.string().min(1).max(180),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  markdown: z.string().min(1),
  excerpt: z.string().max(320).optional(),
  status: postStatusSchema.default("draft"),
  tagSlugs: z.array(z.string().min(1).max(64)).default([]),
  coverMediaId: z.string().nullable().optional()
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const visitInputSchema = z.object({
  path: z.string().min(1).max(2048),
  postId: z.string().nullable().optional(),
  referrer: z.string().max(2048).nullable().optional(),
  screen: z.string().max(64).nullable().optional(),
  language: z.string().max(64).nullable().optional()
});

export const visitSchema = z.object({
  id: z.string(),
  path: z.string(),
  postId: z.string().nullable(),
  referrer: z.string().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  country: z.string().nullable(),
  region: z.string().nullable(),
  city: z.string().nullable(),
  colo: z.string().nullable(),
  device: z.string().nullable(),
  createdAt: z.string()
});

export type Tag = z.infer<typeof tagSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type PostSummary = z.infer<typeof postSummarySchema>;
export type PostDetail = z.infer<typeof postDetailSchema>;
export type PostInput = z.infer<typeof postInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type VisitInput = z.infer<typeof visitInputSchema>;
export type Visit = z.infer<typeof visitSchema>;

export type ApiList<T> = {
  items: T[];
  nextCursor: string | null;
};
