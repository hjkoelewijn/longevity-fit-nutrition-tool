/** Normaliseert Supabase-rijen waar Day-1 schema licht kan afwijken. */

export function recipeDisplayTitle(row: Record<string, unknown>) {
  const t = row.title ?? row.name;
  return typeof t === "string" && t.trim() ? t.trim() : "Recept";
}

export function recipeSummary(row: Record<string, unknown>) {
  const s = row.summary ?? row.description;
  return typeof s === "string" ? s : null;
}

export function moduleDisplayTitle(row: Record<string, unknown>) {
  const t = row.title ?? row.name;
  return typeof t === "string" && t.trim() ? t.trim() : "Module";
}

export function moduleSummary(row: Record<string, unknown>) {
  const s = row.summary ?? row.description;
  return typeof s === "string" && s.trim() ? s.trim() : null;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
