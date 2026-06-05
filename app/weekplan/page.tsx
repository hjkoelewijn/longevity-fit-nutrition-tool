import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import type { WeekPlanPayload } from "@/lib/weekplan/types";
import { WeekplanClient, type MealPlanRow } from "./weekplan-client";
import { signOutAction } from "../dashboard/actions";

export const dynamic = "force-dynamic";

export default async function WeekplanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows } = await supabase
    .from("meal_plans")
    .select(
      "id, week_start, cook_sessions_per_week, snacks_enabled, payload, user_meta",
    )
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(10);

  // Ontdubbel op week_start: bewaar het meest recente plan per week.
  type PlanRow = NonNullable<typeof rows>[number];
  const byWeek = new Map<string, PlanRow>();
  for (const r of rows ?? []) {
    if (!byWeek.has(r.week_start)) byWeek.set(r.week_start, r);
  }
  const plans = [...byWeek.values()].sort((a, b) =>
    b.week_start.localeCompare(a.week_start),
  );

  // Kies standaard het plan waarvan de week vandaag bevat; anders het eerstvolgende; anders het meest recente.
  const todayIso = new Date().toISOString().slice(0, 10);
  function weekEndIso(weekStart: string): string {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }
  const activePlan =
    plans.find((p) => p.week_start <= todayIso && weekEndIso(p.week_start) >= todayIso) ??
    plans.find((p) => p.week_start > todayIso) ??
    plans[0] ??
    null;

  // Toon alleen huidige week + eerstvolgende week in de kiezer.
  const currentWeekPlan = plans.find(
    (p) => p.week_start <= todayIso && weekEndIso(p.week_start) >= todayIso,
  );
  const nextWeekPlan = plans.find((p) => p.week_start > todayIso);
  const visiblePlans = [currentWeekPlan, nextWeekPlan]
    .filter(Boolean)
    .filter((p, i, arr) => arr.findIndex((q) => q!.id === p!.id) === i) as typeof plans;

  const allPlans: MealPlanRow[] = visiblePlans.map((r) => ({
    id: r.id,
    week_start: r.week_start,
    cook_sessions_per_week: r.cook_sessions_per_week,
    snacks_enabled: r.snacks_enabled,
    payload: r.payload as unknown as WeekPlanPayload,
    user_meta: r.user_meta as MealPlanRow["user_meta"],
  }));

  const initialPlan: MealPlanRow | null = activePlan
    ? {
        id: activePlan.id,
        week_start: activePlan.week_start,
        cook_sessions_per_week: activePlan.cook_sessions_per_week,
        snacks_enabled: activePlan.snacks_enabled,
        payload: activePlan.payload as unknown as WeekPlanPayload,
        user_meta: activePlan.user_meta as MealPlanRow["user_meta"],
      }
    : null;

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
          <div className="flex justify-start">
            <Image
              src="/branding/longevity-fit-zwart-goud.png"
              alt="Longevity Fit"
              width={300}
              height={35}
              priority
            />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-stone-900">
            Mijn weekplan
          </h1>
          <p className="mt-2 text-stone-600">
            Persoonlijk menu op basis van de Longevity Fit-filosofie.
          </p>

          <div className="mt-8">
            <WeekplanClient initialPlan={initialPlan} allPlans={allPlans} />
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-stone-200 pt-8 sm:flex-row sm:flex-wrap sm:gap-x-8">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Profiel
            </Link>
            <Link
              href="/inspiratie"
              className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Inspiratie
            </Link>
            <Link
              href="/richtlijnen"
              className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Onze richtlijnen
            </Link>
          </div>

          <form action={signOutAction} className="mt-6">
            <button
              type="submit"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
