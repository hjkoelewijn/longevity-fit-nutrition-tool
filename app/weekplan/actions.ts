"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { MealPlanUserMeta } from "@/lib/weekplan/types";
import {
  setWeeklyItemPantry,
  type ShoppingSection,
} from "@/lib/weekplan/shopping-storage";

export async function toggleShoppingPantryAction(input: {
  shoppingListId: string;
  section: ShoppingSection;
  categoryId: string;
  itemId: string;
  inPantry: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Niet ingelogd." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("shopping_lists")
    .select("id, payload, user_id")
    .eq("id", input.shoppingListId)
    .maybeSingle();

  if (fetchErr || !row || row.user_id !== user.id) {
    return { ok: false as const, error: "Boodschappenlijst niet gevonden." };
  }

  const next = setWeeklyItemPantry(
    row.payload,
    input.section,
    input.categoryId,
    input.itemId,
    input.inPantry,
  );

  const { error: upErr } = await supabase
    .from("shopping_lists")
    .update({ payload: next as unknown as Record<string, unknown> })
    .eq("id", input.shoppingListId);

  if (upErr) {
    return { ok: false as const, error: upErr.message };
  }

  revalidatePath("/weekplan/boodschappen");
  revalidatePath("/weekplan");
  return { ok: true as const };
}

export async function toggleMealDoneAction(input: {
  mealPlanId: string;
  mealId: string;
  done: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Niet ingelogd." };
  }

  const { data: plan, error: fetchErr } = await supabase
    .from("meal_plans")
    .select("id, user_id, user_meta")
    .eq("id", input.mealPlanId)
    .maybeSingle();

  if (fetchErr || !plan || plan.user_id !== user.id) {
    return { ok: false as const, error: "Weekplan niet gevonden." };
  }

  const meta = (plan.user_meta ?? {}) as { completedMealIds?: string[] };
  const prev = Array.isArray(meta.completedMealIds)
    ? meta.completedMealIds.filter((x): x is string => typeof x === "string")
    : [];
  const set = new Set(prev);
  if (input.done) {
    set.add(input.mealId);
  } else {
    set.delete(input.mealId);
  }

  const { error: upErr } = await supabase
    .from("meal_plans")
    .update({
      user_meta: {
        ...meta,
        completedMealIds: [...set],
      } as unknown as Record<string, unknown>,
    })
    .eq("id", input.mealPlanId);

  if (upErr) {
    return { ok: false as const, error: upErr.message };
  }

  revalidatePath("/weekplan");
  return { ok: true as const };
}

/** Aantal personen voor het diner-blok op de boodschappenpagina (1–8). */
export async function setDinerHouseholdSizeAction(input: {
  mealPlanId: string;
  size: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Niet ingelogd." };
  }

  const n = Math.floor(Number(input.size));
  const size = Number.isFinite(n) ? Math.min(8, Math.max(1, n)) : 1;

  const { data: plan, error: fetchErr } = await supabase
    .from("meal_plans")
    .select("id, user_id, user_meta")
    .eq("id", input.mealPlanId)
    .maybeSingle();

  if (fetchErr || !plan || plan.user_id !== user.id) {
    return { ok: false as const, error: "Weekplan niet gevonden." };
  }

  const meta = (plan.user_meta ?? {}) as MealPlanUserMeta;

  const { error: upErr } = await supabase
    .from("meal_plans")
    .update({
      user_meta: {
        ...meta,
        dinerHouseholdSize: size,
      } as unknown as Record<string, unknown>,
    })
    .eq("id", input.mealPlanId);

  if (upErr) {
    return { ok: false as const, error: upErr.message };
  }

  revalidatePath("/weekplan/boodschappen");
  return { ok: true as const };
}
