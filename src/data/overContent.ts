import { readFile } from "node:fs/promises";
import path from "node:path";

export type OverContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "signature"; text: string };

export type OverSectie = {
  id: "visie" | "team" | "partners" | "disclaimer";
  titel: string;
  subtitel?: string;
  zichtbaar: boolean;
  placeholder?: boolean;
  blocks?: OverContentBlock[];
};

export type OverPaginaData = {
  paginaTitel: string;
  secties: OverSectie[];
};

function between(text: string, start: string, end: string): string {
  const i = text.indexOf(start);
  if (i < 0) return "";
  const from = i + start.length;
  const j = text.indexOf(end, from);
  if (j < 0) return text.slice(from).trim();
  return text.slice(from, j).trim();
}

function parseBlocks(content: string): OverContentBlock[] {
  const lines = content.split("\n");
  const blocks: OverContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      const text = line.slice(2, -2).trim();
      if (text === "Heidy en Christina") {
        blocks.push({ type: "signature", text });
      } else {
        blocks.push({ type: "heading", text });
      }
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2).trim());
        i += 1;
      }
      blocks.push({ type: "bullet_list", items });
      continue;
    }

    const paragraphLines = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith("- ") && !/^\*\*[^*]+\*\*$/.test(lines[i].trim())) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

export async function getOverPaginaData(): Promise<OverPaginaData> {
  const fp = path.join(process.cwd(), "docs/cursor-prompt-over-pagina.md");
  const md = await readFile(fp, "utf8");

  const subtitelMatch = md.match(/\*\*Sectie-subtitel:\*\*\s*(.+)/);
  const subtitel = subtitelMatch ? subtitelMatch[1].trim() : undefined;
  const visieRaw = between(md, "### Volledige content", "\n---\n\n## Sectie 2:");
  const blocks = parseBlocks(visieRaw);

  return {
    paginaTitel: "Over Longevity Fit",
    secties: [
      {
        id: "visie",
        titel: "Onze visie",
        subtitel,
        zichtbaar: true,
        blocks,
      },
      {
        id: "team",
        titel: "Het team",
        zichtbaar: false,
        placeholder: true,
      },
      {
        id: "partners",
        titel: "Onze partners",
        zichtbaar: false,
        placeholder: true,
      },
      {
        id: "disclaimer",
        titel: "Disclaimer",
        zichtbaar: false,
        placeholder: true,
      },
    ],
  };
}

