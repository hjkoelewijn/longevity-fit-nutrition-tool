"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import type { ShoppingCategory } from "@/lib/weekplan/types";
import { scaleAmountText } from "@/lib/weekplan/amount-scale";
import {
  setDinerHouseholdSizeAction,
  toggleShoppingPantryAction,
} from "../actions";
import type { ShoppingSection } from "@/lib/weekplan/shopping-storage";

const HOUSEHOLD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

type PantryAction = {
  categoryId: string;
  itemId: string;
  inPantry: boolean;
};

function applyPantryToggle(
  state: ShoppingCategory[],
  action: PantryAction,
): ShoppingCategory[] {
  return state.map((c) =>
    c.id !== action.categoryId
      ? c
      : {
          ...c,
          items: c.items.map((it) =>
            it.id === action.itemId ? { ...it, in_pantry: action.inPantry } : it,
          ),
        },
  );
}

function clampHouseholdSize(n: number): number {
  return Math.min(8, Math.max(1, Math.floor(n) || 1));
}

export function BoodschappenClient({
  mealPlanId,
  shoppingListId,
  lunchesCategories,
  dinersCategories,
  pantryIntro,
  initialDinerHouseholdSize,
}: {
  mealPlanId: string;
  shoppingListId: string;
  lunchesCategories: ShoppingCategory[];
  dinersCategories: ShoppingCategory[];
  /** Korte uitleg uit het weekplan (basisvoorraad); artikelen staan in de lunch/snacks-lijst. */
  pantryIntro?: string | null;
  initialDinerHouseholdSize: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hhPending, startHhTransition] = useTransition();

  const [optLunches, applyLunchToggle] = useOptimistic(
    lunchesCategories,
    applyPantryToggle,
  );
  const [optDinners, applyDinnerToggle] = useOptimistic(
    dinersCategories,
    applyPantryToggle,
  );
  const [optHouseholdSize, applyHouseholdSize] = useOptimistic(
    clampHouseholdSize(initialDinerHouseholdSize),
    (_state: number, next: number) => clampHouseholdSize(next),
  );

  function toggle(
    section: ShoppingSection,
    categoryId: string,
    itemId: string,
    nextPantry: boolean,
  ) {
    startTransition(async () => {
      if (section === "lunches") {
        applyLunchToggle({ categoryId, itemId, inPantry: nextPantry });
      } else {
        applyDinnerToggle({ categoryId, itemId, inPantry: nextPantry });
      }
      await toggleShoppingPantryAction({
        shoppingListId,
        section,
        categoryId,
        itemId,
        inPantry: nextPantry,
      });
      router.refresh();
    });
  }

  function changeHouseholdSize(next: number) {
    const size = clampHouseholdSize(next);
    startHhTransition(async () => {
      applyHouseholdSize(size);
      await setDinerHouseholdSizeAction({ mealPlanId, size });
      router.refresh();
    });
  }

  const hasLunches = optLunches.length > 0;
  const hasDinners = optDinners.length > 0;
  const intro = pantryIntro?.trim();

  return (
    <div className="space-y-12">
      {intro ? (
        <p className="rounded-xl border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm text-stone-700">
          {intro}
        </p>
      ) : null}

      {hasLunches ? (
        <CategoryBlock
          title="Voor lunches, ontbijt & snacks"
          subtitle="Voor jou alleen, voor de hele week (7 ontbijten + 7 lunches + eventuele tussendoortjes). Onderaan deze lijst staan ook artikelen uit «altijd op voorraad» — vink aan wat je al in huis hebt."
          categories={optLunches}
          scaleFactor={1}
          onToggle={(cid, iid, next) => toggle("lunches", cid, iid, next)}
          pending={pending}
        />
      ) : null}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Voor diners
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              Hoeveelheden zijn voor <strong>1 portie per diner</strong>. Pas hieronder
              aan voor hoeveel personen je het diner kookt — de lijst wordt direct
              vermenigvuldigd.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-stone-700">
            <span>Ik kook diner voor</span>
            <select
              value={optHouseholdSize}
              disabled={hhPending || !hasDinners}
              onChange={(e) => changeHouseholdSize(Number(e.target.value))}
              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900 disabled:opacity-50"
            >
              {HOUSEHOLD_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>{optHouseholdSize === 1 ? "persoon" : "personen"}</span>
          </label>
        </div>
        {hasDinners ? (
          <CategoryBlock
            title=""
            subtitle=""
            categories={optDinners}
            scaleFactor={optHouseholdSize}
            onToggle={(cid, iid, next) => toggle("dinners", cid, iid, next)}
            pending={pending}
            noHeader
          />
        ) : (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">Diner-boodschappen ontbreken in dit plan.</p>
            <p className="mt-1">
              Dit weekplan is gemaakt vóór de splitsing in twee blokken. Alle weekboodschappen
              staan daarom hierboven onder «Voor lunches, ontbijt & snacks».{" "}
              <Link
                href="/weekplan"
                className="font-medium underline underline-offset-4"
              >
                Genereer een nieuw weekplan
              </Link>{" "}
              om de aparte diner-boodschappen (met «diner voor … personen»-instelling) te
              krijgen.
            </p>
          </div>
        )}
      </section>

      {!hasLunches && !hasDinners ? (
        <p className="text-sm text-stone-600">
          Deze boodschappenlijst is nog leeg. Genereer een nieuw weekplan om de
          gesplitste lijst (lunches/diners) te krijgen.
        </p>
      ) : null}
    </div>
  );
}

function CategoryBlock({
  title,
  subtitle,
  categories,
  scaleFactor,
  onToggle,
  pending,
  noHeader = false,
}: {
  title: string;
  subtitle: string;
  categories: ShoppingCategory[];
  scaleFactor: number;
  onToggle: (categoryId: string, itemId: string, nextPantry: boolean) => void;
  pending: boolean;
  noHeader?: boolean;
}) {
  return (
    <section>
      {!noHeader ? (
        <div className="border-b border-stone-200 pb-3">
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs text-stone-600">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      <div className={`${noHeader ? "mt-4" : "mt-4"} space-y-8`}>
        {categories.map((cat) => (
          <div key={cat.id}>
            <h3 className="border-b border-stone-200 pb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
              {cat.label}
            </h3>
            <ul className="mt-3 space-y-2">
              {cat.items.map((it) => {
                const inPantry = Boolean(it.in_pantry);
                const shownQty =
                  scaleFactor !== 1
                    ? scaleAmountText(it.quantity, scaleFactor)
                    : it.quantity;
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
                      {shownQty ? (
                        <span className="ml-2 text-stone-600">{shownQty}</span>
                      ) : null}
                    </span>
                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-stone-600">
                      <input
                        type="checkbox"
                        checked={inPantry}
                        disabled={pending}
                        onChange={() => onToggle(cat.id, it.id, !inPantry)}
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
  );
}
