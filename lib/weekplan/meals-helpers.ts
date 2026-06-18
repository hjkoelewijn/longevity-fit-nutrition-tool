import type {
  AlwaysInStockBlock,
  WeekPlanMeal,
  WeekPlanPayload,
} from "./types";

export function collectAllMeals(payload: WeekPlanPayload): WeekPlanMeal[] {
  const out: WeekPlanMeal[] = [];
  for (const day of payload.days) {
    out.push(day.meals.ontbijt, day.meals.lunch, day.meals.diner);
    out.push(...(day.tussendoortjes ?? []));
  }
  return out;
}

/** Unieke diner-titels voor variatie-regels over weken heen (kooksessies draaien vooral om diner). */
export function uniqueDinnerTitles(payload: WeekPlanPayload): string[] {
  const set = new Set<string>();
  for (const day of payload.days) {
    const t = day.meals.diner.title.trim();
    if (!t) continue;
    set.add(t.toLowerCase());
  }
  return [...set];
}

export function uniqueOntbijtTitles(payload: WeekPlanPayload): string[] {
  const set = new Set<string>();
  for (const day of payload.days) {
    const t = day.meals.ontbijt.title.trim();
    if (!t) continue;
    set.add(t.toLowerCase());
  }
  return [...set];
}

export function uniqueLunchTitles(payload: WeekPlanPayload): string[] {
  const set = new Set<string>();
  for (const day of payload.days) {
    const t = day.meals.lunch.title.trim();
    if (!t) continue;
    set.add(t.toLowerCase());
  }
  return [...set];
}

/** Voor allergie-regex op voorraadlijst (zelfde velden als WeekPlanMeal voor checkAllergiesInMeals). */
export function pantryStaplesAsPseudoMeals(pantry: AlwaysInStockBlock): WeekPlanMeal[] {
  const out: WeekPlanMeal[] = [];
  for (const cat of pantry.categories ?? []) {
    for (const it of cat.items) {
      out.push({
        id: `pantry-${cat.id}-${it.id}`,
        slot: "ontbijt",
        title: it.name,
        prep_minutes: 0,
        servings: 1,
        ingredients: [{ name: it.name, amount: it.quantity }],
        steps: [],
        carb_profile: "none",
      });
    }
  }
  return out;
}

export function findMealById(
  payload: WeekPlanPayload,
  mealId: string,
): WeekPlanMeal | null {
  for (const day of payload.days) {
    const slots = [
      day.meals.ontbijt,
      day.meals.lunch,
      day.meals.diner,
      ...(day.tussendoortjes ?? []),
    ];
    const hit = slots.find((m) => m.id === mealId);
    if (hit) return hit;
  }
  return null;
}
