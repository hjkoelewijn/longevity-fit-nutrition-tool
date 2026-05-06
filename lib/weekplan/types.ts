/** AI-output contract voor weekplan (Claude JSON). */

export type CarbProfile = "none" | "light" | "primary";

export type MealSlot = "ontbijt" | "lunch" | "diner" | "tussendoortje";

export type WeekPlanIngredient = {
  name: string;
  amount: string;
  note?: string | null;
};

export type WeekPlanMeal = {
  id: string;
  slot: MealSlot;
  title: string;
  prep_minutes: number;
  servings: number;
  kid_tip?: string | null;
  ingredients: WeekPlanIngredient[];
  steps: string[];
  carb_profile: CarbProfile;
  allergen_flags?: string[];
  repeat_for_leftovers?: boolean;
};

export type WeekPlanDay = {
  date_iso: string;
  day_index: number;
  cycle_hint?: string | null;
  eat_moments_count?: number;
  carb_moments_count?: number;
  meals: {
    ontbijt: WeekPlanMeal;
    lunch: WeekPlanMeal;
    diner: WeekPlanMeal;
  };
  tussendoortjes: WeekPlanMeal[];
};

export type ShoppingCategory = {
  id: string;
  label: string;
  items: Array<{
    id: string;
    name: string;
    quantity: string;
    in_pantry?: boolean;
  }>;
};

/** Eenmalige voorraad / basisvoorraad om snel voedzame maaltijden te kunnen maken. */
export type AlwaysInStockBlock = {
  intro?: string | null;
  categories: ShoppingCategory[];
};

export type WeekPlanPayload = {
  schema_version: 1;
  week_start_iso: string;
  locale?: string;
  generation_notes?: string;
  days: WeekPlanDay[];
  shopping_list: {
    categories: ShoppingCategory[];
  };
  /** Basis op voorraad (investering); naast week-boodschappen. */
  always_in_stock: AlwaysInStockBlock;
};

export type MealPlanUserMeta = {
  completedMealIds?: string[];
  hydrationStatus?: "hydrating" | "ready" | "failed";
  hydrationError?: string;
  /** mealId -> vervangen recept-snapshot (optioneel) */
  replacements?: Record<string, WeekPlanMeal>;
};
