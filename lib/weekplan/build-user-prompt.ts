import { KOOLHYDRAATMOMENT_UITLEG_VOOR_PROMPT, ZOETE_AARDAPPEL_REGEL_EEN_ZIN } from "./carb-moment-rules";
import { ONE_PORTION_AMOUNT_GUIDELINES_PROMPT } from "./portion-amount-guidelines";
import seizoenenData from "@/src/data/seizoenen.json";

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
  previousWeekOntbijtTitles?: string[];
  previousWeekLunchTitles?: string[];
  repeatPolicy?: {
    maxRepeatsFromPreviousWeek: number;
    minNewMeals: number;
  };
};

type SeizoenKey = "lente" | "zomer" | "herfst" | "winter";

function getSeizoensData(maand: number) {
  const seizoenen = seizoenenData.seizoenen as Record<SeizoenKey, {
    maanden: number[];
    groenten: string[];
    fruit: string[];
    paddenstoelen: string[];
    vis_en_zeevruchten: string[];
    vlees_en_gevogelte: string[];
    kruiden_vers: string[];
    notities: string;
  }>;
  const entry = (Object.entries(seizoenen) as [SeizoenKey, typeof seizoenen[SeizoenKey]][])
    .find(([, s]) => s.maanden.includes(maand));
  if (!entry) return null;
  const [naam, s] = entry;
  return {
    naam,
    groenten: [...s.groenten, ...seizoenenData.hele_jaar.groenten],
    fruit: s.fruit,
    vis: s.vis_en_zeevruchten,
    vlees: s.vlees_en_gevogelte,
    kruiden: s.kruiden_vers,
    paddenstoelen: s.paddenstoelen,
    notities: s.notities,
  };
}

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
    "lunches_breakfast_snacks": {
      "categories": [
        { "id": "groenten", "label": "Groenten & fruit", "items": [ { "id": "...", "name": "...", "quantity": "..." } ] }
      ]
    },
    "dinners": {
      "categories": [
        { "id": "eiwit", "label": "Eiwit (vlees · vis · veggie)", "items": [ { "id": "...", "name": "...", "quantity": "..." } ] }
      ]
    }
  },
