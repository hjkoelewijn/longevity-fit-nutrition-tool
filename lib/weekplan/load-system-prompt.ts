import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Laadt de Longevity Fit system prompt uit docs/01-filosofie-systeem-prompt-voedingstool.md.
 * Het markdown-bestand heeft meerdere --- blokken (intro, versiebeheer, kop, echte prompt);
 * we pakken het blok dat met de coach-opening begint.
 */
const COACH_OPENING = "Je bent de voedingscoach van Longevity Fit";

export async function loadLongevitySystemPrompt(): Promise<string> {
  const filePath = path.join(
    process.cwd(),
    "docs",
    "01-filosofie-systeem-prompt-voedingstool.md",
  );
  const md = await readFile(filePath, "utf-8");
  const parts = md.split(/\n---\n/);
  const body = parts.find((p) => p.includes(COACH_OPENING))?.trim();
  if (!body) {
    throw new Error(
      `Filosofie-document: geen system prompt gevonden (verwacht tekst met "${COACH_OPENING}").`,
    );
  }
  return body;
}
