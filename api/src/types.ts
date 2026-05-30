import type { InferSelectModel } from "drizzle-orm";
import type { admins, mediaAssets, posts, tags, visits } from "./schema";

export type Bindings = {
  DB: D1Database;
  MEDIA: R2Bucket;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD_HASH: string;
  SESSION_SECRET: string;
  CORS_ORIGIN: string;
  PUBLIC_MEDIA_BASE_URL?: string;
  VISIT_LOG_RETENTION_DAYS?: string;
};

export type Variables = {
  admin: InferSelectModel<typeof admins>;
  sessionId: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

export type DbPost = InferSelectModel<typeof posts>;
export type DbTag = InferSelectModel<typeof tags>;
export type DbMediaAsset = InferSelectModel<typeof mediaAssets>;
export type DbVisit = InferSelectModel<typeof visits>;

export type TocItem = {
  id: string;
  depth: number;
  text: string;
};
