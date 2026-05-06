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

  const { data: row } = await supabase
    .from("meal_plans")
    .select(
      "id, week_start, cook_sessions_per_week, snacks_enabled, payload, user_meta",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let initialPlan: MealPlanRow | null = null;
  if (row) {
    initialPlan = {
      id: row.id,
      week_start: row.week_start,
      cook_sessions_per_week: row.cook_sessions_per_week,
      snacks_enabled: row.snacks_enabled,
      payload: row.payload as unknown as WeekPlanPayload,
      user_meta: row.user_meta as MealPlanRow["user_meta"],
    };
  }

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
            <WeekplanClient initialPlan={initialPlan} />
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
