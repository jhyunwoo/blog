"use client";

import type { ApiList, MediaAsset, PostDetail, PostSummary, PostStatus } from "@blog/shared";
import { browserApiBaseUrl } from "@/lib/api";
import { Eye, ImagePlus, Save, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FormState = {
  id: string | null;
  title: string;
  slug: string;
  markdown: string;
  excerpt: string;
  status: PostStatus;
  tags: string;
  coverMediaId: string | null;
};

const emptyForm: FormState = {
  id: null,
  title: "",
  slug: "",
  markdown: "## 시작\n\n여기에 글을 작성하세요.",
  excerpt: "",
  status: "draft",
  tags: "cloudflare,nextjs",
  coverMediaId: null
};

export function AdminPosts() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const tagSlugs = useMemo(
    () =>
      form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.tags]
  );

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [postsResponse, mediaResponse] = await Promise.all([
      authFetch<ApiList<PostSummary>>("/admin/posts"),
      authFetch<ApiList<MediaAsset>>("/admin/media")
    ]);
    setPosts(postsResponse.items);
    setMedia(mediaResponse.items);
  }

  async function selectPost(postId: string) {
    const post = await authFetch<PostDetail>(`/admin/posts/${postId}`);
    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      markdown: post.markdown ?? "",
      excerpt: post.excerpt,
      status: post.status,
      tags: post.tags.map((tag) => tag.slug).join(","),
      coverMediaId: post.coverMedia?.id ?? null
    });
  }

  async function save(status = form.status) {
    setMessage("");
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      markdown: form.markdown,
      excerpt: form.excerpt || undefined,
      status,
      tagSlugs,
      coverMediaId: form.coverMediaId
    };
    const path = form.id ? `/admin/posts/${form.id}` : "/admin/posts";
    const method = form.id ? "PUT" : "POST";
    const saved = await authFetch<PostDetail>(path, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: saved.slug })
    });

    setMessage(status === "published" ? "게시했습니다." : "저장했습니다.");
    setForm((current) => ({ ...current, id: saved.id, status: saved.status, slug: saved.slug }));
    await refresh();
  }

  async function deletePost() {
    if (!form.id || !confirm("이 글을 삭제할까요?")) return;
    await authFetch(`/admin/posts/${form.id}`, { method: "DELETE" });
    setForm(emptyForm);
    await refresh();
  }

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    const asset = await authFetch<MediaAsset>("/admin/media", {
      method: "POST",
      body: data
    });

    const snippet =
      asset.kind === "video"
        ? `<video controls src="${asset.publicUrl}"></video>`
        : `![${asset.filename}](${asset.publicUrl})`;
    setForm((current) => ({
      ...current,
      markdown: `${current.markdown}\n\n${snippet}\n`,
      coverMediaId: current.coverMediaId ?? (asset.kind === "image" ? asset.id : null)
    }));
    await refresh();
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Editor</p>
          <h1 className="text-3xl font-semibold">Posts</h1>
        </div>
        <button
          onClick={() => setForm(emptyForm)}
          className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-steel"
        >
          새 글
        </button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <aside className="rounded-lg border border-line bg-white">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => selectPost(post.id)}
              className="block w-full border-b border-line px-4 py-3 text-left hover:bg-paper"
            >
              <span className="block truncate font-semibold">{post.title}</span>
              <span className="text-xs uppercase text-ink/45">{post.status}</span>
            </button>
          ))}
        </aside>
        <section className="grid gap-5 xl:grid-cols-2">
          <form className="rounded-lg border border-line bg-white p-5" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-4">
              <input
                className="rounded-md border border-line bg-paper px-3 py-2 text-lg font-semibold outline-none focus:border-steel"
                placeholder="제목"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
              <input
                className="rounded-md border border-line bg-paper px-3 py-2 outline-none focus:border-steel"
                placeholder="slug"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
              />
              <textarea
                className="min-h-[420px] resize-y rounded-md border border-line bg-[#17191f] px-4 py-3 font-mono text-sm leading-6 text-[#f7f1df] outline-none focus:border-steel"
                value={form.markdown}
                onChange={(event) => setForm({ ...form, markdown: event.target.value })}
              />
              <textarea
                className="min-h-24 resize-y rounded-md border border-line bg-paper px-3 py-2 outline-none focus:border-steel"
                placeholder="요약"
                value={form.excerpt}
                onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
              />
              <input
                className="rounded-md border border-line bg-paper px-3 py-2 outline-none focus:border-steel"
                placeholder="tags,comma,separated"
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
              />
              <select
                className="rounded-md border border-line bg-paper px-3 py-2 outline-none focus:border-steel"
                value={form.coverMediaId ?? ""}
                onChange={(event) => setForm({ ...form, coverMediaId: event.target.value || null })}
              >
                <option value="">커버 없음</option>
                {media
                  .filter((asset) => asset.kind === "image")
                  .map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.filename}
                    </option>
                  ))}
              </select>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-paper px-4 py-2 text-sm font-semibold hover:border-steel">
                <ImagePlus size={17} />
                미디어 첨부
                <input className="sr-only" type="file" accept="image/*,video/*" onChange={upload} />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => save("draft")} className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper">
                <Save size={17} />
                저장
              </button>
              <button onClick={() => save("published")} className="inline-flex items-center gap-2 rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white">
                <Send size={17} />
                게시
              </button>
              <button onClick={deletePost} className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-coral">
                <Trash2 size={17} />
                삭제
              </button>
              {message ? <span className="px-2 py-2 text-sm text-moss">{message}</span> : null}
            </div>
          </form>
          <div className="rounded-lg border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-ink/45">
              <Eye size={17} />
              Preview
            </div>
            <h2 className="text-3xl font-semibold">{form.title || "제목 없음"}</h2>
            <p className="mt-3 text-ink/60">{form.excerpt}</p>
            <pre className="mt-6 max-h-[520px] overflow-auto rounded-md bg-paper p-4 text-sm leading-6 text-ink/72">
              {form.markdown}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}

async function authFetch<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${browserApiBaseUrl}${path}`, {
    ...init,
    credentials: "include"
  });

  if (response.status === 401) {
    window.location.href = "/admin";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
