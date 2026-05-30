"use client";

import { useEffect } from "react";
import { browserApiBaseUrl } from "@/lib/api";

export function VisitTracker({ path, postId }: { path: string; postId?: string }) {
  useEffect(() => {
    const body = {
      path,
      postId: postId ?? null,
      referrer: document.referrer || null,
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language
    };

    const payload = JSON.stringify(body);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${browserApiBaseUrl}/visits`, new Blob([payload], { type: "application/json" }));
      return;
    }

    void fetch(`${browserApiBaseUrl}/visits`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true
    });
  }, [path, postId]);

  return null;
}
