/**
 * Porties voor weekplan: 1 volwassene = 1 portie, 1 kind = 1 portie.
 * `household_children` kan als jsonb verschillende vormen hebben (array getallen, array objecten, …).
 */
export function countHouseholdChildren(children: unknown): number {
  if (typeof children === "number" && Number.isFinite(children) && children >= 0) {
    return Math.floor(children);
  }
  if (Array.isArray(children)) {
    let n = 0;
    for (const c of children) {
      if (c === null || c === undefined) continue;
      if (typeof c === "number" && Number.isFinite(c)) {
        n += 1;
        continue;
      }
      if (typeof c === "string" && c.trim() !== "") {
        n += 1;
        continue;
      }
      if (typeof c === "object") {
        const o = c as Record<string, unknown>;
        if ("age" in o && o.age !== null && o.age !== undefined && String(o.age).trim() !== "") {
          n += 1;
          continue;
        }
        if ("name" in o && o.name !== null && String(o.name).trim() !== "") {
          n += 1;
          continue;
        }
        n += 1;
      }
    }
    return n;
  }
  if (children && typeof children === "object" && !Array.isArray(children)) {
    return Object.keys(children as Record<string, unknown>).length;
  }
  return 0;
}

export function servingsFromProfile(profile: Record<string, unknown>): number {
  const adultsRaw = profile.household_adults;
  const adults =
    typeof adultsRaw === "number" && Number.isFinite(adultsRaw) && adultsRaw >= 1
      ? Math.floor(adultsRaw)
      : 2;
  const kidsCountRaw = profile.household_children_count;
  const kids =
    typeof kidsCountRaw === "number" &&
    Number.isFinite(kidsCountRaw) &&
    kidsCountRaw >= 0
      ? Math.floor(kidsCountRaw)
      : countHouseholdChildren(profile.household_children);
  return Math.max(1, adults + kids);
}
