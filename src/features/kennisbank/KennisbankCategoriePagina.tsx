"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LeermoduleKaart } from "@/src/components/LeermoduleKaart";
import type { KennisbankCategorie } from "@/src/data/kennisbank";

type ModuleMeta = {
  id: string;
  subtitel: string;
  leestijdMinuten: number;
  leestijdVerdiepingMinuten?: number;
};

type KennisbankCategoriePaginaProps = {
  categorie: KennisbankCategorie;
  modulesMeta: ModuleMeta[];
};

function emitEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (
    "dataLayer" in window &&
    Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)
  ) {
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push(payload);
  }
}

export function KennisbankCategoriePagina({
  categorie,
  modulesMeta,
}: KennisbankCategoriePaginaProps) {
  useEffect(() => {
    emitEvent({
      event: "kennisbank_categorie_pageview",
      category_id: categorie.id,
    });
  }, [categorie.id]);

  const metaByModuleId = Object.fromEntries(modulesMeta.map((m) => [m.id, m]));

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-4xl space-y-10">
        <Link
          href="/kennisbank"
          className="text-sm font-medium text-stone-800 underline underline-offset-4"
        >
          ← Terug naar kennisbank
        </Link>

        <header className="space-y-2">
          <h1 className="text-4xl italic text-[#2A2520] sm:text-5xl">{categorie.titel}</h1>
          <p className="text-base text-stone-700 sm:text-lg">{categorie.korteOmschrijving}</p>
        </header>

        <section className="space-y-4">
          {categorie.modules.map((module) => {
            if (!module.klikbaar || !module.pad) return null;
            const meta = metaByModuleId[module.id];
            return (
              <LeermoduleKaart
                key={module.id}
                categorieId={categorie.id}
                moduleId={module.id}
                titel={module.titel}
                subtitel={meta?.subtitel}
                leestijdMinuten={meta?.leestijdMinuten ?? 5}
                leestijdVerdiepingMinuten={meta?.leestijdVerdiepingMinuten}
                pad={module.pad}
              />
            );
          })}
        </section>
      </div>
    </main>
  );
}
