import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { carbProfileNl } from "@/lib/weekplan/carb-labels";
import type { MealSlot, WeekPlanMeal, WeekPlanPayload } from "@/lib/weekplan/types";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const SLOT_FILTERS = ["alles", "ontbijt", "lunch", "diner", "snack"] as const;
type SlotFilter = (typeof SLOT_FILTERS)[number];

const SLOT_NL: Record<MealSlot, string> = {
  ontbijt: "Ontbijt",
  lunch: "Lunch",
  diner: "Diner",
  tussendoortje: "Snack",
};

type InspirationItem = {
  dedupeKey: string;
  mealId: string;
  mealPlanId: string;
  weekStart: string;
  slot: MealSlot;
  title: string;
  prepMinutes: number;
  servings: number;
  carb: string;
};

function slotFilterMatches(slot: MealSlot, f: SlotFilter): boolean {
  if (f === "alles") return true;
  if (f === "snack") return slot === "tussendoortje";
  return slot === f;
}

function servingsText(slot: MealSlot, servings: number): string {
  return slot === "diner"
    ? `${servings} porties (gezin)`
    : `${servings} portie (per persoon)`;
}

function pushMeal(
  out: InspirationItem[],
  seen: Set<string>,
  meal: WeekPlanMeal,
  mealPlanId: string,
  weekStart: string,
) {
  const title = meal.title.trim();
  if (!title) return;
  const dedupeKey = `${meal.slot}:${title.toLowerCase()}`;
  if (seen.has(dedupeKey)) return;
  seen.add(dedupeKey);
  out.push({
    dedupeKey,
    mealId: meal.id,
    mealPlanId,
    weekStart,
    slot: meal.slot,
    title,
    prepMinutes: meal.prep_minutes,
    servings: meal.servings,
    carb: carbProfileNl(meal.carb_profile),
  });
}

export default async function InspiratiePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const slotRaw = typeof sp.slot === "string" ? sp.slot : "";
  const slotFilter = SLOT_FILTERS.includes(slotRaw as SlotFilter)
    ? (slotRaw as SlotFilter)
    : "alles";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: rows } = await supabase
    .from("meal_plans")
    .select("id, week_start, payload")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const items: InspirationItem[] = [];
  const seen = new Set<string>();

  for (const row of rows ?? []) {
    const payload = row.payload as unknown as WeekPlanPayload;
    for (const day of payload.days ?? []) {
      pushMeal(items, seen, day.meals.ontbijt, row.id, row.week_start);
      pushMeal(items, seen, day.meals.lunch, row.id, row.week_start);
      pushMeal(items, seen, day.meals.diner, row.id, row.week_start);
      for (const snack of day.tussendoortjes ?? []) {
        pushMeal(items, seen, snack, row.id, row.week_start);
      }
    }
  }

  const filtered = items.filter((i) => slotFilterMatches(i.slot, slotFilter));

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
        <div className="flex justify-start">
          <Image
            src="/branding/longevity-fit-zwart-goud.png"
            alt="Longevity Fit"
            width={300}
            height={35}
            priority
          />
        </div>

        <h1 className="mt-6 text-3xl font-semibold text-stone-900">Inspiratie</h1>
        <p className="mt-2 text-sm text-stone-600">
          Snel bladeren door je eerdere maaltijden. Filter op ontbijt, lunch, diner of snacks.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {SLOT_FILTERS.map((f) => {
            const active = f === slotFilter;
            const href = f === "alles" ? "/inspiratie" : `/inspiratie?slot=${f}`;
            const label =
              f === "alles"
                ? "Alles"
                : f === "snack"
                  ? "Snack"
                  : f[0].toUpperCase() + f.slice(1);
            return (
              <Link
                key={f}
                href={href}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-stone-900 text-white"
                    : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <ul className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <li className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              Nog geen inspiratie-items voor deze filter.
            </li>
          ) : (
            filtered.map((m) => (
              <li
                key={m.dedupeKey}
                className="rounded-xl border border-stone-200 bg-white px-4 py-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  {SLOT_NL[m.slot]}
                </p>
                <Link
                  href={`/weekplan/recept/${encodeURIComponent(m.mealId)}?mp=${m.mealPlanId}`}
                  className="mt-1 block text-sm font-semibold text-stone-900 underline-offset-4 hover:underline"
                >
                  {m.title}
                </Link>
                <p className="mt-1 text-xs text-stone-600">
                  {m.prepMinutes} min · {servingsText(m.slot, m.servings)} · koolhydraatmoment:{" "}
                  {m.carb}
                </p>
              </li>
            ))
          )}
        </ul>

        <div className="mt-8 flex flex-wrap gap-4 border-t border-stone-200 pt-6 text-sm">
          <Link href="/weekplan" className="font-medium text-stone-900 underline-offset-4 hover:underline">
            Weekplan
          </Link>
          <Link href="/dashboard" className="font-medium text-stone-900 underline-offset-4 hover:underline">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
