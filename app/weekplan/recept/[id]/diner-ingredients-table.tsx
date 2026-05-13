"use client";

import { useState } from "react";
import { scaleAmountText } from "@/lib/weekplan/amount-scale";

type DinerIngredient = {
  name?: string | null;
  amount?: string | null;
  note?: string | null;
};

const MULTIPLIER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function clampMultiplier(n: number): number {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) ? Math.min(8, Math.max(1, v)) : 1;
}

export function DinerIngredientsTable({
  ingredients,
  initialMultiplier,
}: {
  ingredients: DinerIngredient[];
  initialMultiplier: number;
}) {
  const [multiplier, setMultiplier] = useState<number>(
    clampMultiplier(initialMultiplier),
  );

  return (
    <div className="mt-3 space-y-4">
      <label className="flex flex-wrap items-center gap-2 text-xs text-stone-700">
        <span>Toon hoeveelheden voor</span>
        <select
          value={multiplier}
          onChange={(e) => setMultiplier(clampMultiplier(Number(e.target.value)))}
          className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900"
        >
          {MULTIPLIER_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>{multiplier === 1 ? "persoon" : "personen"}</span>
      </label>
      <ul className="list-inside list-disc space-y-1.5 text-sm text-stone-800">
        {ingredients.map((ing, i) => {
          const name = String(ing.name ?? "Ingrediënt");
          const perPortion = String(ing.amount ?? "").trim() || "hoeveelheid volgt";
          const shown =
            multiplier === 1 ? perPortion : scaleAmountText(perPortion, multiplier);
          return (
            <li key={i}>
              <span className="font-medium">{name}</span>{" "}
              <span className="text-stone-700">{shown}</span>
              {multiplier !== 1 ? (
                <span className="ml-1 text-xs text-stone-400">
                  (= {perPortion} p.p.)
                </span>
              ) : null}
              {ing.note ? (
                <span className="text-stone-500"> ({String(ing.note)})</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
