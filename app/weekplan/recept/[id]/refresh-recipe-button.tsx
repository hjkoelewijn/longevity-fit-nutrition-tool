"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  mealPlanId: string;
  mealId: string;
};

export function RefreshRecipeButton({ mealPlanId, mealId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function refresh() {
    setError(null);
    setDone(false);
    startTransition(async () => {
      try {
        const r = await fetch("/api/weekplan/hydrate-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meal_plan_id: mealPlanId,
            meal_id: mealId,
            quality_mode: true,
            force: true,
          }),
        });
        const data = (await r.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };
        if (!r.ok || !data.ok) {
          setError(
            data.error ??
              "Opnieuw ophalen lukte niet. Probeer het zo dadelijk nog eens.",
          );
          return;
        }
        setDone(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Onbekende fout.");
      }
    });
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={refresh}
        disabled={pending}
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 transition hover:bg-stone-100 disabled:opacity-50"
      >
        {pending ? "Bezig met verversen…" : "Recept verversen"}
      </button>
      <p className="mt-1 text-xs text-stone-500">
        Zien de hoeveelheden er niet logisch uit? Klik op verversen voor een
        bijgewerkte versie van het recept.
      </p>
      {error ? (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {done && !error ? (
        <p className="mt-2 text-xs text-green-700">
          Klaar — de pagina wordt bijgewerkt.
        </p>
      ) : null}
    </div>
  );
}
