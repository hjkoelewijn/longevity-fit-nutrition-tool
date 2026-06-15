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

const GLUTEN_REGEX =
  /\b(tarwebloem|tarwe|gerst|rogge|spelt|bulgur|couscous|durum|semolina)\b/i;
const LEGUME_REGEX =
  /\b(linzen|kikkererwt|kikkererwten|bonen|zwarte bonen|kidneybonen|witte bonen|sojaboon|sojabonen|edamame)\b/i;
const GUT_TRIGGER_REGEX = /\b(chili|sambal|jalapeno|gefrituurd|frituur)\b/i;
const FODMAP_HIGH_REGEX =
  /\b(linzen|kikkererwt|kikkererwten|bonen|ui|knoflook|tarwe|rogge|honing|appel|peer|bloemkool)\b/i;
const LACTOSE_REGEX =
  /\b(melk|yoghurt|kwark|room|slagroom|kefir|zachte kaas|mozzarella|mascarpone)\b/i;
const NIGHTSHADE_REGEX =
  /\b(tomaat|paprika|aubergine|aardappel|chili|cayenne)\b/i;
const HISTAMINE_REGEX =
  /\b(oude kaas|gerookte vis|tonijn uit blik|salami|zuurkool|kimchi|azijnrijke marinade|wijn)\b/i;

export function checkDigestiveGuardrails(
  profile: Record<string, unknown>,
  meals: WeekPlanMeal[],
): ValidationResult {
  const gut =
    profile.gut_status && typeof profile.gut_status === "object"
      ? (profile.gut_status as Record<string, unknown>)
      : {};
  const glutenApproach =
    typeof profile.gluten_approach === "string"
      ? profile.gluten_approach.toLowerCase()
      : "";
  const legumeApproach =
    typeof gut.legumes_approach === "string"
      ? gut.legumes_approach.toLowerCase()
      : "";
  const bloating =
    typeof gut.bloating === "string" ? gut.bloating.toLowerCase() : "";
  const gutIssue =
    typeof gut.gut_issue === "string" ? gut.gut_issue.toLowerCase() : "";
  const intolerances = Array.isArray(profile.intolerances)
    ? (profile.intolerances as unknown[])
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.toLowerCase())
    : [];
  const hasFodmapIntolerance = intolerances.some((x) => x.includes("fodmap"));

  const texts = meals.map((m) => collectTextFromMeal(m));
  const glutenMeals = texts.filter((t) => GLUTEN_REGEX.test(t)).length;
  const legumeMeals = texts.filter((t) => LEGUME_REGEX.test(t)).length;
  const gutTriggerMeals = texts.filter((t) => GUT_TRIGGER_REGEX.test(t)).length;
  const fodmapHighMeals = texts.filter((t) => FODMAP_HIGH_REGEX.test(t)).length;
  const lactoseMeals = texts.filter((t) => LACTOSE_REGEX.test(t)).length;
  const nightshadeMeals = texts.filter((t) => NIGHTSHADE_REGEX.test(t)).length;
  const histamineMeals = texts.filter((t) => HISTAMINE_REGEX.test(t)).length;

  if (glutenApproach.includes("vermijd") && glutenMeals > 0) {
    return {
      ok: false,
      code: "digestive_gluten_avoid",
      message:
        "Gluten stond op 'vermijd ik', maar het plan bevat nog glutenbronnen.",
    };
  }
  if (glutenApproach.includes("minimaal") && glutenMeals > 2) {
    return {
      ok: false,
      code: "digestive_gluten_minimal",
      message:
        "Gluten stond op 'eet ik minimaal', maar het plan bevat te veel glutenmomenten (max 2 per week).",
    };
  }
  if (legumeApproach.includes("vermijd") && legumeMeals > 0) {
    return {
      ok: false,
      code: "digestive_legumes_avoid",
      message:
        "Peulvruchten stonden op 'vermijd ik', maar het plan bevat nog peulvruchten.",
    };
  }
  if (
    legumeApproach.includes("opgeblazen") &&
    legumeApproach.includes("winderig") &&
    legumeMeals > 2
  ) {
    return {
      ok: false,
      code: "digestive_legumes_minimal",
      message:
        "Peulvruchten moeten minimaal worden toegepast bij opgeblazen/winderig, maar komen te vaak terug (max 2 per week).",
    };
  }
  if ((bloating === "ja" || gutIssue === "ja") && gutTriggerMeals > 0) {
    return {
      ok: false,
      code: "digestive_mildness",
      message:
        "Bij darmklachten vroeg het profiel om milde bereidingen, maar er staan nog pittige of gefrituurde elementen in het plan.",
    };
  }
  if (hasFodmapIntolerance && fodmapHighMeals > 0) {
    return {
      ok: false,
      code: "digestive_fodmap",
      message:
        "FODMAP-intolerantie staat in het profiel, maar het plan bevat nog hoge-FODMAP triggers (zoals linzen/ui/knoflook/tarwe).",
    };
  }
  if (intolerances.some((x) => x.includes("lactose")) && lactoseMeals > 0) {
    return {
      ok: false,
      code: "digestive_lactose",
      message:
        "Lactose-intolerantie staat in het profiel, maar het plan bevat nog lactose-rijke zuivel.",
    };
  }
  if (
    intolerances.some((x) => x.includes("nachtschade")) &&
    nightshadeMeals > 0
  ) {
    return {
      ok: false,
      code: "digestive_nightshade",
      message:
        "Nachtschade-gevoeligheid staat in het profiel, maar het plan bevat nog nachtschades (zoals tomaat/paprika/aubergine/aardappel).",
    };
  }
  if (intolerances.some((x) => x.includes("histamine")) && histamineMeals > 0) {
    return {
      ok: false,
      code: "digestive_histamine",
      message:
        "Histamine-gevoeligheid staat in het profiel, maar het plan bevat nog histamine-rijke keuzes.",
    };
  }
  if (
    intolerances.some((x) => x.includes("anders")) &&
    (fodmapHighMeals > 0 || gutTriggerMeals > 0)
  ) {
    return {
      ok: false,
      code: "digestive_other_intolerance",
      message:
        "Er is 'Anders' intolerantie aangegeven. Het plan moet extra conservatief zijn en bevat nu nog mogelijke triggers.",
    };
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

  const sl = payload.shopping_list as
    | {
        lunches_breakfast_snacks?: { categories?: unknown[] };
        dinners?: { categories?: unknown[] };
        categories?: unknown[];
      }
    | undefined;
  const lunchesCount = Array.isArray(sl?.lunches_breakfast_snacks?.categories)
    ? (sl!.lunches_breakfast_snacks!.categories as unknown[]).length
    : 0;
  const dinnersCount = Array.isArray(sl?.dinners?.categories)
    ? (sl!.dinners!.categories as unknown[]).length
    : 0;
  const legacyCount = Array.isArray(sl?.categories)
    ? (sl!.categories as unknown[]).length
    : 0;
  if (lunchesCount + dinnersCount + legacyCount === 0) {
    return {
      ok: false,
      soft: true,
      code: "shopping",
      message:
        "Boodschappenlijst ontbreekt of is leeg. Lever shopping_list.lunches_breakfast_snacks en shopping_list.dinners aan.",
    };
  }
  if (legacyCount > 0 && lunchesCount === 0 && dinnersCount === 0) {
    return {
      ok: false,
      soft: true,
      code: "shopping_split",
      message:
        "Boodschappenlijst moet gesplitst worden in shopping_list.lunches_breakfast_snacks en shopping_list.dinners (niet één platte lijst onder shopping_list.categories).",
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
