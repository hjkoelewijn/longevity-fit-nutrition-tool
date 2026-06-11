"use client";

import Link from "next/link";
import { LeestijdBadge } from "@/src/components/LeestijdBadge";

function emitEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (
    "dataLayer" in window &&
    Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)
  ) {
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push(payload);
  }
}

type LeermoduleKaartProps = {
  categorieId: string;
  moduleId: string;
  titel: string;
  subtitel?: string;
  leestijdMinuten: number;
  leestijdVerdiepingMinuten?: number;
  pad: string;
};

export function LeermoduleKaart({
  categorieId,
  moduleId,
  titel,
  subtitel,
  leestijdMinuten,
  leestijdVerdiepingMinuten,
  pad,
}: LeermoduleKaartProps) {
  return (
    <Link
      href={pad}
      className="block rounded-2xl border-l-4 border-[#D4AF37] border-y border-r border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      onClick={() =>
        emitEvent({
          event: "kennisbank_module_kaart_click",
          module_id: moduleId,
          category_id: categorieId,
        })
      }
    >
      <h3 className="text-lg font-semibold text-[#2A2520] sm:text-xl">{titel}</h3>
      {subtitel && <p className="mt-1.5 text-sm text-stone-600 sm:text-base">{subtitel}</p>}
      <div className="mt-4">
        <LeestijdBadge minuten={leestijdMinuten} verdiepingMinuten={leestijdVerdiepingMinuten} />
      </div>
    </Link>
  );
}
