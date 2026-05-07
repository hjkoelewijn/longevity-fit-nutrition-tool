"use client";

import type { KennisbankCategorie } from "@/src/data/kennisbank";

function emitEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if ("dataLayer" in window && Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)) {
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push(payload);
  }
}

export function KennisbankPreviewKaart({ categorie }: { categorie: KennisbankCategorie }) {
  return (
    <article
      className="rounded-2xl border border-[#E8DCC8] bg-[#F5EFE6] p-6"
      onMouseEnter={() =>
        emitEvent({
          event: "kennisbank_preview_hover",
          category_id: categorie.id,
        })
      }
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl font-semibold text-[#2A2520]/85">{categorie.titel}</h3>
        <span className="shrink-0 text-sm italic text-[#9C7A22]">Binnenkort</span>
      </div>
      <p className="mt-2 text-base italic text-stone-600">{categorie.korteOmschrijving}</p>
      <ul className="mt-5 list-disc space-y-2 pl-5 text-[15px] text-stone-600">
        {categorie.modules.map((module) => (
          <li key={module.id}>{module.titel}</li>
        ))}
      </ul>
    </article>
  );
}

