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

function inferAmountFromName(name: string): string {
  const n = name.toLowerCase();
  if (/(zout|peper|kaneel|komijn|kurkuma|paprika|oregano|tijm|kruiden|specerij)/.test(n)) return "1 tl";
  if (/(olie|olijfolie|azijn|sojasaus|tamari|honing|mosterd|citroensap|limoensap)/.test(n)) return "1 el";
  if (/(kip|zalm|vis|gehakt|tofu|tempeh|biefstuk|ei|eieren|bonen|linzen|kikkererwten)/.test(n)) return "150 g";
  if (/(rucola|sla|spinazie|boerenkool|andijvie|paksoi|groente|courgette|paprika|broccoli|wortel|ui)/.test(n)) return "100 g";
  if (/(rijst|quinoa|havermout|pasta|aardappel|zoete aardappel)/.test(n)) return "75 g";
  if (/(yoghurt|kwark|melk|kefir)/.test(n)) return "200 ml";
  return "100 g";
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
              return { ...ing, amount: inferAmountFromName(ing.name) };
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

