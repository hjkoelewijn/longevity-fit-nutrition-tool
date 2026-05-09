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

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function pieceLabel(value: number): string {
  if (value <= 0.5) return "1/2 stuk";
  if (Number.isInteger(value)) return `${value} ${value === 1 ? "stuk" : "stuks"}`;
  const whole = Math.floor(value);
  const remainder = value - whole;
  if (remainder === 0.5) {
    return whole <= 0 ? "1/2 stuk" : `${whole} 1/2 stuks`;
  }
  return `${value} stuks`;
}

function inferFruitPieces(name: string, meal: WeekPlanMeal): string {
  const ctx = `${meal.title} ${meal.slot}`.toLowerCase();
  const servings = Math.max(1, Number(meal.servings ?? 1));
  const isSmoothieLike = /(smoothie|shake|bowl|havermout|pap|ontbijt)/.test(ctx);
  const isToppingLike = /(salade|topping|garnering|bijgerecht)/.test(ctx);
  const isCitrusOrAvocado = /(citroen|limoen|avocado)/.test(name);

  let pieces = isCitrusOrAvocado ? servings * 0.5 : servings * 0.75;
  if (isSmoothieLike) pieces = servings * 1;
  if (isToppingLike) pieces = servings * 0.5;

  return pieceLabel(roundToHalf(Math.max(0.5, pieces)));
}

function inferAmountFromName(name: string, meal: WeekPlanMeal): string {
  const n = name.toLowerCase();
  const slot = meal.slot;
  const servings = Math.max(1, Number(meal.servings ?? 1));
  const slotFactor = slot === "diner" ? 1.2 : slot === "lunch" ? 1 : slot === "ontbijt" ? 0.9 : 0.7;
  const baseFactor = Math.max(0.6, slotFactor * servings);
  const grams = (value: number) => `${Math.max(5, Math.round(value * baseFactor))} g`;

  if (/(citroen|limoen|avocado)/.test(n)) return inferFruitPieces(n, meal);
  if (/(knoflook)/.test(n)) return "1 teen";
  if (/(gember)/.test(n)) return "1 tl";
  if (/(ui|rode ui|sjalot)/.test(n)) return "1 stuk";
  if (/(appel|peer|banaan|sinaasappel|mandarijn|kiwi|perzik|nectarine|mango)/.test(n))
    return inferFruitPieces(n, meal);
  if (/(aardbei|blauwe bes|framboos|bramen|druiven)/.test(n)) return grams(80);

  if (/(walnoot|amandel|cashew|pecan|hazelnoot|pistache|notenmix)/.test(n)) return grams(20);
  if (/(pompoenpit|zonnebloempit|chia|lijnzaad|sesamzaad|hennepzaad)/.test(n)) return grams(12);

  if (/(griekse yoghurt|yoghurt|kwark|skyr)/.test(n)) {
    return slot === "ontbijt" || slot === "tussendoortje" ? grams(220) : grams(150);
  }
  if (/(melk|kefir|kokosmelk)/.test(n)) {
    return `${Math.max(100, Math.round(180 * baseFactor))} ml`;
  }

  if (/(kip|zalm|vis|gehakt|tofu|tempeh|biefstuk)/.test(n)) return grams(140);
  if (/(ei|eieren)/.test(n)) {
    const eggs = Math.max(1, Math.round(servings * (slot === "ontbijt" ? 2 : 1.5)));
    return `${eggs} ${eggs === 1 ? "stuk" : "stuks"}`;
  }
  if (/(bonen|linzen|kikkererwten)/.test(n)) return grams(120);

  if (/(havermout|muesli|granola)/.test(n)) return grams(50);
  if (/(rijst|quinoa|couscous|pasta)/.test(n)) return grams(slot === "diner" ? 75 : 60);
  if (/(aardappel|zoete aardappel)/.test(n)) return grams(180);

  if (/(rucola|sla|spinazie|boerenkool|andijvie|paksoi)/.test(n)) return grams(70);
  if (/(courgette|paprika|broccoli|wortel|komkommer|tomaat|bloemkool)/.test(n)) return grams(120);

  if (/(feta|geitenkaas|parmezaan|mozzarella|kaas)/.test(n)) return grams(30);
  if (/(zout|peper|kaneel|komijn|kurkuma|paprika|oregano|tijm|kruiden|specerij)/.test(n)) return "1 tl";
  if (/(olie|olijfolie|azijn|sojasaus|tamari|honing|mosterd|citroensap|limoensap)/.test(n)) return "1 el";
  return grams(80);
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

    const prompt = `
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
- Geen markdown, geen extra tekst.

Profielcontext:
${JSON.stringify(profile ?? {})}

Maaltijd (bron):
${JSON.stringify(meal)}
    `.trim();

    const message = await anthropic.messages.create({
      model,
      temperature: 0,
      max_tokens: qualityMode ? 4096 : 2048,
      messages: [{ role: "user", content: prompt }],
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

    const nextIngredients = Array.isArray(parsed.ingredients)
      ? parsed.ingredients
          .map((ing) => ({
            name: String(ing?.name ?? "").trim(),
            amount: String(ing?.amount ?? "").trim(),
            note: typeof ing?.note === "string" ? ing.note.trim() : null,
          }))
          .map((ing) => {
            const amountRaw = ing.amount;
            if (!amountRaw || amountRaw.toLowerCase() === "naar smaak") {
              return { ...ing, amount: inferAmountFromName(ing.name, meal) };
            }
            if (/^\d+([.,]\d+)?$/.test(amountRaw)) {
              return { ...ing, amount: `${amountRaw} g` };
            }
            return ing;
          })
          .filter((ing) => ing.name)
      : [];
    const nextSteps = Array.isArray(parsed.steps)
      ? parsed.steps.map((s) => String(s ?? "").trim()).filter(Boolean)
      : [];

    if (nextIngredients.length < 3 || nextSteps.length < 2) {
      return NextResponse.json(
        { error: "Receptdetails konden niet betrouwbaar worden aangevuld." },
        { status: 422 },
      );
    }

    meal.ingredients = nextIngredients;
    meal.steps = nextSteps;
    if (typeof parsed.kid_tip === "string" && parsed.kid_tip.trim()) {
      meal.kid_tip = parsed.kid_tip.trim();
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

