import { readFile } from "node:fs/promises";
import path from "node:path";

export type RichtlijnSectieId =
  | "hoe-wanneer"
  | "wat-op-bord"
  | "bereiding"
  | "drinken"
  | "beperken";

export interface Richtlijn {
  nummer: number;
  sectie: RichtlijnSectieId;
  titel: string;
  uitleg: string;
  signalenChecklist?: string[];
  zuivelHierarchie?: { positie: number; tekst: string }[];
}

export interface RichtlijnenSectie {
  id: RichtlijnSectieId;
  titel: string;
  richtlijnen: number[];
}

export interface RichtlijnenPaginaData {
  titel: string;
  subtitel: string;
  intro: string;
  footerDisclaimer: string;
  secties: RichtlijnenSectie[];
  richtlijnen: Richtlijn[];
}

const SECTIE_MAP: Record<string, { id: RichtlijnSectieId; titel: string }> = {
  "HOE EN WANNEER JE EET": { id: "hoe-wanneer", titel: "Hoe en wanneer je eet" },
  "WAT ER OP JE BORD LIGT": { id: "wat-op-bord", titel: "Wat er op je bord ligt" },
  "HOE JE HET BEREIDT": { id: "bereiding", titel: "Hoe je het bereidt" },
  "WAT JE DRINKT": { id: "drinken", titel: "Wat je drinkt" },
  "WAT JE BEPERKT": { id: "beperken", titel: "Wat je beperkt" },
};

function between(text: string, start: string, end: string): string {
  const i = text.indexOf(start);
  if (i < 0) return "";
  const from = i + start.length;
  const j = text.indexOf(end, from);
  if (j < 0) return text.slice(from).trim();
  return text.slice(from, j).trim();
}

function extractBulletList(body: string, marker: string): string[] {
  const i = body.indexOf(marker);
  if (i < 0) return [];
  const chunk = body.slice(i + marker.length);
  return chunk
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

function extractZuivelHierarchie(body: string): { positie: number; tekst: string }[] {
  const i = body.indexOf("Van meest naar minst aan te raden:");
  if (i < 0) return [];
  const chunk = body.slice(i).split("\n");
  const out: { positie: number; tekst: string }[] = [];
  for (const line of chunk) {
    const m = line.trim().match(/^(\d+)\.\s+(.+)$/);
    if (!m) continue;
    out.push({ positie: Number(m[1]), tekst: m[2].trim() });
  }
  return out;
}

function parseRichtlijnen(md: string): {
  secties: RichtlijnenSectie[];
  richtlijnen: Richtlijn[];
} {
  const sectieBlocks = md.split("\n## SECTIE ").slice(1);
  const secties: RichtlijnenSectie[] = [];
  const richtlijnen: Richtlijn[] = [];

  for (const block of sectieBlocks) {
    const firstLineEnd = block.indexOf("\n");
    if (firstLineEnd < 0) continue;
    const rawTitle = block.slice(0, firstLineEnd).trim();
    const normalizedTitle = rawTitle.replace(/^\d+:\s*/, "").trim();
    const sectieDef = SECTIE_MAP[normalizedTitle];
    if (!sectieDef) continue;
    const body = block.slice(firstLineEnd + 1);
    const guidelineChunks = body.split("\n### ").slice(1);
    const nummers: number[] = [];

    for (const chunk of guidelineChunks) {
      const lineEnd = chunk.indexOf("\n");
      if (lineEnd < 0) continue;
      const header = chunk.slice(0, lineEnd).trim();
      const m = header.match(/^(\d+)\.\s+(.+)$/);
      if (!m) continue;
      const nummer = Number(m[1]);
      const titel = m[2].trim();
      const rest = chunk.slice(lineEnd + 1).trim();
      const uitleg = rest.replace(/^\*\*Uitklap-uitleg:\*\*\s*/m, "").trim();
      const signalenChecklist =
        nummer === 15
          ? extractBulletList(uitleg, "**Check eens bij jezelf:**")
          : nummer === 16
            ? extractBulletList(
                uitleg,
                "**Signalen dat suiker een grotere rol speelt dan je dacht:**",
              )
            : [];
      const zuivelHierarchie = nummer === 15 ? extractZuivelHierarchie(uitleg) : [];
      richtlijnen.push({
        nummer,
        sectie: sectieDef.id,
        titel,
        uitleg,
        signalenChecklist: signalenChecklist.length > 0 ? signalenChecklist : undefined,
        zuivelHierarchie: zuivelHierarchie.length > 0 ? zuivelHierarchie : undefined,
      });
      nummers.push(nummer);
    }

    secties.push({
      id: sectieDef.id,
      titel: sectieDef.titel,
      richtlijnen: nummers,
    });
  }

  richtlijnen.sort((a, b) => a.nummer - b.nummer);
  return { secties, richtlijnen };
}

export async function getRichtlijnenData(): Promise<RichtlijnenPaginaData> {
  const fp = path.join(
    process.cwd(),
    "docs/richtlijnen/cursor-prompt-richtlijnen-v5.md",
  );
  const md = await readFile(fp, "utf8");

  const intro = between(md, "### Intro", "\n---\n\n## De 16 richtlijnen");
  const footerDisclaimer = between(
    md,
    "## Footer-disclaimer onderaan deze pagina",
    "\n---\n\n## Toevoeging aan filosofie-systeem-prompt",
  )
    .replace(/^>\s*/gm, "")
    .trim();
  const { secties, richtlijnen } = parseRichtlijnen(md);

  return {
    titel: "Onze richtlijnen",
    subtitel: "De basis waar al onze recepten en menu's op rusten",
    intro,
    footerDisclaimer,
    secties,
    richtlijnen,
  };
}

