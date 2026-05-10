import { collectAllMeals } from "./meals-helpers";
import {
  formatScaledValue,
  parseAmountText,
  scaleAmountText,
  type ParsedAmount,
} from "./amount-scale";
import type { ShoppingCategory, WeekPlanPayload } from "./types";

type MergeKey = `${string}::${string}`;

function normNameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function mergeParsedAmounts(parts: ParsedAmount[]): string {
  const scaled = parts.filter((p): p is Extract<ParsedAmount, { kind: "scaled" }> => p.kind === "scaled");
  const texts = parts.filter((p): p is Extract<ParsedAmount, { kind: "text" }> => p.kind === "text");
  const byUnit = new Map<string, number>();
  for (const s of scaled) {
    byUnit.set(s.unit, (byUnit.get(s.unit) ?? 0) + s.value);
  }
  const chunks: string[] = [];
  for (const [unit, value] of [...byUnit.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    chunks.push(`${formatScaledValue(value)} ${unit}`);
  }
  for (const t of texts) {
    if (!t.text.trim() || t.text === "hoeveelheid volgt") continue;
    chunks.push(t.text);
  }
  return chunks.length ? chunks.join(" + ") : "zie recept";
}

function categoryRoute(nameKey: string): { id: string; label: string } {
  const n = nameKey;
  if (
    /\b(tomaat|sla|broccoli|spinazie|boerenkool|paprika|wortel|wortels|prei|ui|knoflook|venkel|courgette|aubergine|spruitjes|spruit|asperge|champignon|groente|komkommer|avocado|rucola|mesclun|ijsbergs|romain)/.test(
      n,
    )
  ) {
    return { id: "groente-fruit", label: "Groente & fruit" };
  }
  if (
    /\b(kipfilet|kip|kippen|dij|rund|varken|lams|biefstuk|gehakt|spek|worst|bacon|salami|zalm|tonijn|makreel|forel|vis|garnaal|mossel|tofu|tempeh|ei|eieren|peul|linzen|kidney|kikker)/.test(n)
  ) {
    return { id: "eiwit", label: "Eiwit (vlees · vis · veggie)" };
  }
  if (/\b(yoghurt|kwark|melk|room|boter|crème|parmezaan|mozzarella|kaas|feta|zuivel)/.test(n)) {
    return { id: "zuivel", label: "Zuivel & kaas" };
  }
  if (/\b(pasta|rijst|couscous|bulgur|quinoa|brood|wrap|tortilla|havermout|noodles|noedel|zetmeel)/.test(n)) {
    return { id: "koolhydraten", label: "Koolhydraten" };
  }
  if (/\b(olijfolie|olie|azijn|kokosolie|ghee|mayo|dressing)/.test(n)) {
    return { id: "vetten", label: "Vetten & sauzen" };
  }
  if (/\b(blokjes|passata)\b/.test(n) || /\bblik(ken|je)?\b/.test(n) || /\bbouillon/.test(n)) {
    return { id: "droog-blik", label: "Pot · blik · basis" };
  }
  if (/\b(kaneel|paprika|kurkuma|cumin|komijn|oregano|tijm|peper|zout|specerij|kruiden)/.test(n)) {
    return { id: "kruiden", label: "Kruiden & smaak" };
  }
  return { id: "overig", label: "Overig" };
}

/**
 * Weekboodschappen afleiden uit maaltijden in het plan, met optionele
 * `mealId -> vermenigvuldiger` voor porties per gerecht (standaard 1).
 */
export function aggregateWeekShoppingFromMeals(
  payload: WeekPlanPayload,
  portionMultipliers: Record<string, number>,
): ShoppingCategory[] {
  const mergeMap = new Map<MergeKey, { displayName: string; parts: ParsedAmount[] }>();

  for (const meal of collectAllMeals(payload)) {
    const mult = portionMultipliers[meal.id];
    const factor = typeof mult === "number" && Number.isFinite(mult) ? Math.min(8, Math.max(1, mult)) : 1;
    const ings = meal.ingredients ?? [];
    for (const ing of ings) {
      const rawName = String(ing.name ?? "").trim();
      if (!rawName) continue;
      const nameKey = normNameKey(rawName);
      const rawAmount = String(ing.amount ?? "").trim();
      const scaledText = factor === 1 ? rawAmount : scaleAmountText(rawAmount, factor);
      const parsed = parseAmountText(scaledText);
      let unitKey = "text";
      if (parsed.kind === "scaled") unitKey = parsed.unit;
      else if (parsed.kind === "text") unitKey = slug(parsed.text).slice(0, 20) || "text";

      const key = `${nameKey}::${unitKey}` as MergeKey;
      const existing = mergeMap.get(key);
      if (!existing) {
        mergeMap.set(key, { displayName: rawName, parts: [parsed] });
      } else {
        existing.parts.push(parsed);
      }
    }
  }

  type Row = { cat: { id: string; label: string }; id: string; name: string; quantity: string };
  const rows: Row[] = [];

  for (const [, { displayName, parts }] of mergeMap) {
    const quantity = mergeParsedAmounts(parts);
    const nameKey = normNameKey(displayName);
    const cat = categoryRoute(nameKey);
    const pk = parts.find((p): p is Extract<ParsedAmount, { kind: "scaled" }> => p.kind === "scaled");
    const unitSlug = pk?.unit ?? "x";
    const id = `wk-${slug(nameKey)}-${slug(unitSlug)}`;
    rows.push({ cat, id, name: displayName, quantity });
  }

  const byCatId = new Map<string, ShoppingCategory>();

  rows.sort((a, b) => a.name.localeCompare(b.name, "nl"));

  for (const row of rows) {
    let catBucket = byCatId.get(row.cat.id);
    if (!catBucket) {
      catBucket = { id: row.cat.id, label: row.cat.label, items: [] };
      byCatId.set(row.cat.id, catBucket);
    }
    catBucket.items.push({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      in_pantry: false,
    });
  }

  const order = [
    "groente-fruit",
    "eiwit",
    "zuivel",
    "koolhydraten",
    "droog-blik",
    "vetten",
    "kruiden",
    "overig",
  ];
  return order.map((oid) => byCatId.get(oid)).filter((c): c is ShoppingCategory => Boolean(c?.items?.length));
}
