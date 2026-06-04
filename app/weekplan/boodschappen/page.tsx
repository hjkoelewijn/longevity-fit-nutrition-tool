import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { MealPlanUserMeta } from "@/lib/weekplan/types";
import {
  dinnersFromStoredPayload,
  lunchesFromStoredPayload,
  pantryFromStoredPayload,
  splitLunchesAndPantry,
} from "@/lib/weekplan/shopping-storage";
import { BoodschappenClient } from "./boodschappen-client";
import { signOutAction } from "../../dashboard/actions";

export const dynamic = "force-dynamic";

export default async function BoodschappenPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const mpRaw = searchParams.mp;
  const mp = typeof mpRaw === "string" ? mpRaw.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("shopping_lists")
    .select("id, payload, meal_plan_id")
    .eq("user_id", user.id);

  if (mp) {
    query = query.eq("meal_plan_id", mp);
  }

  const { data: row, error } = mp
    ? await query.maybeSingle()
    : await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
          {error.message}
        </div>
      </main>
    );
  }

  const allLunches = row ? lunchesFromStoredPayload(row.payload) : [];
  const { lunches, pantry: pantryCategories } = splitLunchesAndPantry(allLunches);
  const dinners = row ? dinnersFromStoredPayload(row.payload) : [];
  const pantryIntro = row ? pantryFromStoredPayload(row.payload).intro : null;

  let householdSize = 1;
  if (row) {
    const { data: planRow } = await supabase
      .from("meal_plans")
      .select("user_meta")
      .eq("id", row.meal_plan_id)
      .maybeSingle();
    const meta = (planRow?.user_meta ?? {}) as MealPlanUserMeta;
    if (
      typeof meta.dinerHouseholdSize === "number" &&
      Number.isFinite(meta.dinerHouseholdSize)
    ) {
      householdSize = Math.min(8, Math.max(1, Math.floor(meta.dinerHouseholdSize)));
    }
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
            Boodschappen
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            <strong>Voor lunches, ontbijt & snacks</strong> (jij alleen) en{" "}
            <strong>voor diners</strong> (gezin). Onderaan staat «altijd op voorraad»: je
            basisvoorraad met dezelfde «In voorraad»-vinkjes. Boven het diner-blok stel je
            in voor hoeveel personen je het diner kookt. Zonder gekozen plan zie je het
            meest recente weekplan; vanaf de weekpagina kun je een specifiek plan openen.
          </p>

          {!row ? (
            <p className="mt-8 text-sm text-stone-600">
              Nog geen boodschappenlijst.{" "}
              <Link
                href="/weekplan"
                className="font-medium text-stone-900 underline-offset-4 hover:underline"
              >
                Genereer eerst een weekplan
              </Link>
              .
            </p>
          ) : (
            <div className="mt-8">
              <BoodschappenClient
                mealPlanId={row.meal_plan_id}
                shoppingListId={row.id}
                lunchesCategories={lunches}
                dinersCategories={dinners}
                pantryCategories={pantryCategories}
                pantryIntro={pantryIntro}
                initialDinerHouseholdSize={householdSize}
              />
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-4 border-t border-stone-200 pt-8 text-sm">
            <Link
              href="/weekplan"
              className="font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Weekplan
            </Link>
            <Link
              href="/dashboard"
              className="font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Dashboard
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
