"use client";

import type { ReactNode } from "react";

export function WhyWeAsk(props: { id: string; children: ReactNode }) {
  return (
    <details className="group mt-2 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-left">
      <summary className="cursor-pointer list-none text-xs font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 marker:hidden [&::-webkit-details-marker]:hidden">
        Waarom vragen we dit?
      </summary>
      <p
        className="mt-2 text-xs leading-relaxed text-stone-600"
        data-why-id={props.id}
      >
        {props.children}
      </p>
    </details>
  );
}
