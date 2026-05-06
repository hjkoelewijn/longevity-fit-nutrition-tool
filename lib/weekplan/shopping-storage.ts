import type { AlwaysInStockBlock, ShoppingCategory, WeekPlanPayload } from "./types";

/** Opgeslagen vorm in `shopping_lists.payload` (v2). Legacy: alleen `{ categories }`. */
export type ShoppingListStoredPayloadV2 = {
  version: 2;
  week_boodschappen: { categories: ShoppingCategory[] };
  always_in_stock: AlwaysInStockBlock;
};

function mapCategoriesWithPantryDefaults(categories: ShoppingCategory[]) {
  return categories.map((c) => ({
    ...c,
    items: c.items.map((it) => ({
      ...it,
      in_pantry: it.in_pantry ?? false,
    })),
  }));
}

export function buildShoppingListInsertPayload(
  payload: WeekPlanPayload,
): ShoppingListStoredPayloadV2 {
  return {
    version: 2,
    week_boodschappen: {
      categories: mapCategoriesWithPantryDefaults(payload.shopping_list.categories),
    },
    always_in_stock: {
      intro: payload.always_in_stock?.intro ?? null,
      categories: mapCategoriesWithPantryDefaults(
        payload.always_in_stock?.categories ?? [],
      ),
    },
  };
}

export function weeklyCategoriesFromStoredPayload(
  raw: unknown,
): ShoppingCategory[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (o.version === 2 && o.week_boodschappen && typeof o.week_boodschappen === "object") {
    const wb = o.week_boodschappen as { categories?: ShoppingCategory[] };
    return Array.isArray(wb.categories) ? wb.categories : [];
  }
  const legacy = o as { categories?: ShoppingCategory[] };
  return Array.isArray(legacy.categories) ? legacy.categories : [];
}

export function pantryFromStoredPayload(raw: unknown): AlwaysInStockBlock {
  if (!raw || typeof raw !== "object") {
    return { intro: null, categories: [] };
  }
  const o = raw as Record<string, unknown>;
  if (o.version === 2 && o.always_in_stock && typeof o.always_in_stock === "object") {
    const p = o.always_in_stock as AlwaysInStockBlock;
    return {
      intro: p.intro ?? null,
      categories: Array.isArray(p.categories) ? p.categories : [],
    };
  }
  return { intro: null, categories: [] };
}

export function setWeeklyItemPantry(
  raw: unknown,
  categoryId: string,
  itemId: string,
  inPantry: boolean,
): ShoppingListStoredPayloadV2 | { categories: ShoppingCategory[] } {
  if (raw && typeof raw === "object" && (raw as { version?: number }).version === 2) {
    const p = raw as ShoppingListStoredPayloadV2;
    const nextCats = p.week_boodschappen.categories.map((c) =>
      c.id !== categoryId
        ? c
        : {
            ...c,
            items: c.items.map((it) =>
              it.id === itemId ? { ...it, in_pantry: inPantry } : it,
            ),
          },
    );
    return {
      ...p,
      week_boodschappen: { categories: nextCats },
    };
  }
  const legacy = raw as { categories: ShoppingCategory[] };
  const categories = Array.isArray(legacy.categories) ? legacy.categories : [];
  return {
    categories: categories.map((c) =>
      c.id !== categoryId
        ? c
        : {
            ...c,
            items: c.items.map((it) =>
              it.id === itemId ? { ...it, in_pantry: inPantry } : it,
            ),
          },
    ),
  };
}
