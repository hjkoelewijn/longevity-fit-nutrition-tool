"use client";

import { useEffect } from "react";

export function OverPageViewTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = { event: "over_page_view", page: "/over" };
    if ("dataLayer" in window && Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)) {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push(payload);
    }
    if ("gtag" in window && typeof (window as unknown as { gtag?: unknown }).gtag === "function") {
      (
        window as unknown as {
          gtag: (event: string, action: string, params: Record<string, unknown>) => void;
        }
      ).gtag("event", "over_page_view", { page: "/over" });
    }
  }, []);

  return null;
}

