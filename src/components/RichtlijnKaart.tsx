"use client";

import { useMemo, useState } from "react";
import type { Richtlijn } from "@/src/data/richtlijnen";
import { SignalenChecklist } from "@/src/components/SignalenChecklist";
import { ZuivelHierarchie } from "@/src/components/ZuivelHierarchie";

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return <span key={idx}>{part}</span>;
  });
}

function renderMarkdownLike(md: string) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      out.push(
        <ul key={`ul-${i}`} className="mt-3 list-disc space-y-1 pl-5 text-base leading-relaxed text-stone-800">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineBold(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      out.push(
        <ol key={`ol-${i}`} className="mt-3 list-decimal space-y-1 pl-5 text-base leading-relaxed text-stone-800">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineBold(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    out.push(
      <p key={`p-${i}`} className="mt-3 text-base leading-relaxed text-stone-800">
        {renderInlineBold(line)}
      </p>,
    );
    i += 1;
  }
  return out;
}

function trackAccordion(nummer: number, open: boolean) {
  if (typeof window === "undefined") return;
  const payload = {
    event: "richtlijn_toggle",
    richtlijn_nummer: nummer,
    open,
  };
  if ("dataLayer" in window && Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)) {
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push(payload);
  }
  if ("gtag" in window && typeof (window as unknown as { gtag?: unknown }).gtag === "function") {
    (
      window as unknown as {
        gtag: (event: string, action: string, params: Record<string, unknown>) => void;
      }
    ).gtag("event", "richtlijn_toggle", {
      richtlijn_nummer: nummer,
      open,
    });
  }
}

export function RichtlijnKaart({ richtlijn }: { richtlijn: Richtlijn }) {
  const [open, setOpen] = useState(false);
  const body = useMemo(() => renderMarkdownLike(richtlijn.uitleg), [richtlijn.uitleg]);

  return (
    <article className="rounded-2xl border border-stone-200 bg-white shadow-[0_8px_24px_rgba(42,37,32,0.08)]">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          trackAccordion(richtlijn.nummer, next);
        }}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
      >
        <h3 className="text-lg font-semibold text-stone-900">
          <span className="mr-2 text-[#D4AF37]">✓</span>
          {richtlijn.nummer}. {richtlijn.titel}
        </h3>
        <span className="text-xl text-stone-500">{open ? "−" : "+"}</span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-[250ms] ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 sm:px-6">
            {body}
            {richtlijn.zuivelHierarchie ? (
              <ZuivelHierarchie items={richtlijn.zuivelHierarchie} />
            ) : null}
            {richtlijn.signalenChecklist ? (
              <SignalenChecklist
                titel="Signalen-checklist"
                items={richtlijn.signalenChecklist}
              />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

