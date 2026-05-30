"use client";

import type { ApiList, MediaAsset } from "@blog/shared";
import { browserApiBaseUrl } from "@/lib/api";
import { Copy, Upload } from "lucide-react";
import { useEffect, useState } from "react";

export function AdminMedia() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const data = await authFetch<ApiList<MediaAsset>>("/admin/media");
    setItems(data.items);
  }

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    await authFetch<MediaAsset>("/admin/media", { method: "POST", body: form });
    setMessage("업로드했습니다.");
    await refresh();
  }

  async function copy(asset: MediaAsset) {
    const text = asset.kind === "video" ? `<video controls src="${asset.publicUrl}"></video>` : `![${asset.filename}](${asset.publicUrl})`;
    await navigator.clipboard.writeText(text);
    setMessage("Markdown 조각을 복사했습니다.");
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Library</p>
          <h1 className="text-3xl font-semibold">Media</h1>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-coral">
          <Upload size={17} />
          업로드
          <input className="sr-only" type="file" accept="image/*,video/*" onChange={upload} />
        </label>
      </div>
      {message ? <p className="mb-4 text-sm text-moss">{message}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((asset) => (
          <article key={asset.id} className="rounded-lg border border-line bg-white p-3">
            <div className="grid aspect-video place-items-center overflow-hidden rounded-md bg-paper">
              {asset.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={asset.filename} src={asset.publicUrl} className="h-full w-full object-cover" />
              ) : asset.kind === "video" ? (
                <video src={asset.publicUrl} controls className="h-full w-full" />
              ) : (
                <span className="text-sm text-ink/50">{asset.contentType}</span>
              )}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{asset.filename}</h2>
                <p className="text-xs text-ink/50">{Math.round(asset.byteSize / 1024)} KB · {asset.kind}</p>
              </div>
              <button onClick={() => copy(asset)} className="rounded-md border border-line p-2 hover:border-steel" aria-label="Copy markdown">
                <Copy size={16} />
              </button>
            </div>
          </article>
        ))}
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
