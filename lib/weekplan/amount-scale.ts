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

/** Getal + keukeneenheid; rest van de string (bijv. productnaam) wordt genegeerd voor schaling. */
const AMOUNT_RE =
  /^(\d+(?:[.,]\d+)?)\s*(kg|kilo(?:gram)?|g|gram|grammen|mg|ml|milliliter|cl|dl|deciliter|l|liter|tl|theelepel(?:s)?|el|eetlepel(?:s)?|stuk|stuks|teentjes|teentje|tenen|teen|plakken|plak|bolletjes|bolletje|bollen|bol|snufje|snuifje)\b/i;

function normalizeUnit(unitRaw: string): string {
  const unit = unitRaw.toLowerCase();
  if (unit === "theelepel" || unit === "theelepels") return "tl";
  if (unit === "eetlepel" || unit === "eetlepels") return "el";
  if (unit === "tenen" || unit === "teentje" || unit === "teentjes") return "teen";
  if (unit === "bolletje" || unit === "bolletjes" || unit === "bollen") return "bol";
  if (unit === "gram" || unit === "grammen") return "g";
  if (unit === "kilo" || unit === "kilogram") return "kg";
  if (unit === "milliliter") return "ml";
  if (unit === "liter") return "l";
  if (unit === "deciliter") return "dl";
  if (unit === "plakken") return "plak";
  if (unit === "snuifje") return "snufje";
  return unit;
}

export function formatScaledValue(value: number): string {
  if (value >= 10) return String(Math.round(value));
  if (value >= 1) return String(Math.round(value * 2) / 2).replace(".", ",");
  return String(Math.round(value * 10) / 10).replace(".", ",");
}

export function parseAmountText(amount: string): ParsedAmount {
  let raw = String(amount ?? "")
    .trim()
    .normalize("NFKC")
    .replace(/^["'`«»„]+|["'`«»]+$/g, "")
    .trim();
  if (!raw) return { kind: "text", text: "hoeveelheid volgt" };
  if (raw.toLowerCase() === "naar smaak") return { kind: "text", text: raw };
  raw = raw.replace(/^(ca\.?|ongeveer|±)\s+/i, "").trim();
  if (!raw) return { kind: "text", text: "hoeveelheid volgt" };

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
