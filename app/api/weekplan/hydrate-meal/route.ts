import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { parseJsonFromClaudeText } from "@/lib/weekplan/parse-ai-json";
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
  return Array.isArray(meal.ingredients) && meal.ingredients.length > 0 && Array.isArray(meal.steps) && meal.steps.length > 0;
}

function normalizeAmountText(amount: string): string {
  const raw = amount.trim();
  if (!raw) return "";
  if (/^\d+([.,]\d+)?$/.test(raw)) return `${raw} g`;
  return raw;
}

function hasValidUnit(amount: string): boolean {
  const raw = amount.trim().toLowerCase();
  if (!raw) return false;
  return /(g|gram|kg|ml|l|tl|theelepel|el|eetlepel|stuk|stuks|teen|snufje)/.test(raw);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const unit = amountMatch[2].toLowerCase();
    const normalizedUnit =
      unit === "gram"
        ? "g"
        : unit.startsWith("theelepel")
          ? "tl"
          : unit.startsWith("eetlepel")
            ? "el"
            : unit;
    return `${value} ${normalizedUnit}`;
  }

  return "";
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
- Elk ingrediënt MOET een hoeveelheid + eenheid hebben (bijv. "150 g", "2 stuks", "1 el", "200 ml", "1 tl").
- 3-7 korte bereidingsstappen.
- Houd rekening met profielcontext en maaltijdslot.
- Ingrediëntenlijst en bereidingsstappen moeten qua hoeveelheden consistent zijn.
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

    for (let attempt = 0; attempt < 2; attempt++) {
      const promptWithRetry =
        attempt === 0
          ? prompt
          : polishOnly
            ? `${prompt}\n\nJe vorige output was niet valide. Genereer opnieuw met alleen stappen en optionele kid_tip.`
            : `${prompt}\n\nJe vorige output miste valide eenheden of was inconsistent met de stappen. Genereer opnieuw met duidelijke keuken-eenheden per ingrediënt.`;

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
      if (ingredientsCandidate.length >= 3 && stepsCandidate.length >= 2 && unitsOk) {
        nextIngredients = ingredientsCandidate;
        nextSteps = stepsCandidate;
        nextKidTip = typeof parsed.kid_tip === "string" && parsed.kid_tip.trim()
          ? parsed.kid_tip.trim()
          : null;
        success = true;
        break;
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

