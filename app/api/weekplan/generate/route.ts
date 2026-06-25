import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildWeekPlanUserPrompt, seasonNlFromMonth } from "@/lib/weekplan/build-user-prompt";
import { loadLongevitySystemPrompt } from "@/lib/weekplan/load-system-prompt";
import { parseJsonFromClaudeText } from "@/lib/weekplan/parse-ai-json";
import type { WeekPlanPayload } from "@/lib/weekplan/types";
import {
  collectAllMeals,
  pantryStaplesAsPseudoMeals,
  uniqueDinnerTitles,
  uniqueOntbijtTitles,
  uniqueLunchTitles,
} from "@/lib/weekplan/meals-helpers";
import { buildShoppingListInsertPayload } from "@/lib/weekplan/shopping-storage";
import {
  checkAllergiesInMeals,
  checkDigestiveGuardrails,
  validateWeekPlanPayload,
} from "@/lib/weekplan/validate-ai-output";

/** Vercel/server: ruimere max uitvoeringstijd i.v.m. lange JSON + retry/repair. */
export const maxDuration = 300;

type Body = {
  week_start_iso?: string;
  cook_sessions_per_week?: 3 | 5 | 7;
  snacks_enabled?: boolean;
  quality_mode?: boolean;
};

function nextMondayIso(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (8 - day) % 7 || 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

function isTransientNetworkError(error: unknown): boolean {
  const raw = error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && "cause" in error && error.cause instanceof Error
      ? error.cause.message
      : "";
  const net = `${raw} ${cause}`.toLowerCase();
  return net.includes("etimedout") || net.includes("econnreset");
}

function isOverloadedError(error: unknown): boolean {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.includes("overloaded_error") || raw.includes("529") || raw.includes("Overloaded");
}

/**
 * Als shopping_list ontbreekt of leeg is, vul dan een minimale placeholder in.
 * In draftMode zijn ingrediënten altijd [], dus extraheren heeft geen zin.
 * De hydratatiestap bouwt later de echte boodschappenlijst vanuit de recepten.
 */
function ensureShoppingListFallback(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const obj = data as Record<string, unknown>;
  const sl = obj.shopping_list as Record<string, unknown> | undefined;

  const hasLunches =
    sl?.lunches_breakfast_snacks &&
    typeof sl.lunches_breakfast_snacks === "object" &&
    Array.isArray((sl.lunches_breakfast_snacks as { categories?: unknown[] }).categories) &&
    ((sl.lunches_breakfast_snacks as { categories: unknown[] }).categories).length > 0;
  const hasDinners =
    sl?.dinners &&
    typeof sl.dinners === "object" &&
    Array.isArray((sl.dinners as { categories?: unknown[] }).categories) &&
    ((sl.dinners as { categories: unknown[] }).categories).length > 0;

  if (hasLunches && hasDinners) return data;

  const placeholderItem = {
    id: "placeholder",
    name: "Wordt aangevuld na recepten genereren",
    quantity: "",
  };

  obj.shopping_list = {
    ...(sl ?? {}),
    lunches_breakfast_snacks: hasLunches
      ? sl!.lunches_breakfast_snacks
      : { categories: [{ id: "ontbijt-lunch", label: "Ontbijt & lunch", items: [placeholderItem] }] },
    dinners: hasDinners
      ? sl!.dinners
      : { categories: [{ id: "diner", label: "Diner", items: [placeholderItem] }] },
  };
  return obj;
}

function ensureAlwaysInStockFallback(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const obj = data as Record<string, unknown>;
  const ais = obj.always_in_stock;
  const hasCategories =
    ais &&
    typeof ais === "object" &&
    Array.isArray((ais as { categories?: unknown[] }).categories) &&
    (ais as { categories?: unknown[] }).categories!.length > 0;
  if (hasCategories) return data;

  // Alleen allergeenvrije universele items — geen vis, peulvruchten, zuivel of nachtschade,
  // zodat profielen met vis-allergie, FODMAP-intolerantie of nachtschade-gevoeligheid
  // niet geblokkeerd worden door de fallback-pantry.
  obj.always_in_stock = {
    intro:
      "Basisvoorraad voor drukke dagen: eenmalige investering zodat je snel voedzame maaltijden kunt maken.",
    categories: [
      {
        id: "olien-vetten",
        label: "Oliën & vetten",
        items: [
          { id: "extra-vierge-olijfolie", name: "Extra vierge olijfolie", quantity: "1 fles" },
          { id: "kokosolie", name: "Kokosolie", quantity: "1 pot" },
        ],
      },
      {
        id: "kruiden-basis",
        label: "Kruiden & smaakmakers",
        items: [
          { id: "zeezout", name: "Zeezout", quantity: "1 verpakking" },
          { id: "zwarte-peper", name: "Zwarte peper", quantity: "1 molen" },
          { id: "kurkuma", name: "Kurkuma", quantity: "1 potje" },
          { id: "komijn", name: "Komijn (gemalen)", quantity: "1 potje" },
        ],
      },
      {
        id: "voorraadkast",
        label: "Voorraadkast",
        items: [
          { id: "olijven-blik", name: "Olijven (blik/pot)", quantity: "1 pot" },
          { id: "tahini", name: "Tahin (sesampasta)", quantity: "1 pot" },
          { id: "rijst-quinoa", name: "Rijst of quinoa", quantity: "500 g" },
        ],
      },
      {
        id: "diepvries",
        label: "Diepvries basis",
        items: [
          { id: "diepvries-groenten", name: "Diepvriesgroenten", quantity: "2 zakken" },
          { id: "diepvries-spinazie", name: "Diepvries spinazie", quantity: "1 zak" },
        ],
      },
    ],
  };
  return obj;
}

export async function POST(request: Request) {
  const t0 = Date.now();
  try {
    console.log("[weekplan/generate] start");
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY ontbreekt op de server." },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const cook =
      body.cook_sessions_per_week === 3 ||
      body.cook_sessions_per_week === 5 ||
      body.cook_sessions_per_week === 7
        ? body.cook_sessions_per_week
        : 5;
    const snacks = Boolean(body.snacks_enabled);
    const weekStart = body.week_start_iso?.trim() || nextMondayIso();

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr || !profile) {
      return NextResponse.json(
        { error: pErr?.message ?? "Profiel niet gevonden." },
        { status: 400 },
      );
    }

    const { data: bt } = await supabase
      .from("balance_tests")
      .select(
        "test_date,omega_3_total,omega_6_total,omega_ratio,aa_epa_ratio",
      )
      .eq("user_id", user.id)
      .order("test_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: prevPlan } = await supabase
      .from("meal_plans")
      .select("payload, week_start")
      .eq("user_id", user.id)
      .neq("week_start", weekStart)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const servings = 1;
    const previousWeekDinnerTitles =
      prevPlan?.payload && typeof prevPlan.payload === "object"
        ? uniqueDinnerTitles(prevPlan.payload as unknown as WeekPlanPayload).slice(0, 20)
        : [];
    const previousWeekOntbijtTitles =
      prevPlan?.payload && typeof prevPlan.payload === "object"
        ? uniqueOntbijtTitles(prevPlan.payload as unknown as WeekPlanPayload).slice(0, 14)
        : [];
    const previousWeekLunchTitles =
      prevPlan?.payload && typeof prevPlan.payload === "object"
        ? uniqueLunchTitles(prevPlan.payload as unknown as WeekPlanPayload).slice(0, 14)
        : [];
    const repeatPolicy =
      cook === 3
        ? { maxRepeatsFromPreviousWeek: 3, minNewMeals: 12 }
        : cook === 5
          ? { maxRepeatsFromPreviousWeek: 4, minNewMeals: 14 }
          : { maxRepeatsFromPreviousWeek: 6, minNewMeals: 16 };

    const startDate = new Date(weekStart + "T12:00:00");
    const seasonNl = seasonNlFromMonth(startDate.getMonth());

    const system = await loadLongevitySystemPrompt();
    const userPrompt = buildWeekPlanUserPrompt({
      profile: profile as unknown as Record<string, unknown>,
      balanceTest: bt
        ? (bt as unknown as Record<string, unknown>)
        : null,
      weekStartIso: weekStart,
      cookSessionsPerWeek: cook,
      snacksEnabled: snacks,
      seasonNl,
      servings,
      draftMode: true,
      previousWeekDinnerTitles,
      previousWeekOntbijtTitles,
      previousWeekLunchTitles,
      repeatPolicy,
    });

    const qualityMode = Boolean(body.quality_mode);
    const defaultFastModel = "claude-3-5-haiku-20241022";
    const defaultQualityModel = "claude-sonnet-4-6";
    const model = qualityMode
      ? (process.env.ANTHROPIC_MODEL_QUALITY ??
        process.env.ANTHROPIC_MODEL ??
        defaultQualityModel)
      : (process.env.ANTHROPIC_MODEL_FAST ??
        process.env.ANTHROPIC_MODEL ??
        defaultFastModel);

    console.log("[weekplan/generate] calling Anthropic (tool-json)", { model });
    const anthropic = new Anthropic({
      apiKey,
      timeout: 600_000,
      maxRetries: 3,
    });

    const TOOL_NAME = "submit_weekplan_json";
    const INPUT_SCHEMA = {
      type: "object",
      required: ["schema_version", "week_start_iso", "days", "shopping_list", "always_in_stock"],
      properties: {
        schema_version: { type: "number" },
        week_start_iso: { type: "string" },
        days: { type: "array" },
        shopping_list: { type: "object" },
        always_in_stock: { type: "object" },
      },
      additionalProperties: true,
    } as const;

    function extractToolInput(msg: unknown): unknown | null {
      if (!msg || typeof msg !== "object") return null;
      const content = (msg as { content?: unknown }).content;
      if (!Array.isArray(content)) return null;
      for (const block of content) {
        if (
          block &&
          typeof block === "object" &&
          (block as { type?: string }).type === "tool_use" &&
          (block as { name?: string }).name === TOOL_NAME
        ) {
          return (block as { input?: unknown }).input ?? null;
        }
      }
      return null;
    }

    function extractText(msg: unknown): string {
      if (!msg || typeof msg !== "object") return "";
      const content = (msg as { content?: unknown }).content;
      if (!Array.isArray(content)) return "";
      return content
        .filter(
          (b): b is { type: "text"; text: string } =>
            Boolean(
              b &&
                typeof b === "object" &&
                (b as { type?: string }).type === "text" &&
                typeof (b as { text?: unknown }).text === "string",
            ),
        )
        .map((b) => b.text)
        .join("\n")
        .trim();
    }

    async function runWeekPlanClaude(userContent: string): Promise<unknown> {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const message = await anthropic.messages.create({
            model,
            max_tokens: 16000,
            temperature: 0,
            system,
            messages: [{ role: "user", content: userContent }],
            tools: [
              {
                name: TOOL_NAME,
                description:
                  "Lever het complete weekplan op als exact het gevraagde JSON-object.",
                input_schema: INPUT_SCHEMA,
              },
            ],
            tool_choice: { type: "tool", name: TOOL_NAME },
          });
          const toolInput = extractToolInput(message);
          if (toolInput !== null) return toolInput;
          const text = extractText(message);
          if (!text) throw new Error("Claude gaf geen tool-input of tekst terug.");
          return parseJsonFromClaudeText(text);
        } catch (e) {
          const retryable = isTransientNetworkError(e) && attempt === 0;
          if (!retryable) throw e;
          console.warn(
            "[weekplan/generate] transient network error, automatische retry",
          );
        }
      }
      throw new Error("Claude-call retry mislukt");
    }

    let parsed = await runWeekPlanClaude(userPrompt);
    console.log("[weekplan/generate] Anthropic ok", {
      seconds: Math.round((Date.now() - t0) / 1000),
    });

    let finalParsed: unknown | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const shape = validateWeekPlanPayload(parsed, { snacksEnabled: snacks });
      if (shape.ok) {
        finalParsed = parsed;
        break;
      }

      const retryCarb = shape.code === "carb_moments" && attempt === 0;
      const retryPantry =
        (shape.code === "pantry" || shape.code === "pantry_items") &&
        attempt === 0;
      const retryShopping =
        (shape.code === "shopping" || shape.code === "shopping_split") &&
        attempt === 0;

      if (!retryCarb && !retryPantry && !retryShopping) {
        // Probeer stille fallbacks voor pantry en shopping vóór harde fout
        if (shape.code === "pantry" || shape.code === "pantry_items") {
          parsed = ensureAlwaysInStockFallback(parsed);
          const fallbackShape = validateWeekPlanPayload(parsed, {
            snacksEnabled: snacks,
          });
          if (fallbackShape.ok) {
            finalParsed = parsed;
            console.warn("[weekplan/generate] pantry-fallback toegepast");
            break;
          }
        }
        if (shape.code === "shopping" || shape.code === "shopping_split") {
          parsed = ensureShoppingListFallback(parsed);
          const fallbackShape = validateWeekPlanPayload(parsed, {
            snacksEnabled: snacks,
          });
          if (fallbackShape.ok) {
            finalParsed = parsed;
            console.warn("[weekplan/generate] shopping-fallback toegepast");
            break;
          }
        }
        console.warn(
          "[weekplan/generate] validatie geweigerd",
          shape.code,
          shape.message,
        );
        return NextResponse.json(
          { error: shape.message, code: shape.code, retry: true },
          { status: 422 },
        );
      }

      const retryHint = retryCarb
        ? "Harde regel: per dag (day_index 1–7) maximaal twee maaltijden met carb_profile \"light\" of \"primary\" over ontbijt+lunch+diner+tussendoortjes samen; alle andere maaltijden die dag: carb_profile \"none\"."
        : retryShopping
          ? "Harde regel: shopping_list MOET altijd beide velden bevatten, ook als één ervan leeg is: { \"lunches_breakfast_snacks\": { \"categories\": [] }, \"dinners\": { \"categories\": [] } }. Lever een volledige gesplitste boodschappenlijst aan voor ontbijt/lunch/snacks én voor diners apart."
          : "Harde regel: always_in_stock is verplicht en moet intro + minstens 3 categorieën bevatten met concrete items (oliën, kruiden, voorraadkast/diepvries/basis).";
      console.warn(
        "[weekplan/generate] automatische hergeneratie",
        shape.code,
        shape.message,
      );
      parsed = await runWeekPlanClaude(
        `${userPrompt}\n\n---\nDe JSON werd afgekeurd: ${shape.message}\nGenereer opnieuw alleen het volledige weekmenu als één JSON-object (zelfde velden). ${retryHint}`,
      );
      console.log(
        "[weekplan/generate] Anthropic retry ok",
        {
          seconds: Math.round((Date.now() - t0) / 1000),
        },
      );
    }

    if (finalParsed === null) {
      return NextResponse.json(
        { error: "Weekplan na herberekening nog ongeldig." },
        { status: 502 },
      );
    }

    const payload = finalParsed as WeekPlanPayload;
    const compactDraft = true;
    for (const day of payload.days) {
      day.meals.ontbijt.servings = 1;
      day.meals.lunch.servings = 1;
      day.meals.diner.servings = 1;
      for (const snack of day.tussendoortjes ?? []) {
        snack.servings = 1;
      }
      if (compactDraft) {
        const meals = [
          day.meals.ontbijt,
          day.meals.lunch,
          day.meals.diner,
          ...(day.tussendoortjes ?? []),
        ];
        for (const m of meals) {
          m.ingredients = [];
          m.steps = [];
          m.kid_tip = null;
        }
      }
    }
    const allergies = Array.isArray(profile.allergies)
      ? (profile.allergies as unknown[]).filter(
          (a): a is string => typeof a === "string",
        )
      : [];

    const allergyCheck = checkAllergiesInMeals(allergies, [
      ...collectAllMeals(payload),
      ...pantryStaplesAsPseudoMeals(payload.always_in_stock),
    ]);
    if (!allergyCheck.ok) {
      console.warn(
        "[weekplan/generate] allergie-check geweigerd",
        allergyCheck.code,
        allergyCheck.message,
      );
      return NextResponse.json(
        {
          error: allergyCheck.message,
          code: allergyCheck.code,
          retry: true,
        },
        { status: 422 },
      );
    }
    const digestiveCheck = checkDigestiveGuardrails(profile, collectAllMeals(payload));
    if (!digestiveCheck.ok) {
      console.warn(
        "[weekplan/generate] darm-guardrail geweigerd",
        digestiveCheck.code,
        digestiveCheck.message,
      );
      return NextResponse.json(
        {
          error: digestiveCheck.message,
          code: digestiveCheck.code,
          retry: true,
        },
        { status: 422 },
      );
    }

    const { data: mealPlan, error: insErr } = await supabase
      .from("meal_plans")
      .insert({
        user_id: user.id,
        week_start: weekStart,
        cook_sessions_per_week: cook,
        snacks_enabled: snacks,
        payload: payload as unknown as Record<string, unknown>,
        user_meta: {
          completedMealIds: [],
          hydrationStatus: "hydrating",
          hydrationError: null,
          dinerHouseholdSize: 1,
        },
      })
      .select("id")
      .single();

    if (insErr || !mealPlan) {
      return NextResponse.json(
        { error: insErr?.message ?? "Opslaan weekplan mislukt." },
        { status: 500 },
      );
    }

    const shoppingPayload = buildShoppingListInsertPayload(payload);

    const { error: shopErr } = await supabase.from("shopping_lists").insert({
      user_id: user.id,
      meal_plan_id: mealPlan.id,
      payload: shoppingPayload as unknown as Record<string, unknown>,
    });

    if (shopErr) {
      await supabase.from("meal_plans").delete().eq("id", mealPlan.id);
      return NextResponse.json(
        { error: shopErr.message },
        { status: 500 },
      );
    }

    console.log(
      "[weekplan/generate] done",
      `${Math.round((Date.now() - t0) / 1000)}s`,
    );
    return NextResponse.json({
      ok: true,
      mealPlanId: mealPlan.id,
      payload,
    });
  } catch (e) {
    console.error("[weekplan/generate] error", e);
    const raw = e instanceof Error ? e.message : String(e);
    if (isOverloadedError(e)) {
      return NextResponse.json(
        {
          error:
            "De AI-dienst is op dit moment overbelast. Wacht een minuutje en probeer het dan opnieuw.",
          code: "overloaded",
          retry: true,
        },
        { status: 503 },
      );
    }
    if (isTransientNetworkError(e)) {
      return NextResponse.json(
        {
          error:
            "Netwerk-timeout naar Claude (verbinding viel weg). Probeer opnieuw; bij herhaling: andere wifi/hotspot of VPN uit, of later opnieuw.",
          code: "network_timeout",
          retry: true,
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: raw || "Onbekende fout" }, { status: 500 });
  }
}
