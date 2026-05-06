import type { CarbProfile } from "./types";

const NL: Record<CarbProfile, string> = {
  none: "geen",
  light: "mild",
  primary: "aanwezig",
};

export function carbProfileNl(value: CarbProfile): string {
  return NL[value] ?? value;
}
