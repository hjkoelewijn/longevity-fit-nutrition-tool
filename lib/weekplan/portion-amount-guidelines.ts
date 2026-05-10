import type { WeekPlanMeal } from "./types";

/** Korte tekst voor prompts: alles is opgeslagen als basis 1 portie. */
export const ONE_PORTION_AMOUNT_GUIDELINES_PROMPT = `
Realistische hoeveelheden voor **1 portie** (gebruiker schaalt zelf in de app):
- **Hoofd-eiwit** als centraal onderdeel van **diner**: kipfilet/kippenborst rauw meestal **120–200 g**; kippendij **met bot** mag zwaarder (**ca. 180–320 g** rauw) door bot; visfilet **120–200 g**; mager varken/lam/rund als hoofdgerecht vaak **120–180 g** rauw; tofu/tempeh als hoofd **120–200 g**; peulvruchten (gekookt) **150–250 g** of **½–1 blik** afhankelijk van rol.
- **Lunch/ontbijt** (lichtere maaltijd): eiwit vaak **iets lager** dan diner, tenzij het expliciet een grote maaltijd is.
- **Groente**: ruim genoeg voor 1 portie (bv. **150–300 g** gemengde groente of vergelijkbaar), geen “gezinsbak” tenzij titel expliciet batch/restjes zegt.
- Geen **dubbele porties** verstopt in één “portie” — voor mealprep/herhaling: vermeld dat in titel of note, of zet repeat_for_leftovers; dan mogen hoeveelheden groter, maar wees expliciet.
`.trim();

const GRAM_RE = /^(\d+(?:[.,]\d+)?)\s*g\b/i;

function gramsFromAmount(amount: string): number | null {
  const m = String(amount ?? "").trim().match(GRAM_RE);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Ruwe plausibiliteitscheck op 1-persoonsbasis; slaat restjes/batch over. */
export function onePortionProteinAmountsPlausible(meal: WeekPlanMeal): boolean {
  if (meal.repeat_for_leftovers === true) return true;
  const title = String(meal.title ?? "").toLowerCase();
  if (
    title.includes("restjes") ||
    title.includes("voor 2") ||
    title.includes("2 personen") ||
    title.includes("dubbel") ||
    title.includes("batch") ||
    title.includes("mealprep")
  ) {
    return true;
  }

  for (const ing of meal.ingredients ?? []) {
    const name = String(ing.name ?? "").toLowerCase();
    const g = gramsFromAmount(String(ing.amount ?? ""));
    if (g === null) continue;

    if (/(kipfilet|kippenborst|kip borstfilet)/.test(name) && g > 240) return false;
    if (/(kippendij|kipdij|dij\s|dijen)/.test(name) && !/filet/.test(name) && g > 420)
      return false;
    if (/(biefstuk|ossenhaas|rund|runder|varken|speklap|lams|rack)/.test(name) && g > 280)
      return false;
    if (/(zalm|forel|kabeljauw|visfilet|tonijn\s|makreel)/.test(name) && g > 275) return false;
  }

  return true;
}

export const PORTION_PLAUSIBILITY_RETRY_HINT = `
Harde regel — **1 portie per maaltijd in de JSON**:
Pas hoofd-ingrediënten aan naar realistisch voor **één** geportioneerde maaltijd (geen gezins- of dubbele porties verborgen in één “portie”). Kipfilet/kippenborst rauw doorgaans **max. ~200 g**; kippendij met bot mag zwaarder door bot; visfilet **~150–200 g**; varken/lam/rund als hoofd **~120–180 g** rauw tenzij titel expliciet batch/restjes zegt.
`.trim();
