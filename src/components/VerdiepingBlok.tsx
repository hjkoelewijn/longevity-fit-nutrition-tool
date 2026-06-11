"use client";

import { useState } from "react";

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={idx}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={idx}>{part}</span>
    ),
  );
}

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const blocks: Array<
    | { type: "heading"; text: string }
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[] }
  > = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      blocks.push({ type: "heading", text: line.slice(2, -2).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    const p = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\*\*[^*]+\*\*$/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("- ")
    ) {
      p.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: p.join(" ") });
  }

  return blocks.map((block, idx) => {
    if (block.type === "heading") {
      return (
        <h3 key={idx} className="mt-6 text-lg font-semibold text-[#2A2520] first:mt-0">
          {block.text}
        </h3>
      );
    }
    if (block.type === "list") {
      return (
        <ul
          key={idx}
          className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-[1.7] text-[#2A2520] marker:text-[#D4AF37]"
        >
          {block.items.map((item, itemIdx) => (
            <li key={itemIdx}>{renderInlineBold(item)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={idx} className="mt-3 text-base leading-[1.7] text-[#2A2520]">
        {renderInlineBold(block.text)}
      </p>
    );
  });
}

function emitEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (
    "dataLayer" in window &&
    Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)
  ) {
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push(payload);
  }
}

type VerdiepingBlokProps = {
  moduleId: string;
  titel?: string;
  content: string;
};

export function VerdiepingBlok({
  moduleId,
  titel = "Verdieping: het mechanisme achter de vetzuurbalans",
  content,
}: VerdiepingBlokProps) {
  const [open, setOpen] = useState(false);

  function handleToggle() {
    const newOpen = !open;
    setOpen(newOpen);
    if (newOpen) {
      emitEvent({
        event: "kennisbank_verdieping_uitklap",
        module_id: moduleId,
      });
    }
  }

  return (
    <div className="mt-8 rounded-2xl bg-[#E8DCC8]">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-lg font-semibold text-[#9C7A22]">{titel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 shrink-0 text-[#D4AF37] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6">
          <div className="border-t border-[#D4AF37]/30 pt-5">{renderMarkdown(content)}</div>
        </div>
      )}
    </div>
  );
}
