import type { MediaAsset, PostDetail, PostSummary, Tag, Visit } from "@blog/shared";
import type { DbMediaAsset, DbPost, DbTag, DbVisit, TocItem } from "./types";

export function publicMediaUrl(baseUrl: string | undefined, key: string): string {
  const base = baseUrl?.replace(/\/$/, "") || "/media";
  return `${base}/${key}`;
}

export function mapMedia(asset: DbMediaAsset, baseUrl?: string): MediaAsset {
  return {
    id: asset.id,
    key: asset.key,
    kind: asset.kind,
    filename: asset.filename,
    contentType: asset.contentType,
    byteSize: asset.byteSize,
    width: asset.width,
    height: asset.height,
    durationSeconds: asset.durationSeconds,
    publicUrl: publicMediaUrl(baseUrl, asset.key),
    createdAt: asset.createdAt
  };
}

export function mapTag(tag: DbTag): Tag {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug
  };
}

export function mapPostSummary(
  post: DbPost,
  tags: DbTag[] = [],
  coverMedia: DbMediaAsset | null = null,
  mediaBaseUrl?: string
): PostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    status: post.status,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    readingTime: post.readingTime,
    coverMedia: coverMedia ? mapMedia(coverMedia, mediaBaseUrl) : null,
    tags: tags.map(mapTag)
  };
}

export function mapPostDetail(
  post: DbPost,
  tags: DbTag[] = [],
  coverMedia: DbMediaAsset | null = null,
  mediaBaseUrl?: string,
  includeMarkdown = false
): PostDetail {
  return {
    ...mapPostSummary(post, tags, coverMedia, mediaBaseUrl),
    markdown: includeMarkdown ? post.markdown : undefined,
    html: post.html,
    toc: safeJson<TocItem[]>(post.tocJson, [])
  };
}

export function mapVisit(visit: DbVisit): Visit {
  return {
    id: visit.id,
    path: visit.path,
    postId: visit.postId,
    referrer: visit.referrer,
    ip: visit.ip,
    userAgent: visit.userAgent,
    country: visit.country,
    region: visit.region,
    city: visit.city,
    colo: visit.colo,
    device: visit.device,
    createdAt: visit.createdAt
  };
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
