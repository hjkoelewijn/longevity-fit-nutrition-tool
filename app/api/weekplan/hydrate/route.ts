import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { loadLongevitySystemPrompt } from "@/lib/weekplan/load-system-prompt";
import { parseJsonFromClaudeText } from "@/lib/weekplan/parse-ai-json";
import type { WeekPlanPayload } from "@/lib/weekplan/types";
import { validateWeekPlanPayload } from "@/lib/weekplan/validate-ai-output";
import { buildShoppingListInsertPayload } from "@/lib/weekplan/shopping-storage";
import { servingsFromProfile } from "@/lib/weekplan/household-servings";

export const maxDuration = 540;

type Body = { meal_plan_id?: string };

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY ontbreekt op de server." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as Body;
    const mealPlanId = body.meal_plan_id?.trim();
    if (!mealPlanId) {
      return NextResponse.json({ error: "meal_plan_id ontbreekt." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    }

    const { data: row, error: rowErr } = await supabase
      .from("meal_plans")
      .select("id, user_id, snacks_enabled, payload, user_meta")
      .eq("id", mealPlanId)
      .maybeSingle();
    if (rowErr || !row || row.user_id !== user.id) {
      return NextResponse.json({ error: "Weekplan niet gevonden." }, { status: 404 });
    }

    const currentMeta = (row.user_meta ?? {}) as Record<string, unknown>;
    const payload = row.payload as unknown as WeekPlanPayload;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const targetDinnerServings = servingsFromProfile(
      (profile ?? {}) as unknown as Record<string, unknown>,
    );

    const system = await loadLongevitySystemPrompt();
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
    const anthropic = new Anthropic({
      apiKey,
      timeout: 600_000,
      maxRetries: 3,
    });

    const prompt = `
Werk dit bestaande weekplan uit naar detailniveau voor recepten.
Geef EXACT één JSON-object terug met hetzelfde schema als input.

Belangrijk:
- Behoud dagstructuur, meal ids, datums, slots en carb-profielen.
- Breid per maaltijd ingrediënten uit naar bruikbare hoeveelheden.
- Breid bereiding uit naar 3-6 duidelijke stappen per maaltijd.
- Behoud shopping_list en always_in_stock, maar verbeter waar nodig op consistentie.
- Porties: zet diner op servings = ${targetDinnerServings} (1 volwassene = 1 portie, 1 kind = 1 portie) en zet ontbijt/lunch/tussendoortjes op servings = 1 per persoon. Pas ingrediënt-hoeveelheden proportioneel aan als het oude plan een ander aantal porties had.
- Geen markdown, geen extra tekst.

Actueel profiel (JSON) voor context:
${JSON.stringify(profile ?? {})}

Bestaande payload:
${JSON.stringify(payload)}
`.trim();

    const msg = await anthropic.messages.create({
      model,
      temperature: 0,
      max_tokens: 16384,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content
      .map((c) =>
        c && typeof c === "object" && "type" in c && c.type === "text" && "text" in c
          ? String((c as { text: unknown }).text ?? "")
          : "",
      )
      .join("\n")
      .trim();
    const parsed = parseJsonFromClaudeText(text);
    const shape = validateWeekPlanPayload(parsed, {
      snacksEnabled: Boolean(row.snacks_enabled),
    });
    if (!shape.ok) {
      await supabase
        .from("meal_plans")
        .update({
          user_meta: {
            ...currentMeta,
            hydrationStatus: "failed",
            hydrationError: shape.message,
          },
        })
        .eq("id", mealPlanId);
      return NextResponse.json(
        { error: shape.message, code: shape.code, retry: true },
        { status: 422 },
      );
    }

    const nextPayload = parsed as WeekPlanPayload;
    for (const day of nextPayload.days) {
      day.meals.ontbijt.servings = 1;
      day.meals.lunch.servings = 1;
      day.meals.diner.servings = targetDinnerServings;
      for (const snack of day.tussendoortjes ?? []) {
        snack.servings = 1;
      }
    }
    const shoppingPayload = buildShoppingListInsertPayload(nextPayload);

    const { error: planUpErr } = await supabase
      .from("meal_plans")
      .update({
        payload: nextPayload as unknown as Record<string, unknown>,
        user_meta: {
          ...currentMeta,
          hydrationStatus: "ready",
          hydrationError: null,
        },
      })
      .eq("id", mealPlanId);
    if (planUpErr) {
      return NextResponse.json({ error: planUpErr.message }, { status: 500 });
    }

    const { data: shop } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("meal_plan_id", mealPlanId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (shop?.id) {
      await supabase
        .from("shopping_lists")
        .update({ payload: shoppingPayload as unknown as Record<string, unknown> })
        .eq("id", shop.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: raw || "Onbekende fout" }, { status: 500 });
  }
}
