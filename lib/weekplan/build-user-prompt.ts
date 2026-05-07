import { KOOLHYDRAATMOMENT_UITLEG_VOOR_PROMPT, ZOETE_AARDAPPEL_REGEL_EEN_ZIN } from "./carb-moment-rules";

export type ProfileBundle = {
  profile: Record<string, unknown>;
  balanceTest: Record<string, unknown> | null;
  weekStartIso: string;
  cookSessionsPerWeek: 3 | 5 | 7;
  snacksEnabled: boolean;
  seasonNl: string;
  servings: number;
  draftMode?: boolean;
  previousWeekDinnerTitles?: string[];
  repeatPolicy?: {
    maxRepeatsFromPreviousWeek: number;
    minNewMeals: number;
  };
};

const JSON_SCHEMA_HINT = `
Het antwoord moet EXACT één JSON-object zijn (geen markdown, geen uitleg erna), met deze structuur:
{
  "schema_version": 1,
  "week_start_iso": "YYYY-MM-DD",
  "locale": "nl-NL",
  "generation_notes": "korte interne notitie",
  "days": [
    {
      "date_iso": "YYYY-MM-DD",
      "day_index": 1,
      "cycle_hint": "kort of null",
      "meals": {
        "ontbijt": Meal,
        "lunch": Meal,
        "diner": Meal
      },
      "tussendoortjes": [ Meal, ... ] 
    }
  ],
  "shopping_list": {
    "categories": [
      { "id": "groenten", "label": "Groenten & fruit", "items": [ { "id": "...", "name": "...", "quantity": "..." } ] }
    ]
  },
  "always_in_stock": {
    "intro": "Korte uitleg: eenmalige investering in basisvoorraad zodat je daarna snel voedzame maaltijden kunt maken (geen schuldgevoel als iets nog ontbreekt).",
    "categories": [
      { "id": "oliën", "label": "Oliën & azijn", "items": [ { "id": "...", "name": "...", "quantity": "..." } ] }
    ]
  }
}
Meal = {
  "id": "uniek-id-per-maaltijd-in-deze-week",
  "slot": "ontbijt" | "lunch" | "diner" | "tussendoortje",
  "title": "...",
  "prep_minutes": number,
  "servings": number,
  "kid_tip": "string of null",
  "ingredients": [ { "name": "...", "amount": "...", "note": null } ],
  "steps": [ "..." ],
  "carb_profile": "none" | "light" | "primary",
  "allergen_flags": [],
  "repeat_for_leftovers": false
}
Regels:
- 7 dagen, opeenvolgend vanaf week_start_iso (maandag).
- Per dag: ontbijt, lunch, diner verplicht. tussendoortjes alleen als snacks aan staan; maximaal zodat totaal eetmomenten ≤ 4.
- carb_profile: "primary" of "light" alleen voor echte zetmeel-/graanmomenten (rijst, pasta, brood, havermout als hoofdcomponent, aardappel, enz.); fruit en groente als hoofdbron → altijd "none". Gebruik "primary" als standaard voor zulke momenten; gebruik "light" alleen bij mildere/kleinere zetmeelrol (vaak zoete aardappel of bewust kleine portie zetmeel naast veel groente/eiwit).
- Harde telling (server valideert dit): per dag tel je over ontbijt + lunch + diner + alle tussendoortjes hoeveel maaltijden carb_profile "light" OF "primary" hebben. Dat aantal moet 0, 1 of 2 zijn — nooit 3 of meer. Zet dus minstens één zware maaltijd die dag op "none" als je anders over 2 heen zou gaan (klein beetje brood in lunch → nog steeds "none" als het geen hoofd-zetmeelmaaltijd is).
- Voorbeeld goed: ontbijt havermout (primary) + lunch salade met kip (none) + diner rijst-curry (primary) = 2.
- Voorbeeld fout: ontbijt brood (light) + lunch wrap (light) + diner pasta (primary) = 3 → pas aan naar o.a. lunch "none" of kies één maaltijd zonder hoofd-zetmeel.
- Zoete aardappel: ${ZOETE_AARDAPPEL_REGEL_EEN_ZIN}
- Herhaal gerechten waar handig bij cook_sessions_per_week (3/5/7).
`.trim();