BELANGRIJK shopping_list: geef ALTIJD beide velden terug, ook als één ervan leeg is — dus nooit shopping_list weglaten of als platte categories aanleveren. Bij twijfel: lege array is beter dan het veld weglaten.
  "shopping_list": { "lunches_breakfast_snacks": { "categories": [] }, "dinners": { "categories": [] } }
  "always_in_stock": {
    "intro": "Korte uitleg: eenmalige investering in basisvoorraad zodat je daarna snel voedzame maaltijden kunt maken (geen schuldgevoel als iets nog ontbreekt).",
    "categories": [
      { "id": "oliën", "label": "Oliën & azijn", "items": [ { "id": "...", "name": "..." } ] }
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
  const startDate = new Date(bundle.weekStartIso + "T12:00:00");
  const maand = startDate.getMonth() + 1;
  const seizoen = getSeizoensData(maand);
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

  const budgetBalanceBlock = `
Budget & haalbaarheid:
- Houd recepten in balans tussen premium en budgetvriendelijk.
- Gebruik vis/vlees bewust maar niet te vaak; voorkom dat de week vooral dure eiwitbronnen bevat.
- Plan vaker budgetvriendelijke eiwitopties zoals eieren, peulvruchten (als profiel het toelaat), tofu/tempeh en betaalbare zuivel/plantaardige alternatieven.
- Blijf binnen Longevity Fit-richtlijnen (groente + eiwit als basis, gezonde vetten, koolhydraatmomenten bewust).
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

  const seizoensBlock = seizoen ? `
Seizoen & beschikbare ingrediënten (leidend, niet optioneel):
Huidig seizoen: ${seizoen.naam} (maand ${maand})

Groenten in seizoen — begin hier, varieer actief over de hele lijst (niet alleen de vertrouwde 5):
${seizoen.groenten.join(", ")}

Fruit in seizoen: ${seizoen.fruit.join(", ")}

Vis & zeevruchten nu beschikbaar: ${seizoen.vis.join(", ")}

Vlees & gevogelte nu beschikbaar: ${seizoen.vlees.join(", ")}

Verse kruiden in seizoen: ${seizoen.kruiden.join(", ")}

Paddenstoelen: ${seizoen.paddenstoelen.join(", ")}

Seizoensnota (lees en pas toe): ${seizoen.notities}
`.trim() : "";

  const variatieBlock = `
Variatie-eisen voor deze week (verplicht, niet optioneel):
- Groenten: maximaal 2× hetzelfde groente als hoofdgroente per week. Kies bewust voor groenten die minder voor de hand liggen.
- Eiwit: maximaal 2× kip, maximaal 2× zalm/kabeljauw/zeebaars samen; minimaal 1× ander vlees (rund, lam, wild, eend) of vette vis (makreel, haring, sardines). Kip is aanvulling, niet default.
- Keukenstijl: varieer over minimaal 3 van deze 6: Mediterraan (citroen/olijfolie/olijven), Aziatisch (tamari/gember/sesamolie/paksoi), Indiaas/Midden-Oosten (kurkuma/komijn/tahini/za'atar), Noord-Europees (dille/mosterd/haring/rogge), Mexicaans (limoen/avocado/koriander/bonen), Frans (bouillon/dragon/mosterd/sjalot).
- Gerechtsstructuur: maximaal 2× "eiwit + groente op een bord/salade". Wissel af met: soep of stoofpot, wokschotel, ovenschotel, gevulde groente, curry of ragout, frittata, eenpansgerecht met peulvruchten, koude salade met warme component.
- Ontbijt: elk format maximaal 1× per week. Formats: eieren (gebakken/roerei/omelet/gepocheerd), havermout of warme pap, yoghurt of kwark met toppings, chiapudding of overnight oats, smoothie of smoothiebowl, savory ontbijt (zalm/avocado/restjes), brood of pannenkoekjes (max 1×).
- Weekdag-verbod: geen vaste koppeling weekdag–gerecht. Maandag is niet automatisch yoghurt, vrijdag niet automatisch vis.
`.trim();

  const antiHerhalingBlock = (() => {
    const diners = bundle.previousWeekDinnerTitles ?? [];
    const ontbijts = bundle.previousWeekOntbijtTitles ?? [];
    const lunches = bundle.previousWeekLunchTitles ?? [];
    if (!diners.length && !ontbijts.length && !lunches.length) return "";
    const lines: string[] = [
      "Gebruikt in de afgelopen week(en) — niet exact herhalen (wezenlijk andere combinatie van eiwit, groente of keuken):",
    ];
    if (diners.length) lines.push(`Diners: ${diners.join(", ")}`);
    if (ontbijts.length) lines.push(`Ontbijts: ${ontbijts.join(", ")}`);
    if (lunches.length) lines.push(`Lunches (excl. restjes): ${lunches.filter(t => !t.toLowerCase().includes("restje")).join(", ")}`);
    return lines.join("\n");
  })();

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
- **shopping_list (verplicht gesplitst in twee blokken):**
  - **shopping_list.lunches_breakfast_snacks**: weekinkoop voor **1 persoon (de gebruiker zelf)** voor de hele week — 7 ontbijten + 7 lunches + eventuele tussendoortjes samen. Logisch gegroepeerd (groenten, eiwitten, vetten, zuivel/plantaardig, droge voeding, kruiden, overig).
  - **shopping_list.dinners**: weekinkoop voor **alle 7 diners samen, voor 1 portie per diner (= 1 persoon)**. De gebruiker stelt zelf in de app in voor hoeveel personen die het diner kookt; de app vermenigvuldigt jouw hoeveelheden met dat aantal. **Jij hoeft geen gezinshoeveelheden te leveren in dit blok.** Logisch gegroepeerd, zelfde stijl als hierboven.
  - Producten die zowel voor lunches als diners gelden (bv. olijfolie, knoflook, ui) zet je **in dat blok waar het grootste deel van de behoefte zit** — geen dubbele regels.
  - Hoeveelheden altijd met duidelijke eenheid (g, ml, el, tl, stuk/stuks). **Schrijf nooit “zie recept” of “hoeveelheid volgt”** als hoeveelheid; vul een realistische schatting in.
- **always_in_stock:** aparte lijst “altijd op voorraad” — dingen die je (eenmalig) goed op voorraad hebt om **snel** een voedzame maaltijd te kunnen maken (oliën, azijn, basis specerijen, voorraadpotjes, diepvriesbasis, etc.). Korte **intro** waarin duidelijk is dat dit een **investering** is die drukke dagen lichter maakt; geen perfectionisme. **Voor «altijd op voorraad»-items zijn hoeveelheden niet nodig** (de gebruiker beheert dit zelf); je mag het "quantity"-veld weglaten of leeg laten.
- **prep_minutes** per gerecht: sluit aan bij **raw_profile.cooking_time_weekday** en **raw_profile.cooking_time_weekend** (beschikbare kooktijd). Meer tijd in het profiel → recepten mogen iets uitgebreider; weinig tijd → maximaal efficiënt en stressvrij, zonder “tekort”-gevoel.
- **Ingrediënt-hoeveelheden: ALTIJD een expliciete keuken-eenheid achter het getal.** Een kaal getal zonder eenheid (bijv. "amount":"2") is FOUT en wordt afgekeurd. Kies de juiste eenheid per ingrediënt:
  • knoflook → "teen" (bijv. "1 teen")
  • citroen / limoen / sinaasappel → "stuk" (of "1/2 stuk")
  • ui / sjalot / paprika / wortel / courgette / ei / appel / avocado → "stuk"
  • olijfolie / boter / azijn / sojasaus / honing / tomatenpuree / mosterd / pesto → "el" of "tl"
  • kruiden & specerijen (peper, zout, paprikapoeder, kaneel, kerrie, tijm, oregano, kurkuma) → "tl" of "snufje"
  • bouillon / melk / room / water / vruchtensap / kookvocht → "ml"
  • rijst / pasta / havermout / linzen / kipfilet / vis / vlees / groente per gewicht / kaas per gewicht → "g"
  • bos peterselie / koriander / basilicum → "bos" of "el (gehakt)"
  Schrijf "naar smaak" alleen voor zout/peper/specerijen die je echt op gevoel doseert.
- Porties: gebruik voor **alle maaltijden** servings = 1 als basisportie (ontbijt, lunch, diner en tussendoortjes).

${ONE_PORTION_AMOUNT_GUIDELINES_PROMPT}
- Intuïtief eten: behandel porties als **richtlijn**, niet als dwang. Op actievere dagen of bij meer trek mag iemand opschalen; bij minder trek mag het omlaag. Geef in toon en opbouw ruimte voor honger/verzadiging.
- Praktische bordvolgorde volgens Longevity Fit: start met groente + eiwit, daarna vetten, daarna (waar passend) koolhydraten.

kid_tip — voor het gezin van een 40+ vrouw, vaak met tieners (≈ 12–18 jaar):
- Doelgroep van de tip is **tieners en oudere kids**, niet peuters/kleuters. Géén babytaal, géén "leg apart als knapperige snack", géén smiley-vormen van groente, géén beschermend toontje.
- Zinvolle richtingen voor kid_tip (kies er hooguit één per recept):
  • **Vullende variant** voor groei/sport: een handje noten, een extra ei, grotere portie van de koolhydraatbron erbij.
  • **Eenvoudige swap** voor een ingrediënt dat tieners vaak minder snel lusten: bv. spinazie → ijsbergsla, blauwe kaas → mozzarella, vis → kip — zonder dat het karakter van de maaltijd verdwijnt.
  • **Pittigheid/bitterheid temperen** voor wie dat liever heeft (citroen er los bij, mildere mosterd, minder paprikapoeder) zonder dat het slap wordt.
  • **'Help-mee'-aanwijzing** waarmee de tiener een deel van het werk zelf doet (saus mengen, marinade kloppen, groente schillen).
  • **Portieschaaltip**: bv. "voor een hongerige tiener ½ tot 1 portie extra van de koolhydraatbron".
- Als er geen logische tienertip is: zet kid_tip op null. **Niet forceren.**

Kooksessies (cook_sessions_per_week = ${bundle.cookSessionsPerWeek}):
- Dit is het aantal keer per week dat iemand bewust kookt (warm/groter bereiden, batch), niet “elke maaltijd vers”.
- Andere dagen: restjes/herhaling (zet repeat_for_leftovers waar logisch), tweede dag hetzelfde gerecht of voorbereid uit eerdere sessie. Houd rekening met eating_pattern uit raw_profile (o.a. eat_out_per_week) voor hoe vaak uit eten past — geen harde aannames buiten profiel.
- Bij 3 sessies: plan vaker dubbele porties of dezelfde schotel opnieuw (lunch volgende dag) zodat 7 dagen haalbaar blijft zonder elke avond lang koken.
- Als lunch op dag N restjes van diner dag N-1 gebruikt, benoem dit in titel/repeat_for_leftovers zonder servings kunstmatig te verhogen.

${seizoensBlock}

${variatieBlock}

${antiHerhalingBlock}

${digestiveGuardrailBlock}

${budgetBalanceBlock}

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
