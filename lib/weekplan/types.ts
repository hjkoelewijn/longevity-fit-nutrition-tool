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
  /**
   * Weekboodschappen, gesplitst:
   * - `lunches_breakfast_snacks`: totaal voor 1 persoon (jij) voor de hele week (7 ontbijten,
   *   7 lunches en eventueel tussendoortjes). Schaalt niet op de UI.
   * - `dinners`: totaal voor 1 dinerportie over de week (1× per persoon per diner).
   *   Op de boodschappenpagina kun je dit blok vermenigvuldigen met "diner voor … personen".
   * - `categories`: legacy/oudere plannen — één flatte lijst zonder splitsing.
   */
  shopping_list: {
    lunches_breakfast_snacks?: { categories: ShoppingCategory[] };
    dinners?: { categories: ShoppingCategory[] };
    /** @deprecated alleen voor oudere weekplannen. */
    categories?: ShoppingCategory[];
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
  /** mealId -> 1–8; alleen voor de ingrediënten-weergave op de receptpagina (geen effect op weekboodschappen). */
  recipePortionMultipliers?: Record<string, number>;
  /** Aantal personen waarvoor het diner-blok op de boodschappenpagina vermenigvuldigd wordt (default 1). */
  dinerHouseholdSize?: number;
};
