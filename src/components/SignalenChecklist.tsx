"use client";

import { useState } from "react";

export function SignalenChecklist({
  titel,
  items,
}: {
  titel: string;
  items: string[];
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  if (items.length === 0) return null;
  return (
    <div className="mt-5 rounded-xl border border-[#E8DCC8] bg-[#FAF7F2] p-4">
      <p className="text-sm font-semibold text-stone-900">{titel}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, idx) => (
          <li key={`${idx}-${item.slice(0, 20)}`}>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/70">
              <input
                type="checkbox"
                checked={Boolean(checked[idx])}
                onChange={() => setChecked((p) => ({ ...p, [idx]: !p[idx] }))}
                className="mt-0.5 h-4 w-4 rounded-full border-stone-300 accent-[#D4AF37]"
              />
              <span className="text-sm leading-relaxed text-stone-800">{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

