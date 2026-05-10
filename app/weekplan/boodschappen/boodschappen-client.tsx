"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AlwaysInStockBlock, ShoppingCategory } from "@/lib/weekplan/types";
import { toggleShoppingPantryAction } from "../actions";

export function BoodschappenClient({
  shoppingListId,
  weeklyCategories,
  pantry,
}: {
  shoppingListId: string;
  weeklyCategories: ShoppingCategory[];
  pantry: AlwaysInStockBlock;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localWeekly, setLocalWeekly] = useState(weeklyCategories);

  async function toggle(
    categoryId: string,
    itemId: string,
    nextPantry: boolean,
  ) {
    setLocalWeekly((prev) =>
      prev.map((c) =>
        c.id !== categoryId
          ? c
          : {
              ...c,
              items: c.items.map((it) =>
                it.id === itemId ? { ...it, in_pantry: nextPantry } : it,
              ),
            },
      ),
    );
    startTransition(async () => {
      const r = await toggleShoppingPantryAction({
        shoppingListId,
        categoryId,
        itemId,
        inPantry: nextPantry,
      });
      if (!r.ok) {
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  const showPantry =
    (pantry.intro && pantry.intro.trim().length > 0) ||
    (pantry.categories?.length ?? 0) > 0;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-base font-semibold text-stone-900">
          Weekboodschappen
        </h2>
        <p className="mt-2 text-xs text-stone-600">
          <strong>Weekoverzicht</strong> voor dit plan: ingrediënten uit{" "}
          <strong>alle maaltijden</strong>, opgeteld naar de{" "}
          <strong>per recept opgeslagen portie</strong> (×1 basis; ×2–×8 via de receptpagina).
          Alleen gerechten waar je hoger zet leveren extra volume in deze lijst mee.
        </p>
        <div className="mt-4 space-y-8">
          {localWeekly.map((cat) => (
            <div key={cat.id}>
              <h3 className="border-b border-stone-200 pb-2 text-base font-semibold text-stone-900">
                {cat.label}
              </h3>
              <ul className="mt-3 space-y-2">
                {cat.items.map((it) => {
                  const inPantry = Boolean(it.in_pantry);
                  return (
                    <li
                      key={it.id}
                      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                        inPantry
                          ? "border-stone-200 bg-stone-100/80 text-stone-500 line-through"
                          : "border-stone-200 bg-white text-stone-900"
                      }`}
                    >
                      <span>
                        <span className="font-medium">{it.name}</span>
                        <span className="ml-2 text-stone-600">{it.quantity}</span>
                      </span>
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-stone-600">
                        <input
                          type="checkbox"
                          checked={inPantry}
                          disabled={pending}
                          onChange={() => toggle(cat.id, it.id, !inPantry)}
                        />
                        In voorraad
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {showPantry ? (
        <section className="border-t border-stone-200 pt-8">
          <h2 className="text-base font-semibold text-stone-900">
            Altijd op voorraad
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Eenmalige investering — daarna sneller een voedzame maaltijd. Geen
            vinkjes nodig; dit is je basisvoorraad-checklist. Hoeveelheden hier
            schalen niet mee met porties (bevestigingen/flessen naar eigen inzicht).
          </p>
          {pantry.intro ? (
            <p className="mt-3 text-sm leading-relaxed text-stone-700">
              {pantry.intro}
            </p>
          ) : null}
          <div className="mt-4 space-y-8">
            {(pantry.categories ?? []).map((cat) => (
              <div key={cat.id}>
                <h3 className="border-b border-stone-200 pb-2 text-base font-semibold text-stone-900">
                  {cat.label}
                </h3>
                <ul className="mt-3 space-y-2">
                  {cat.items.map((it) => (
                    <li
                      key={it.id}
                      className="rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm text-stone-900"
                    >
                      <span className="font-medium">{it.name}</span>
                      <span className="ml-2 text-stone-600">{it.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
