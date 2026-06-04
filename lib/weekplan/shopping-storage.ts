import type { AlwaysInStockBlock, ShoppingCategory, WeekPlanPayload } from "./types";

/**
 * Opgeslagen vorm in `shopping_lists.payload`.
 * - v3 = gesplitst in `lunches_breakfast_snacks` en `dinners`.
 * - v2 = één flatte lijst (oude plannen) — wordt nog gelezen voor backward compat.
 * - v1/legacy = `{ categories }` zonder version.
 *
 * Basisvoorraad (`always_in_stock` uit het weekplan) wordt bij opslag **samengevoegd**
 * in `lunches_breakfast_snacks.categories` (prefix `basis::c:` / `basis::i:`) zodat alles
 * op één boodschappenlijst staat met dezelfde «In voorraad»-vinkjes. In de payload blijft
 * `always_in_stock.intro` staan; `always_in_stock.categories` is leeg na merge om
 * dubbele weergave te voorkomen.
 */
export type ShoppingListStoredPayloadV3 = {
  version: 3;
  lunches_breakfast_snacks: { categories: ShoppingCategory[] };
  dinners: { categories: ShoppingCategory[] };
  always_in_stock: AlwaysInStockBlock;
};

export type ShoppingSection = "lunches" | "dinners";

const BASIS_CAT = "basis::c:";
const BASIS_ITEM = "basis::i:";

function decodeBasisCategory(id: string): string | null {
  if (!id.startsWith(BASIS_CAT)) return null;
  try {
    return decodeURIComponent(id.slice(BASIS_CAT.length));
  } catch {
    return null;
  }
}

function decodeBasisItem(id: string): { cat: string; item: string } | null {
  if (!id.startsWith(BASIS_ITEM)) return null;
  const rest = id.slice(BASIS_ITEM.length);
  const sep = rest.indexOf("::");
  if (sep === -1) return null;
  try {
    return {
      cat: decodeURIComponent(rest.slice(0, sep)),
      item: decodeURIComponent(rest.slice(sep + 2)),
    };
  } catch {
    return null;
  }
}

/** Voegt basisvoorraad-categorieën toe aan de lunch/snacks-lijst (stabiele id’s). */
export function mapPantryToMergedShoppingCategories(
  pantryCategories: ShoppingCategory[],
): ShoppingCategory[] {
  return mapCategoriesWithPantryDefaults(pantryCategories).map((c) => ({
    ...c,
    id: `${BASIS_CAT}${encodeURIComponent(c.id)}`,
    items: c.items.map((it) => ({
      ...it,
      id: `${BASIS_ITEM}${encodeURIComponent(c.id)}::${encodeURIComponent(it.id)}`,
    })),
  }));
}

function lunchesHaveMergedBasis(categories: ShoppingCategory[]): boolean {
  return categories.some((c) => c.id.startsWith(BASIS_CAT));
}

/**
 * Splitst een (samengevoegde) lunch-lijst in de échte lunch/ontbijt/snack-categorieën
 * en de basisvoorraad-categorieën («altijd op voorraad», met `basis::`-id’s). Zo kan de
 * basisvoorraad weer als aparte sectie getoond worden, terwijl de opslag en de
 * «In voorraad»-toggle (sectie "lunches") onveranderd blijven werken.
 */
export function splitLunchesAndPantry(categories: ShoppingCategory[]): {
  lunches: ShoppingCategory[];
  pantry: ShoppingCategory[];
} {
  const lunches: ShoppingCategory[] = [];
  const pantry: ShoppingCategory[] = [];
  for (const c of categories) {
    if (c.id.startsWith(BASIS_CAT)) {
      pantry.push(c);
    } else {
      lunches.push(c);
    }
  }
  return { lunches, pantry };
}

export function mapCategoriesWithPantryDefaults(categories: ShoppingCategory[]) {
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
): ShoppingListStoredPayloadV3 {
  const sl = payload.shopping_list ?? {};
  const lunchesSrc =
    sl.lunches_breakfast_snacks?.categories ?? sl.categories ?? [];
  const dinersSrc = sl.dinners?.categories ?? [];
  const lunchBase = mapCategoriesWithPantryDefaults(lunchesSrc);
  const mergedPantry = mapPantryToMergedShoppingCategories(
    payload.always_in_stock?.categories ?? [],
  );
  return {
    version: 3,
    lunches_breakfast_snacks: {
      categories: [...lunchBase, ...mergedPantry],
    },
    dinners: {
      categories: mapCategoriesWithPantryDefaults(dinersSrc),
    },
    always_in_stock: {
      intro: payload.always_in_stock?.intro ?? null,
      categories: [],
    },
  };
}

function mergePantryIntoLunchesIfNeeded(
  lunchCategories: ShoppingCategory[],
  raw: Record<string, unknown>,
): ShoppingCategory[] {
  const ais = pantryFromStoredPayload(raw);
  if (!ais.categories?.length) return lunchCategories;
  if (lunchesHaveMergedBasis(lunchCategories)) return lunchCategories;
  return [...lunchCategories, ...mapPantryToMergedShoppingCategories(ais.categories)];
}

