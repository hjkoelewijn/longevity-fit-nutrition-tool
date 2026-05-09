"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  mealPlanId: string;
  mealId: string;
  enabled: boolean;
};

export default function RecipeHydrationTrigger({ mealPlanId, mealId, enabled }: Props) {
  const router = useRouter();
  const startedRef = useRef(false);
  const [phase, setPhase] = useState<"idle" | "fast" | "premium" | "error">("idle");

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;

    async function run() {
      try {
        setPhase("fast");
        const fast = await fetch("/api/weekplan/hydrate-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meal_plan_id: mealPlanId,
            meal_id: mealId,
            quality_mode: false,
            force: false,
          }),
        });
        if (!fast.ok) {
          throw new Error("Snelle aanvulling mislukt.");
        }
        router.refresh();

        setPhase("premium");
        void fetch("/api/weekplan/hydrate-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meal_plan_id: mealPlanId,
            meal_id: mealId,
            quality_mode: true,
            force: true,
          }),
        }).finally(() => {
          window.setTimeout(() => {
            router.refresh();
          }, 8000);
        });
      } catch {
        setPhase("error");
      }
    }

    void run();
  }, [enabled, mealId, mealPlanId, router]);

  if (!enabled) return null;
  if (phase === "error") {
    return (
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Receptdetails laden ging niet in één keer. Ververs deze pagina om opnieuw te proberen.
      </p>
    );
  }
  if (phase === "premium") {
    return (
      <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
        Basisdetails staan klaar. We verfijnen nu automatisch naar premium kwaliteit.
      </p>
    );
  }
  return (
    <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
      Receptdetails worden nu snel geladen...
    </p>
  );
}

