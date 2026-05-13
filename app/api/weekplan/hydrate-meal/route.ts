import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { parseJsonFromClaudeText } from "@/lib/weekplan/parse-ai-json";
import {
  ONE_PORTION_AMOUNT_GUIDELINES_PROMPT,
  PORTION_PLAUSIBILITY_RETRY_HINT,
  onePortionProteinAmountsPlausible,
} from "@/lib/weekplan/portion-amount-guidelines";
import type { WeekPlanMeal, WeekPlanPayload } from "@/lib/weekplan/types";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 180;

type Body = {
  meal_plan_id?: string;
  meal_id?: string;
  quality_mode?: boolean;
  force?: boolean;
  polish_only?: boolean;
};

function findMealRef(payload: WeekPlanPayload, mealId: string): WeekPlanMeal | null {
  for (const day of payload.days) {
    const slots: WeekPlanMeal[] = [
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

function hasDetails(meal: WeekPlanMeal): boolean {
  if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) return false;
  if (!Array.isArray(meal.steps) || meal.steps.length === 0) return false;
  return meal.ingredients.every((ing) => hasValidUnit(String(ing?.amount ?? "")));
}

function normalizeAmountText(amount: string): string {
  return amount.trim();
}

function hasValidUnit(amount: string): boolean {
  const raw = amount.trim().toLowerCase();
  if (!raw) return false;
  if (raw === "naar smaak") return true;
  // Kale getallen (geen eenheid) zijn niet acceptabel — die werden vroeger
  // automatisch als "g" geïnterpreteerd; nu eisen we een expliciete eenheid.
  if (/^\d+([.,]\d+)?$/.test(raw)) return false;
  return /(g|gram|kg|ml|l|tl|theelepel|el|eetlepel|stuk|stuks|teen|snufje|bol|plak|bos|scheut)/.test(
    raw,
  );
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUnitToken(unitRaw: string): string {
  const unit = unitRaw.toLowerCase();
  if (unit === "gram") return "g";
  if (unit.startsWith("theelepel")) return "tl";
  if (unit.startsWith("eetlepel")) return "el";
  return unit;
}

function extractAmountFromSteps(ingredientName: string, steps: string[]): string {
  const name = ingredientName.trim();
  if (!name || !Array.isArray(steps) || steps.length === 0) return "";
  const namePattern = new RegExp(escapeRegex(name), "i");
  const amountPattern =
    /(\d+(?:[.,]\d+)?)\s*(g|gram|kg|ml|l|tl|theelepel(?:s)?|el|eetlepel(?:s)?|stuk|stuks|teen|snufje)/i;

  for (const step of steps) {
    if (!namePattern.test(step)) continue;
    const amountMatch = step.match(amountPattern);
    if (!amountMatch) continue;
    const value = amountMatch[1];
    const unit = normalizeUnitToken(amountMatch[2]);
    return `${value} ${unit}`;
  }

  const keywords = ingredientKeywords(name);
  const blob = steps.join("\n");
  for (const kw of keywords) {
    const low = blob.toLowerCase();
    let idx = 0;
    while (idx !== -1) {
      idx = low.indexOf(kw, idx);
      if (idx === -1) break;
      const window = blob.slice(Math.max(0, idx - 110), idx + 110);
      const amountMatch = window.match(amountPattern);
      if (amountMatch) {
        return `${amountMatch[1]} ${normalizeUnitToken(amountMatch[2])}`;
      }
      idx += kw.length;
    }
  }

  return "";
}

const INGREDIENT_KEYWORD_STOP = new Set([
  "met",
  "en",
  "van",
  "voor",
  "de",
  "het",
  "een",
  "hetzelfde",
  "verse",
  "vers",
  "gekookt",
  "gekookte",
  "gegrild",
  "gegrilde",
  "biologisch",
  "extra",
  "zwarte",
  "witte",
  "bot",
  "restje",
  "restjes",
]);

function ingredientKeywords(name: string): string[] {
  const parts = name
    .toLowerCase()
    .split(/[\s,–—\-]+/)
    .map((w) => w.replace(/[()]/g, "").trim())
    .filter((w) => w.length >= 3 && !INGREDIENT_KEYWORD_STOP.has(w));
  const uniq = [...new Set(parts)];
  uniq.sort((a, b) => b.length - a.length);
  return uniq.slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY ontbreekt op de server." }, { status: 500 });
    }

    const body = (await request.json()) as Body;
    const mealPlanId = body.meal_plan_id?.trim();
    const mealId = body.meal_id?.trim();
    const qualityMode = Boolean(body.quality_mode);
    const force = Boolean(body.force);
    const polishOnly = Boolean(body.polish_only);
    if (!mealPlanId || !mealId) {
      return NextResponse.json({ error: "meal_plan_id of meal_id ontbreekt." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    }

    const { data: row, error: rowErr } = await supabase
      .from("meal_plans")
      .select("id, user_id, payload")
      .eq("id", mealPlanId)
      .maybeSingle();
    if (rowErr || !row || row.user_id !== user.id) {
      return NextResponse.json({ error: "Weekplan niet gevonden." }, { status: 404 });
    }

    const payload = row.payload as unknown as WeekPlanPayload;
    const meal = findMealRef(payload, mealId);
    if (!meal) {
      return NextResponse.json({ error: "Maaltijd niet gevonden." }, { status: 404 });
    }

    if (!force && hasDetails(meal)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

    const model = qualityMode
      ? (process.env.ANTHROPIC_MODEL_QUALITY ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6")
      : (process.env.ANTHROPIC_MODEL_FAST ?? process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022");

    const anthropic = new Anthropic({
      apiKey,
      timeout: qualityMode ? 180_000 : 90_000,
      maxRetries: 2,
    });

    const prompt = polishOnly
      ? `
Polish dit bestaande recept. Laat ingrediënten en hoeveelheden exact ongewijzigd.
Geef EXACT één JSON-object terug in dit schema:
{
  "steps": ["", "", ""],
  "kid_tip": ""
}

Regels:
- Nederlands.
- Verfijn alleen de bereidingsstappen en optioneel kid_tip.
- 3-7 korte, duidelijke stappen.
- Gebruik dezelfde ingrediënten en hoeveelheden als de bron (geen nieuwe ingrediënten of wijzigingen).
- Geen markdown, geen extra tekst.

Profielcontext:
${JSON.stringify(profile ?? {})}

Maaltijd (bron):
${JSON.stringify(meal)}
      `.trim()
      : `
Maak dit ene recept compleet en praktisch.
Geef EXACT één JSON-object terug in dit schema:
{
  "ingredients": [{"name":"", "amount":"", "note":""}],
  "steps": ["", "", ""],
  "kid_tip": ""
}

Regels:
- Nederlands.
- 6-14 ingrediënten, met concrete hoeveelheden.
- **Elk ingrediënt MOET een hoeveelheid + expliciete keuken-eenheid hebben.** Een kaal getal zonder eenheid (bijv. "amount":"2") is FOUT en wordt afgekeurd. Schrijf altijd de eenheid uit.
- **Kies de juiste eenheid per ingrediënt** — niet alles is gram:
  • knoflook → "teen" (bijv. "1 teen")
  • citroen / limoen / sinaasappel → "stuk" (of "1/2 stuk" voor halve)
  • ui / sjalot / paprika / wortel / courgette / ei / appel → "stuk"
  • olijfolie / boter / azijn / sojasaus / honing / tomatenpuree / mosterd / yoghurt-dressing → "el" of "tl"
  • kruiden (peper, zout, paprikapoeder, kaneel, kerrie, tijm, oregano) → "tl" of "snufje"
  • bouillon / melk / room / water / sap → "ml"
  • rijst / pasta / havermout / linzen / kipfilet / vis / vlees / groente per gewicht → "g"
  • bos peterselie / koriander → "bos" of "el (gehakt)"
- 3-7 korte bereidingsstappen.
- Houd rekening met profielcontext en maaltijdslot.
- Ingrediëntenlijst en bereidingsstappen moeten qua hoeveelheden consistent zijn.
- Alle hoeveelheden zijn voor **1 portie** (gebruikers schalen in de app); geen gezinshoeveelheden in dit recept.
${ONE_PORTION_AMOUNT_GUIDELINES_PROMPT}
- **kid_tip** is bedoeld voor het gezin van een 40+ vrouw, vaak met **tieners (≈ 12–18 jaar)** — niet voor peuters/kleuters. Géén babytaal, géén "leg apart als knapperige snack", géén smiley-vormen, géén beschermend toontje. Kies hooguit één van deze richtingen, en alleen als hij echt past:
  • vullende variant voor groei/sport (handje noten, extra ei, grotere portie koolhydraatbron);
  • simpele swap voor een ingrediënt dat tieners minder snel lusten (bv. spinazie → ijsbergsla, blauwe kaas → mozzarella, vis → kip);
  • pittigheid/bitterheid temperen (citroen los erbij, mildere mosterd, minder paprikapoeder) zonder dat het slap wordt;
  • 'help-mee'-aanwijzing waarmee de tiener een deel van het werk zelf doet;
  • portieschaaltip voor een hongerige tiener.
  Past geen enkele tip natuurlijk? Zet kid_tip op null. **Niet forceren.**
- Geen markdown, geen extra tekst.

Profielcontext:
${JSON.stringify(profile ?? {})}

Maaltijd (bron):
${JSON.stringify(meal)}
      `.trim();
    let nextIngredients: Array<{ name: string; amount: string; note: string | null }> = [];
    let nextSteps: string[] = [];
    let nextKidTip: string | null = null;
    let success = false;
    let lastFailedPlausibility = false;

    for (let attempt = 0; attempt < 2; attempt++) {
      const promptWithRetry =
        attempt === 0
          ? prompt
          : polishOnly
            ? `${prompt}\n\nJe vorige output was niet valide. Genereer opnieuw met alleen stappen en optionele kid_tip.`
            : `${prompt}\n\n---\n${
                lastFailedPlausibility
                  ? `${PORTION_PLAUSIBILITY_RETRY_HINT}\n`
                  : ""
              }Je vorige output miste expliciete keuken-eenheden of had een kaal getal zonder eenheid — of de hoeveelheden klopten niet voor exact **1 portie**. Genereer opnieuw met de juiste eenheid per ingrediënt: knoflook in "teen", citroen/ui/ei/paprika in "stuk", olijfolie/boter/azijn in "el" of "tl", kruiden in "tl"/"snufje", bouillon/melk in "ml", rijst/pasta/vlees/vis/groente in "g". Geen kale getallen.`;

      const message = await anthropic.messages.create({
        model,
        temperature: 0,
        max_tokens: qualityMode ? 4096 : 2048,
        messages: [{ role: "user", content: promptWithRetry }],
      });

      const text = message.content
        .map((c) =>
          c && typeof c === "object" && "type" in c && c.type === "text" && "text" in c
            ? String((c as { text: unknown }).text ?? "")
            : "",
        )
        .join("\n")
        .trim();
      const parsed = parseJsonFromClaudeText(text) as {
        ingredients?: Array<{ name?: unknown; amount?: unknown; note?: unknown }>;
        steps?: unknown[];
        kid_tip?: unknown;
      };

      let ingredientsCandidate = polishOnly
        ? (Array.isArray(meal.ingredients)
            ? meal.ingredients.map((ing) => ({
                name: String(ing?.name ?? "").trim(),
                amount: normalizeAmountText(String(ing?.amount ?? "")),
                note: typeof ing?.note === "string" ? ing.note.trim() : null,
              }))
            : [])
        : (Array.isArray(parsed.ingredients)
            ? parsed.ingredients
                .map((ing) => ({
                  name: String(ing?.name ?? "").trim(),
                  amount: normalizeAmountText(String(ing?.amount ?? "")),
                  note: typeof ing?.note === "string" ? ing.note.trim() : null,
                }))
                .filter((ing) => ing.name.length > 0)
            : []);
      const stepsCandidate = Array.isArray(parsed.steps)
        ? parsed.steps.map((s) => String(s ?? "").trim()).filter(Boolean)
        : [];

      // If model forgets amounts for some ingredients, recover from step text before rejecting.
      ingredientsCandidate = ingredientsCandidate.map((ing) => {
        if (hasValidUnit(ing.amount)) return ing;
        const fromSteps = extractAmountFromSteps(ing.name, stepsCandidate);
        if (fromSteps) return { ...ing, amount: fromSteps };
        return ing;
      });

      const unitsOk = ingredientsCandidate.every((ing) => hasValidUnit(ing.amount));
      const plausible = onePortionProteinAmountsPlausible({
        ...meal,
        ingredients: ingredientsCandidate,
        steps: stepsCandidate,
      });
      if (
        ingredientsCandidate.length >= 3 &&
        stepsCandidate.length >= 2 &&
        unitsOk &&
        plausible
      ) {
        nextIngredients = ingredientsCandidate;
        nextSteps = stepsCandidate;
        nextKidTip = typeof parsed.kid_tip === "string" && parsed.kid_tip.trim()
          ? parsed.kid_tip.trim()
          : null;
        success = true;
        break;
      }
      if (unitsOk && !plausible) {
        lastFailedPlausibility = true;
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: "Receptdetails konden niet betrouwbaar worden aangevuld." },
        { status: 422 },
      );
    }

    meal.ingredients = nextIngredients;
    meal.steps = nextSteps;
    if (nextKidTip) {
      meal.kid_tip = nextKidTip;
    }

    const { error: upErr } = await supabase
      .from("meal_plans")
      .update({ payload: payload as unknown as Record<string, unknown> })
      .eq("id", mealPlanId);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, quality_mode: qualityMode });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message || "Onbekende fout" }, { status: 500 });
  }
}

