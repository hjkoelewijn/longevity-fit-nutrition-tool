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

export function formatScaledValue(value: number): string {
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
