"use client";

import type { ApiList, Visit } from "@blog/shared";
import { browserApiBaseUrl } from "@/lib/api";
import { RefreshCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function AdminVisits() {
  const [items, setItems] = useState<Visit[]>([]);
  const [path, setPath] = useState("");

  useEffect(() => {
    void refresh();
  }, []);

  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.country ?? "unknown", (counts.get(item.country ?? "unknown") ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [items]);

  async function refresh() {
    const query = path ? `?path=${encodeURIComponent(path)}` : "";
    const data = await authFetch<ApiList<Visit>>(`/admin/visits${query}`);
    setItems(data.items);
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Analytics</p>
          <h1 className="text-3xl font-semibold">Visits</h1>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-coral">
          <RefreshCcw size={17} />
          새로고침
        </button>
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_360px]">
        <label className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
          <Search size={17} className="text-ink/45" />
          <input
            className="w-full bg-transparent outline-none"
            placeholder="경로 필터"
            value={path}
            onChange={(event) => setPath(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void refresh();
            }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {countries.map(([country, count]) => (
            <span key={country} className="rounded-md bg-white px-3 py-2 text-sm text-ink/65">
              {country} {count}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-[0.12em] text-ink/45">
            <tr>
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3">Path</th>
              <th className="px-3 py-3">IP</th>
              <th className="px-3 py-3">Country</th>
              <th className="px-3 py-3">Referrer</th>
              <th className="px-3 py-3">User Agent</th>
            </tr>
          </thead>
          <tbody>
            {items.map((visit) => (
              <tr key={visit.id} className="border-t border-line align-top">
                <td className="whitespace-nowrap px-3 py-3 text-ink/60">{new Date(visit.createdAt).toLocaleString("ko-KR")}</td>
                <td className="px-3 py-3 font-medium">{visit.path}</td>
                <td className="px-3 py-3 text-ink/60">{visit.ip}</td>
                <td className="px-3 py-3 text-ink/60">{visit.country ?? "-"} · {visit.colo ?? "-"}</td>
                <td className="max-w-[220px] truncate px-3 py-3 text-ink/60">{visit.referrer ?? "-"}</td>
                <td className="max-w-[320px] truncate px-3 py-3 text-ink/60">{visit.userAgent ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
