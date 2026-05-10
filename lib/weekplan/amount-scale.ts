export type ParsedAmount =
  | {
      kind: "scaled";
      value: number;
      unit: string;
    }
  | {
      kind: "text";
      text: string;
    };

const AMOUNT_RE = /^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|tl|theelepel(?:s)?|el|eetlepel(?:s)?|stuk|stuks|teen|tenen)$/i;

function normalizeUnit(unitRaw: string): string {
  const unit = unitRaw.toLowerCase();
  if (unit === "theelepel" || unit === "theelepels") return "tl";
  if (unit === "eetlepel" || unit === "eetlepels") return "el";
  if (unit === "tenen") return "teen";
  return unit;
}

function formatScaledValue(value: number): string {
  if (value >= 10) return String(Math.round(value));
  if (value >= 1) return String(Math.round(value * 2) / 2).replace(".", ",");
  return String(Math.round(value * 10) / 10).replace(".", ",");
}

export function parseAmountText(amount: string): ParsedAmount {
  const raw = String(amount ?? "").trim();
  if (!raw) return { kind: "text", text: "hoeveelheid volgt" };
  if (raw.toLowerCase() === "naar smaak") return { kind: "text", text: raw };

  const m = raw.match(AMOUNT_RE);
  if (!m) return { kind: "text", text: raw };

  const value = Number(m[1].replace(",", "."));
  if (!Number.isFinite(value)) return { kind: "text", text: raw };
  return { kind: "scaled", value, unit: normalizeUnit(m[2]) };
}

export function scaleAmountText(amount: string, factor: number): string {
  const parsed = parseAmountText(amount);
  if (parsed.kind === "text") return parsed.text;

  const scaledValue = parsed.value * factor;
  return `${formatScaledValue(scaledValue)} ${parsed.unit}`;
}

const LEAD_WEIGHT_RE = /^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\b(.*)$/i;

/**
 * Weekboodschappen-quantities zijn vrije tekst. Probeer veilig te schalen;
 * anders origineel teruggeven (caller toont dan uitleg).
 */
export function scaleShoppingQuantity(quantity: string, factor: number): string {
  const raw = String(quantity ?? "").trim();
  if (!raw || factor <= 1 || !Number.isFinite(factor)) return raw;

  const cleaned = raw.replace(/^(ca\.?|ongeveer|~)\s+/i, "");

  const asIngredient = parseAmountText(cleaned);
  if (asIngredient.kind === "scaled") {
    return scaleAmountText(cleaned, factor);
  }

  const leadW = LEAD_WEIGHT_RE.exec(cleaned);
  if (leadW) {
    const v = Number(leadW[1].replace(",", "."));
    const u = normalizeUnit(leadW[2]);
    const rest = leadW[3] ?? "";
    if (Number.isFinite(v) && v > 0) {
      return `${formatScaledValue(v * factor)} ${u}${rest}`.trimEnd();
    }
  }

  // "2 x 400 g" / "3 × 200 ml": schaal het aantal pakjes; hou netto-grootte gelijk.
  const packMul = /^(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\b(.*)$/i.exec(
    cleaned,
  );
  if (packMul) {
    const count = Number(packMul[1].replace(",", "."));
    const inner = packMul[2].replace(",", ".");
    const u = normalizeUnit(packMul[3]);
    const rest = packMul[4] ?? "";
    if (Number.isFinite(count) && count > 0) {
      const sep = cleaned.includes("×") ? "×" : "x";
      return `${formatScaledValue(count * factor)} ${sep} ${inner.replace(".", ",")} ${u}${rest}`.trimEnd();
    }
  }

  const leadNum = /^(\d+(?:[.,]\d+)?)\s+(.+)$/.exec(cleaned);
  if (leadNum) {
    const v = Number(leadNum[1].replace(",", "."));
    const rest = leadNum[2].trim();
    if (Number.isFinite(v) && v > 0 && rest.length > 0 && !/^\d/.test(rest)) {
      if (/^(x|×)\s*\d/i.test(rest)) {
        return raw;
      }
      return `${formatScaledValue(v * factor)} ${rest}`;
    }
  }

  return raw;
}
