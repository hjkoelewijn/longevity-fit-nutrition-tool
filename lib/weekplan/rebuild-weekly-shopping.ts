import type { SupabaseClient } from "@supabase/supabase-js";
import type { MealPlanUserMeta, ShoppingCategory, WeekPlanPayload } from "./types";
import { aggregateWeekShoppingFromMeals } from "./aggregate-week-shopping-from-meals";
import {
  weeklyCategoriesFromStoredPayload,
  pantryFromStoredPayload,
  buildShoppingListInsertPayload,
  type ShoppingListStoredPayloadV2,
} from "./shopping-storage";

/** Zet week_boodschappen op basis van maaltijden + portiemultipliers; bewaart in_pantry-vinkjes waar id matcht. */
export function applyPantryFlagsToCategories(
  previous: ShoppingCategory[],
  next: ShoppingCategory[],
): ShoppingCategory[] {
  const flagById = new Map<string, boolean>();
  for (const c of previous) {
    for (const it of c.items) {
      flagById.set(it.id, Boolean(it.in_pantry));
    }
  }
  return next.map((c) => ({
    ...c,
    items: c.items.map((it) => ({
      ...it,
      in_pantry: flagById.get(it.id) ?? it.in_pantry ?? false,
    })),
  }));
}

export async function rebuildAndPersistWeeklyShopping(
  supabase: SupabaseClient,
  mealPlanId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: planRow, error: pErr } = await supabase
    .from("meal_plans")
    .select("id, user_id, payload, user_meta")
    .eq("id", mealPlanId)
    .maybeSingle();

  if (pErr || !planRow) {
    return { ok: false, error: pErr?.message ?? "Weekplan niet gevonden." };
  }

  const payload = (planRow as { payload: unknown }).payload as unknown as WeekPlanPayload;
  const meta = ((planRow as { user_meta?: unknown }).user_meta ?? {}) as MealPlanUserMeta;
  const mult = meta.recipePortionMultipliers ?? {};

  const fresh = aggregateWeekShoppingFromMeals(payload, mult);

  const { data: shopRow, error: sErr } = await supabase
    .from("shopping_lists")
    .select("id, payload")
    .eq("meal_plan_id", mealPlanId)
    .maybeSingle();

  if (sErr || !shopRow) {
    return { ok: false, error: sErr?.message ?? "Boodschappenlijst niet gevonden." };
  }

  const prevWeekly = weeklyCategoriesFromStoredPayload(shopRow.payload);
  const pantry = pantryFromStoredPayload(shopRow.payload);

  const mergedWeekly =
    fresh.length > 0 ? applyPantryFlagsToCategories(prevWeekly, fresh) : prevWeekly;

  const nextPayload: ShoppingListStoredPayloadV2 = {
    version: 2,
    week_boodschappen: { categories: mergedWeekly },
    always_in_stock: pantry,
  };

  const nextPlanPayload: WeekPlanPayload = {
    ...payload,
    shopping_list: { categories: mergedWeekly },
  };

  const shopId = String((shopRow as { id: string }).id);

  const { error: uShop } = await supabase
    .from("shopping_lists")
    .update({ payload: nextPayload as unknown as Record<string, unknown> })
    .eq("id", shopId);

  if (uShop) {
    return { ok: false, error: uShop.message };
  }

  const { error: uPlan } = await supabase
    .from("meal_plans")
    .update({ payload: nextPlanPayload as unknown as Record<string, unknown> })
    .eq("id", mealPlanId);

  if (uPlan) {
    return { ok: false, error: uPlan.message };
  }

  return { ok: true };
}

/** Na weekgeneratie: vull shopping payload (ingrediënten aanwezig) of behoud AI-lijst. */
export function weekShoppingPayloadForInsert(
  payload: WeekPlanPayload,
  portionMultipliers: Record<string, number> = {},
): ShoppingListStoredPayloadV2 {
  const fromMeals = aggregateWeekShoppingFromMeals(payload, portionMultipliers);
  const hasRows = fromMeals.some((c) => c.items.length > 0);

  const planForBuild: WeekPlanPayload = hasRows
    ? { ...payload, shopping_list: { categories: fromMeals } }
    : payload;

  return buildShoppingListInsertPayload(planForBuild);
}
