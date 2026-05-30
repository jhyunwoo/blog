import type { ApiList, MediaAsset, PostDetail, PostSummary, Visit } from "@blog/shared";

export const apiBaseUrl =
  process.env.API_PUBLIC_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export const browserApiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? apiBaseUrl;

async function apiFetch<T>(path: string, init?: RequestInit & { next?: NextFetchRequestConfig }): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export function getPosts() {
  return apiFetch<ApiList<PostSummary>>("/posts", {
    next: { revalidate: 300, tags: ["posts"] }
  });
}

export function getPost(slug: string) {
  return apiFetch<PostDetail>(`/posts/${slug}`, {
    next: { revalidate: 600, tags: ["posts", `post:${slug}`] }
  });
}

export function getAdminPosts(cookie: string) {
  return apiFetch<ApiList<PostSummary>>("/admin/posts", {
    cache: "no-store",
    headers: { cookie }
  });
}

export type AdminMediaList = ApiList<MediaAsset>;
export type AdminVisitList = ApiList<Visit>;
