"use client";

import Link from "next/link";
import type { KennisbankCategorie } from "@/src/data/kennisbank";

function emitEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if ("dataLayer" in window && Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)) {
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push(payload);
  }
}

export function KennisbankCategorieKaart({ categorie }: { categorie: KennisbankCategorie }) {
  return (
    <article className="rounded-2xl border-l-4 border-[#D4AF37] border-y border-r border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <h3 className="text-2xl font-semibold text-[#2A2520]">{categorie.titel}</h3>
      <p className="mt-2 text-base text-stone-700">{categorie.korteOmschrijving}</p>
      <ul className="mt-5 space-y-2">
        {categorie.modules.map((module) => (
          <li key={module.id}>
            {module.klikbaar && module.pad ? (
              <Link
                href={module.pad}
                className="text-base font-medium text-[#9C7A22] underline underline-offset-4"
                onClick={() =>
                  emitEvent({
                    event: "kennisbank_module_click",
                    module_id: module.id,
                    category_id: categorie.id,
                  })
                }
              >
                {module.titel}
              </Link>
            ) : (
              <span className="text-base text-stone-600">{module.titel}</span>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

