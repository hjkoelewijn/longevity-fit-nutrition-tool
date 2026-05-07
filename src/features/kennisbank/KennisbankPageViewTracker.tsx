"use client";

import { useEffect } from "react";

export function KennisbankPageViewTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = { event: "kennisbank_page_view", page: "/kennisbank" };
    if ("dataLayer" in window && Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)) {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push(payload);
    }
  }, []);
  return null;
}

