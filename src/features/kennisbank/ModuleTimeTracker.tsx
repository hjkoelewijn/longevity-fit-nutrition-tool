"use client";

import { useEffect } from "react";

export function ModuleTimeTracker({ moduleId }: { moduleId: string }) {
  useEffect(() => {
    const startedAt = Date.now();
    return () => {
      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      if (typeof window === "undefined") return;
      if ("dataLayer" in window && Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)) {
        (window as unknown as { dataLayer: unknown[] }).dataLayer.push({
          event: "kennisbank_module_time_spent",
          module_id: moduleId,
          seconds,
        });
      }
    };
  }, [moduleId]);

  return null;
}

