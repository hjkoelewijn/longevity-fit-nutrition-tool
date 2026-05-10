"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setRecipePortionMultiplierAction } from "../../actions";

type Props = {
  mealPlanId: string;
  mealId: string;
  portionMultiplier: number;
};

export function PortionScaleControls({ mealPlanId, mealId, portionMultiplier }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const current = portionMultiplier >= 1 && portionMultiplier <= 8 ? portionMultiplier : 1;

  return (
    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-xs text-stone-600">
        Basisrecept is <strong>1 portie</strong>. Hier kies je hoeveel porties voor{" "}
        <strong>dit gerecht</strong> — dat wordt opgeslagen en de{" "}
        <strong>boodschappenlijst wordt herberekend</strong> voor het hele weekplan.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((n) => {
          const active = n === current;
          return (
            <button
              key={n}
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await setRecipePortionMultiplierAction({
                    mealPlanId,
                    mealId,
                    multiplier: n,
                  });
                  if (!res.ok) return;
                  router.refresh();
                })
              }
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                active
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              x{n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
