import type { WeekPlanDay, WeekPlanMeal, WeekPlanPayload } from "./types";
import {
  KOOLHYDRAATMOMENT_UITLEG_VOOR_PROMPT,
} from "./carb-moment-rules";

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string; soft?: boolean };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function collectTextFromMeal(m: WeekPlanMeal): string {
  const ing = m.ingredients.map((i) => `${i.name} ${i.amount}`).join(" ");
  const st = m.steps.join(" ");
  return `${m.title} ${ing} ${st}`.toLowerCase();
}

/** Ruwe allergie-check: substring op bekende triggers (conservatief). */
export function checkAllergiesInMeals(
  allergies: string[],
  meals: WeekPlanMeal[],
): ValidationResult {
  const hay = meals.map(collectTextFromMeal).join(" | ");
  for (const a of allergies) {
    const low = a.toLowerCase();
    if (low.includes("noten")) {
      if (/\b(amandel|hazelnoot|walnoot|pecan|pinda|noten|cashew|paranoot|macadamia)\b/i.test(hay)) {
        return {
          ok: false,
          code: "allergy_noten",
          message:
            "Het plan bevat mogelijk noten of noten-sporen terwijl je een notenallergie hebt aangegeven.",
        };
      }
    }
    if (low.includes("pinda")) {
      if (/\bpinda\b/i.test(hay)) {
        return {
          ok: false,
          code: "allergy_pinda",
          message: "Het plan bevat pinda terwijl je dat hebt uitgesloten.",
        };
      }
    }
    if (low.includes("gluten") || low.includes("coeliakie")) {
      if (/\b(tarwebloem|tarwe|gerst|rogge|spelt|bulgur|couscous|durum|semolina|bier|sojasaus)\b/i.test(hay)) {
        return {
          ok: false,
          code: "allergy_gluten",
          message:
            "Het plan bevat mogelijk gluten terwijl je coeliakie/gluten hebt aangegeven — controleer of dit veilig is.",
        };
      }
    }
    if (low.includes("schaaldier")) {
      if (/\b(garnaal|kreeft|krab|schaaldier|mossel|oester|inktvis)\b/i.test(hay)) {
        return {
          ok: false,
          code: "allergy_schaaldier",
          message: "Het plan bevat schaaldieren terwijl je dat hebt uitgesloten.",
        };
      }
    }
    if (low.includes("ei")) {
      if (/\b(ei\b|eieren|eiwit|mayonaise|mayo)\b/i.test(hay)) {
        return {
          ok: false,
          code: "allergy_ei",
          message: "Het plan bevat mogelijk ei terwijl je dat hebt uitgesloten.",
        };
      }
    }
    if (low.includes("soja")) {
      if (/\b(soja|tofu|tempeh|edamame|miso)\b/i.test(hay)) {
        return {
          ok: false,
          code: "allergy_soja",
          message: "Het plan bevat soja terwijl je dat hebt uitgesloten.",
        };
      }
    }
    if (low.includes("vis")) {
      if (/\b(zalm|tonijn|makreel|visfilet|vis | haring|sardine|kabeljauw|forel)\b/i.test(hay)) {
        return {
          ok: false,
          code: "allergy_vis",
          message: "Het plan bevat vis terwijl je dat hebt uitgesloten.",
        };
      }
    }
  }
  return { ok: true };
}

function countCarbMoments(meals: WeekPlanMeal[]): number {
  return meals.filter((m) => m.carb_profile !== "none").length;
}

function countEatMoments(day: WeekPlanDay): number {
  const base = 3 + (day.tussendoortjes?.length ?? 0);
  return base;
}

export function validateWeekPlanPayload(
  data: unknown,
  opts: { snacksEnabled: boolean },
): ValidationResult {
  if (!isRecord(data)) {
    return { ok: false, code: "shape", message: "Ongeldig JSON-object." };
  }
  if (data.schema_version !== 1) {
    return { ok: false, code: "version", message: "schema_version moet 1 zijn." };
  }
  if (!Array.isArray(data.days) || data.days.length !== 7) {
    return { ok: false, code: "days", message: "Verwacht precies 7 dagen." };
  }

  const payload = data as unknown as WeekPlanPayload;

  for (const day of payload.days) {
    const snacks = day.tussendoortjes ?? [];
    if (!opts.snacksEnabled && snacks.length > 0) {
      return {
        ok: false,
        code: "snacks",
        message: "Tussendoortjes waren uitgeschakeld maar staan wel in het plan.",
      };
    }
    const em = countEatMoments(day);
    if (em > 4) {
      return {
        ok: false,
        code: "eat_moments",
        message: `Dag ${day.day_index}: meer dan 4 eetmomenten (${em}). Maximaal 4 volgens filosofie.`,
      };
    }
    const allMeals: WeekPlanMeal[] = [
      day.meals.ontbijt,
      day.meals.lunch,
      day.meals.diner,
      ...snacks,
    ];
    const carbN = countCarbMoments(allMeals);
    if (carbN > 2) {
      return {
        ok: false,
        code: "carb_moments",
        message: `Dag ${day.day_index}: meer dan 2 koolhydraatmomenten (${carbN}). Richtlijn: max 2 (zetmeel/granen/pasta/rijst/aardappel; fruit/groente tellen niet mee). ${KOOLHYDRAATMOMENT_UITLEG_VOOR_PROMPT.slice(0, 120)}…`,
      };
    }
  }

  if (!payload.shopping_list?.categories?.length) {
    return {
      ok: false,
      code: "shopping",
      message: "Boodschappenlijst ontbreekt of is leeg.",
    };
  }

  const ais = payload.always_in_stock;
  if (!ais || !Array.isArray(ais.categories) || ais.categories.length === 0) {
    return {
      ok: false,
      code: "pantry",
      message:
        "Lijst «altijd op voorraad» ontbreekt of heeft geen categorieën. Voeg always_in_stock met intro + categories toe.",
    };
  }
  const pantryItems = ais.categories.reduce(
    (n, c) => n + (Array.isArray(c.items) ? c.items.length : 0),
    0,
  );
  if (pantryItems === 0) {
    return {
      ok: false,
      code: "pantry_items",
      message:
        "«Altijd op voorraad» heeft geen items. Voeg concrete voorraad-artikelen toe (oliën, specerijen, basis, diepvries, etc.).",
    };
  }

  return { ok: true };
}