export function buildWeekPlanUserPrompt(bundle: ProfileBundle): string {
  const p = bundle.profile;
  const gutStatus =
    p.gut_status && typeof p.gut_status === "object"
      ? (p.gut_status as Record<string, unknown>)
      : {};
  const glutenApproach =
    typeof p.gluten_approach === "string" ? p.gluten_approach : "";
  const legumeApproach =
    typeof gutStatus.legumes_approach === "string"
      ? gutStatus.legumes_approach
      : "";
  const bloating = typeof gutStatus.bloating === "string" ? gutStatus.bloating : "";
  const gutIssue = typeof gutStatus.gut_issue === "string" ? gutStatus.gut_issue : "";
  const intolerances = Array.isArray(p.intolerances)
    ? (p.intolerances as unknown[])
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.toLowerCase())
    : [];
  const hasFodmapIntolerance = intolerances.some((x) => x.includes("fodmap"));
  const digestiveGuardrailBlock = `
Spijsvertering & gevoeligheden (harde guardrails):
- gluten_approach = "${glutenApproach || "onbekend"}"
- legumes_approach = "${legumeApproach || "onbekend"}"
- bloating = "${bloating || "onbekend"}", gut_issue = "${gutIssue || "onbekend"}"
- Als gluten_approach "vermijd ik" is: plan volledig glutenvrij (geen tarwe/spelt/gerst/rogge).
- Als gluten_approach "eet ik minimaal" is: plan gluten minimaal (maximaal 2 glutengerichte maaltijden per week, nooit op opeenvolgende dagen).
- Als legumes_approach "vermijd ik" is: geen peulvruchten in gerechten.
- Als legumes_approach "word ik opgeblazen / winderig van" is: peulvruchten minimaal toepassen (maximaal 2 maaltijden per week met peulvruchten, in kleine rol).
- Bij bloating="ja" of gut_issue="ja": kies milde bereidingen (niet pittig, niet zwaar gefrituurd), rustig opbouwend.
- Als intolerances FODMAP bevat (${hasFodmapIntolerance ? "JA" : "NEE"}): vermijd hoge-FODMAP triggers (o.a. linzen, kikkererwten/bonen, ui, knoflook, tarwe, rogge).
- Als intolerances lactose bevat: vermijd lactose-rijke zuivel (melk, yoghurt/kwark, room, zachte kazen), kies lactosevrij/plantaardig.
- Als intolerances nachtschades bevat: vermijd tomaat, paprika, aubergine en aardappel.
- Als intolerances histamine bevat: vermijd histaminerijke keuzes (oude kaas, gerookt/gefermenteerd, ingeblikte vis, salami, wijn).
- Als intolerances "anders" bevat: hanteer conservatieve, milde keuzes en vermijd bekende triggers.
`.trim();

  const speedBlock = bundle.draftMode
    ? `
Snelheidsmodus (eerste versie voor snelle UX):
- Eerste call = planning, niet detailrecept.
- Per maaltijd: zet ingredients op [].
- Per maaltijd: zet steps op [].
- kid_tip standaard null in deze fase (tenzij echt nodig).
- Kies realistische maar korte prep_minutes.
- Lever wel ALLE verplichte velden/schema-onderdelen volledig aan (ook shopping_list + always_in_stock).
`.trim()
    : "";

  const repeatBlock =
    bundle.previousWeekDinnerTitles && bundle.previousWeekDinnerTitles.length > 0 && bundle.repeatPolicy
      ? `
Variatie met gecontroleerde herhaling (focus op diner/kooksessies):
- Vorige week gebruikte diner-titels:
${bundle.previousWeekDinnerTitles.map((t) => `  - ${t}`).join("\n")}
- Herhaal maximaal ${bundle.repeatPolicy.maxRepeatsFromPreviousWeek} diner-titels uit deze lijst.
- Introduceer minimaal ${bundle.repeatPolicy.minNewMeals} nieuwe maaltijdtitels in de week (niet in lijst hierboven).
- Een beetje herhaling mag (comfort/haalbaarheid), maar bewaak duidelijke variatie over de week.
`.trim()
      : "";

  return `
Genereer een volledig weekmenu voor Longevity Fit (Nederlands).

${JSON_SCHEMA_HINT}

Context koolhydraatmomenten:
${KOOLHYDRAATMOMENT_UITLEG_VOOR_PROMPT}

Profiel (JSON):
${JSON.stringify(
  {
    week_start_iso: bundle.weekStartIso,
    cook_sessions_per_week: bundle.cookSessionsPerWeek,
    snacks_enabled: bundle.snacksEnabled,
    season: bundle.seasonNl,
    servings: bundle.servings,
    raw_profile: bundle.profile,
    latest_balance_test: bundle.balanceTest,
  },
  null,
  2,
)}

Taken:
- Controleer vóór afronden: voor elke dag (1–7) expliciet de carb-telling (light+primary) ≤ 2.
- Respecteer allergieën en intoleranties strikt in ingrediënten en bereiding.
- Geen medische claims; geen calorie-doelen.
- **shopping_list:** weekinkoop, logisch gegroepeerd (groenten, eiwitten, vetten, zuivel/plantaardig, droge voeding, kruiden, overig).
- **always_in_stock:** aparte lijst “altijd op voorraad” — dingen die je (eenmalig) goed op voorraad hebt om **snel** een voedzame maaltijd te kunnen maken (oliën, azijn, basis specerijen, voorraadpotjes, diepvriesbasis, etc.). Korte **intro** waarin duidelijk is dat dit een **investering** is die drukke dagen lichter maakt; geen perfectionisme.
- **prep_minutes** per gerecht: sluit aan bij **raw_profile.cooking_time_weekday** en **raw_profile.cooking_time_weekend** (beschikbare kooktijd). Meer tijd in het profiel → recepten mogen iets uitgebreider; weinig tijd → maximaal efficiënt en stressvrij, zonder “tekort”-gevoel.
- Porties: voor **diner** gebruik je servings = ${bundle.servings} (gezin). Voor **ontbijt/lunch/tussendoortjes** gebruik je servings = 1 (per persoon).
- Intuïtief eten: behandel porties als **richtlijn**, niet als dwang. Op actievere dagen of bij meer trek mag iemand opschalen; bij minder trek mag het omlaag. Geef in toon en opbouw ruimte voor honger/verzadiging.
- Praktische bordvolgorde volgens Longevity Fit: start met groente + eiwit, daarna vetten, daarna (waar passend) koolhydraten.

Kooksessies (cook_sessions_per_week = ${bundle.cookSessionsPerWeek}):
- Dit is het aantal keer per week dat iemand bewust kookt (warm/groter bereiden, batch), niet “elke maaltijd vers”.
- Andere dagen: restjes/herhaling (zet repeat_for_leftovers waar logisch), tweede dag hetzelfde gerecht of voorbereid uit eerdere sessie. Houd rekening met eating_pattern uit raw_profile (o.a. eat_out_per_week) voor hoe vaak uit eten past — geen harde aannames buiten profiel.
- Bij 3 sessies: plan vaker dubbele porties of dezelfde schotel opnieuw (lunch volgende dag) zodat 7 dagen haalbaar blijft zonder elke avond lang koken.

${digestiveGuardrailBlock}

${speedBlock}

${repeatBlock}
`.trim();
}

export function seasonNlFromMonth(monthIndex0: number): string {
  const m = monthIndex0 + 1;
  if (m >= 3 && m <= 5) return "lente";
  if (m >= 6 && m <= 8) return "zomer";
  if (m >= 9 && m <= 11) return "herfst";
  return "winter";
}
