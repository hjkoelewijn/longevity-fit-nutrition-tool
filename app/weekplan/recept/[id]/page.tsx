import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { WeekPlanPayload } from "@/lib/weekplan/types";
import { carbProfileNl } from "@/lib/weekplan/carb-labels";
import { findMealById } from "@/lib/weekplan/meals-helpers";
import { signOutAction } from "../../../dashboard/actions";
import RecipeHydrationTrigger from "./recipe-hydration-trigger";

export const dynamic = "force-dynamic";

const slotNl: Record<string, string> = {
  ontbijt: "Ontbijt",
  lunch: "Lunch",
  diner: "Diner",
  tussendoortje: "Tussendoortje",
};

function servingsLabel(slot: string, servings: number): string {
  return slot === "diner"
    ? `${servings} porties (gezin)`
    : `${servings} portie (per persoon)`;
}

function formatAmount(amount: string): string {
  const raw = amount.trim();
  if (!raw) return "";
  if (/^\d+([.,]\d+)?$/.test(raw)) {
    return `${raw} g`;
  }
  return raw;
}

function formatAmountWithIngredient(name: string, amount: string): string {
  const raw = amount.trim();
  const ingredient = name.toLowerCase();
  const spiceLike =
    /(zout|peper|kaneel|komijn|kurkuma|paprika|oregano|tijm|venkel|specerij|kruiden|knoflookpoeder|uienpoeder|chilipoeder)/.test(
      ingredient,
    );
  const liquidLike =
    /(olijfolie|olie|azijn|citroensap|limoensap|sojasaus|tamari|honing|mosterd)/.test(
      ingredient,
    );

  if (!raw) {
    return "hoeveelheid volgt";
  }
  if (raw.toLowerCase() === "naar smaak") {
    return spiceLike ? "naar smaak" : "hoeveelheid volgt";
  }

  const asNumber = Number(raw.replace(",", "."));
  if (Number.isFinite(asNumber) && /^\d+([.,]\d+)?$/.test(raw)) {
    if (spiceLike && asNumber <= 1) return "snufje";
    if (spiceLike && asNumber <= 5) return `${Math.max(1, Math.round(asNumber / 2))} tl`;
    if (liquidLike && asNumber <= 15) return `${Math.max(1, Math.round(asNumber / 5))} tl`;
    if (liquidLike && asNumber <= 45) return `${Math.max(1, Math.round(asNumber / 15))} el`;
    return `${raw} g`;
  }

  const gramsMatch = raw.match(/^(\d+(?:[.,]\d+)?)\s*g$/i);
  if (gramsMatch) {
    const g = Number(gramsMatch[1].replace(",", "."));
    if (Number.isFinite(g)) {
      if (spiceLike && g <= 1) return "snufje";
      if (spiceLike && g <= 5) return `${Math.max(1, Math.round(g / 2))} tl`;
      if (liquidLike && g <= 15) return `${Math.max(1, Math.round(g / 5))} tl`;
      if (liquidLike && g <= 45) return `${Math.max(1, Math.round(g / 15))} el`;
    }
  }

  return formatAmount(raw);
}


function lunchUsesLeftoversTitle(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes("restjes") || t.includes("leftover");
}

export default async function WeekplanReceptPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: mealIdRaw } = await props.params;
  const mealId = decodeURIComponent(mealIdRaw);
  const searchParams = (await props.searchParams) ?? {};
  const mpRaw = searchParams.mp;
  const mp = typeof mpRaw === "string" ? mpRaw.trim() : "";

  if (!mp) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plan, error } = await supabase
    .from("meal_plans")
    .select("id, payload, user_id")
    .eq("id", mp)
    .maybeSingle();

  if (error || !plan || plan.user_id !== user.id) {
    notFound();
  }

  const payload = plan.payload as unknown as WeekPlanPayload;
  const meal = findMealById(payload, mealId);
  if (!meal) {
    notFound();
  }
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  const steps = Array.isArray(meal.steps) ? meal.steps : [];
  const needsHydration = ingredients.length === 0 || steps.length === 0;
  const dayIndex = payload.days.findIndex((d) =>
    [d.meals.ontbijt, d.meals.lunch, d.meals.diner, ...(d.tussendoortjes ?? [])].some(
      (m) => m.id === meal.id,
    ),
  );
  const hasLeftoverLunchTomorrow =
    meal.slot === "diner" &&
    dayIndex >= 0 &&
    dayIndex < payload.days.length - 1 &&
    (payload.days[dayIndex + 1].meals.lunch.repeat_for_leftovers === true ||
      lunchUsesLeftoversTitle(payload.days[dayIndex + 1].meals.lunch.title));

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

          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-stone-500">
            {slotNl[meal.slot] ?? meal.slot}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-stone-900">
            {meal.title}
          </h1>
          <Link
            href="/richtlijnen"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-stone-700 underline underline-offset-4"
            title="Binnen onze richtlijnen"
          >
            <span aria-hidden>🧭</span>
            Binnen onze richtlijnen
          </Link>
          <p className="mt-2 text-sm text-stone-600">
            {meal.prep_minutes} min · {servingsLabel(meal.slot, meal.servings)} · koolhydraatmoment:{" "}
            {carbProfileNl(meal.carb_profile)}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Intuïtief eten: zie porties als richtlijn. Luister naar trek/verzadiging
            (actieve dag = vaak meer trek). Begin op je bord met groente + eiwit,
            daarna vetten, daarna koolhydraten.
          </p>
          {meal.kid_tip ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <span className="font-medium">Tip voor kinderen:</span>{" "}
              {meal.kid_tip}
            </p>
          ) : null}
          {hasLeftoverLunchTomorrow ? (
            <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <span className="font-medium">Restjes-tip:</span> houd je het weekplan aan en
              eet je dit morgen als lunch, maak dan ongeveer{" "}
              <strong>150 g groente + 75 g eiwit + 50 g koolhydraatbron</strong> extra
              voor 1 extra lunchportie.
            </p>
          ) : null}
          <RecipeHydrationTrigger mealPlanId={mp} mealId={meal.id} enabled={needsHydration} />

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-stone-900">Ingrediënten</h2>
            {ingredients.length > 0 ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-stone-800">
                {ingredients.map((ing, i) => (
                  <li key={i}>
                    <span className="font-medium">{String(ing.name ?? "Ingrediënt")}</span>{" "}
                    <span className="text-stone-600">
                      {formatAmountWithIngredient(
                        String(ing.name ?? "Ingrediënt"),
                        String(ing.amount ?? ""),
                      )}
                    </span>
                    {ing.note ? (
                      <span className="text-stone-500"> ({String(ing.note)})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-600">
                Ingrediënten worden nog aangevuld. Ververs deze pagina over 1-2 minuten.
              </p>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-stone-900">Bereiding</h2>
            {steps.length > 0 ? (
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-stone-800">
                {steps.map((step, i) => (
                  <li key={i} className="pl-1">
                    {String(step)}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-stone-600">
                Bereidingsstappen worden nog aangevuld. Ververs deze pagina over 1-2 minuten.
              </p>
            )}
          </section>

          <div className="mt-10 flex flex-wrap gap-4 border-t border-stone-200 pt-8 text-sm">
            <Link
              href={`/weekplan/boodschappen?mp=${mp}`}
              className="font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Boodschappen
            </Link>
            <Link
              href="/weekplan"
              className="font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Weekplan
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