/** Lunches/ontbijt/snacks + basisvoorraad (samengevoegd). Oude plannen: virtuele merge. */
export function lunchesFromStoredPayload(raw: unknown): ShoppingCategory[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (
    o.version === 3 &&
    o.lunches_breakfast_snacks &&
    typeof o.lunches_breakfast_snacks === "object"
  ) {
    const wb = o.lunches_breakfast_snacks as { categories?: ShoppingCategory[] };
    const cats = Array.isArray(wb.categories) ? wb.categories : [];
    return mergePantryIntoLunchesIfNeeded(cats, o);
  }
  if (o.version === 2 && o.week_boodschappen && typeof o.week_boodschappen === "object") {
    const wb = o.week_boodschappen as { categories?: ShoppingCategory[] };
    const cats = Array.isArray(wb.categories) ? wb.categories : [];
    return mergePantryIntoLunchesIfNeeded(cats, o);
  }
  const legacy = o as { categories?: ShoppingCategory[] };
  const cats = Array.isArray(legacy.categories) ? legacy.categories : [];
  return mergePantryIntoLunchesIfNeeded(cats, o);
}

/** Diners (alleen aanwezig op v3-plannen). */
export function dinnersFromStoredPayload(raw: unknown): ShoppingCategory[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (o.version === 3 && o.dinners && typeof o.dinners === "object") {
    const wb = o.dinners as { categories?: ShoppingCategory[] };
    return Array.isArray(wb.categories) ? wb.categories : [];
  }
  return [];
}

export function pantryFromStoredPayload(raw: unknown): AlwaysInStockBlock {
  if (!raw || typeof raw !== "object") {
    return { intro: null, categories: [] };
  }
  const o = raw as Record<string, unknown>;
  if (
    (o.version === 3 || o.version === 2) &&
    o.always_in_stock &&
    typeof o.always_in_stock === "object"
  ) {
    const p = o.always_in_stock as AlwaysInStockBlock;
    return {
      intro: p.intro ?? null,
      categories: Array.isArray(p.categories) ? p.categories : [],
    };
  }
  return { intro: null, categories: [] };
}

function setFlagInCategories(
  categories: ShoppingCategory[],
  categoryId: string,
  itemId: string,
  inPantry: boolean,
): ShoppingCategory[] {
  return categories.map((c) =>
    c.id !== categoryId
      ? c
      : {
          ...c,
          items: c.items.map((it) =>
            it.id === itemId ? { ...it, in_pantry: inPantry } : it,
          ),
        },
  );
}

function trySetFlagInCategories(
  categories: ShoppingCategory[],
  categoryId: string,
  itemId: string,
  inPantry: boolean,
): ShoppingCategory[] | null {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return null;
  if (!cat.items.some((it) => it.id === itemId)) return null;
  return setFlagInCategories(categories, categoryId, itemId, inPantry);
}

/**
 * Zet «In voorraad»-vinkje. V3: lunches (incl. samengevoegde basisvoorraad met `basis::`-id’s),
 * dinners. Oude lijsten: basis staat soms nog in `always_in_stock` — toggle valt dan terug
 * op die structuur.
 */
export function setWeeklyItemPantry(
  raw: unknown,
  section: ShoppingSection,
  categoryId: string,
  itemId: string,
  inPantry: boolean,
): unknown {
  if (raw && typeof raw === "object" && (raw as { version?: number }).version === 3) {
    const p = raw as ShoppingListStoredPayloadV3;
    if (section === "lunches") {
      const next = trySetFlagInCategories(
        p.lunches_breakfast_snacks.categories,
        categoryId,
        itemId,
        inPantry,
      );
      if (next) {
        return {
          ...p,
          lunches_breakfast_snacks: { categories: next },
        };
      }
      const catOrig = decodeBasisCategory(categoryId);
      const itemPair = decodeBasisItem(itemId);
      const ais = p.always_in_stock ?? { intro: null, categories: [] };
      if (
        catOrig &&
        itemPair &&
        itemPair.cat === catOrig &&
        Array.isArray(ais.categories) &&
        ais.categories.length > 0
      ) {
        return {
          ...p,
          always_in_stock: {
            ...ais,
            categories: setFlagInCategories(
              ais.categories,
              catOrig,
              itemPair.item,
              inPantry,
            ),
          },
        };
      }
      return p;
    }
    return {
      ...p,
      dinners: {
        categories: setFlagInCategories(
          p.dinners.categories,
          categoryId,
          itemId,
          inPantry,
        ),
      },
    };
  }
  if (raw && typeof raw === "object" && (raw as { version?: number }).version === 2) {
    const p = raw as {
      version: 2;
      week_boodschappen: { categories: ShoppingCategory[] };
      always_in_stock?: AlwaysInStockBlock;
    };
    if (section === "lunches") {
      const next = trySetFlagInCategories(
        p.week_boodschappen.categories,
        categoryId,
        itemId,
        inPantry,
      );
      if (next) {
        return { ...p, week_boodschappen: { categories: next } };
      }
      const catOrig = decodeBasisCategory(categoryId);
      const itemPair = decodeBasisItem(itemId);
      const ais = p.always_in_stock;
      if (
        catOrig &&
        itemPair &&
        itemPair.cat === catOrig &&
        ais &&
        Array.isArray(ais.categories) &&
        ais.categories.length > 0
      ) {
        return {
          ...p,
          always_in_stock: {
            ...ais,
            categories: setFlagInCategories(
              ais.categories,
              catOrig,
              itemPair.item,
              inPantry,
            ),
          },
        };
      }
      return p;
    }
    return {
      ...p,
      week_boodschappen: {
        categories: setFlagInCategories(
          p.week_boodschappen.categories,
          categoryId,
          itemId,
          inPantry,
        ),
      },
    };
  }
  const legacy = raw as { categories?: ShoppingCategory[] };
  const categories = Array.isArray(legacy?.categories) ? legacy.categories : [];
  return {
    categories: setFlagInCategories(categories, categoryId, itemId, inPantry),
  };
}
