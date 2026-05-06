/** Haalt JSON uit Claude-antwoord (ook als er extra tekst omheen staat). */
function extractFirstJsonObject(input: string): string | null {
  const start = input.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i += 1) {
    const ch = input[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return input.slice(start, i + 1);
      }
    }
  }

  return null;
}

function normalizeCommonJsonIssues(input: string): string {
  return input
    .replace(/^\uFEFF/, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    // trailing comma's voor } of ]
    .replace(/,\s*([}\]])/g, "$1");
}

function extractCodeFenceBody(input: string): string | null {
  const m = /```(?:json)?\s*([\s\S]*?)```/i.exec(input);
  return m ? m[1].trim() : null;
}

export function parseJsonFromClaudeText(text: string): unknown {
  const raw = text.trim();
  const fromFence = extractCodeFenceBody(raw);

  const candidates = [
    raw,
    fromFence,
    extractFirstJsonObject(raw),
    fromFence ? extractFirstJsonObject(fromFence) : null,
  ].filter((x): x is string => Boolean(x && x.trim()));

  for (const c of candidates) {
    const normalized = normalizeCommonJsonIssues(c.trim());
    try {
      return JSON.parse(normalized);
    } catch {
      // probeer volgende kandidaat
    }
  }

  throw new Error("No parseable JSON object found in model output");
}
