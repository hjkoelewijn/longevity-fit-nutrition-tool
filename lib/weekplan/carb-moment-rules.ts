/**
 * Koolhydraatmomenten — productregels voor weekplan-generatie (Claude) en validatie.
 * Sluit aan op docs/01-filosofie-systeem-prompt-voedingstool.md (langzame koolhydraten, geen dogma’s).
 */

/** Eén zin voor UI, onboarding of korte tooltips. */
export const ZOETE_AARDAPPEL_REGEL_EEN_ZIN =
  "Zoete aardappel is een mild koolhydraatmoment (niet hetzelfde als witte rijst of wit brood): altijd als complexe bron, met ruim groente en kwaliteits-eiwit, volgens de Longevity Fit-filosofie.";

/**
 * Langere toelichting voor de user-/system-context van Claude (weekplan).
 * Fruit en groente tellen niet mee als ‘koolhydraatmoment’ in deze zin.
 */
export const KOOLHYDRAATMOMENT_UITLEG_VOOR_PROMPT = `
Koolhydraatmoment (richtlijn, max 2 per dag): bedoeld zijn vooral zetmeelrijke basen — granen, pasta, rijst, brood, gewone aardappel, enz.
Rijst hoort hier expliciet bij. Fruit en (meeste) groente tellen niet als zo’n moment.
Zoete aardappel: behandel als complexe, vezelrijke bron; nooit gelijkstellen aan snelle/refined koolhydraten.
Geef zoete aardappel in JSON altijd carb_profile "light" (tenzij het gerecht bewust een hoofd-zetmeelmaaltijd is — dan nog steeds niet gelijk aan wit brood/witte pasta qua kwaliteit; combineer met groente en eiwit).
`.trim();

/** Voorbeelden van wat wél als ‘hoofd-zetmeel’ telt voor carb_profile primary/light (geen exhaustive list). */
export const VOORBEELDEN_HOOFD_ZETMEEL = [
  "rijst (zilvervlies, basmati, …)",
  "pasta (volkoren waar passend)",
  "brood (liefst volkoren/zuurdesem)",
  "aardappel",
  "zoete aardappel (typisch light)",
  "quinoa, havermout, peulvruchten als maaltijdsbasis",
] as const;

/** Wat expliciet géén ‘koolhydraatmoment’ is in deze telling. */
export const GEEN_KOOLHYDRAATMOMENT = [
  "fruit (ook al bevat het suikers)",
  "groente (ook wortel / biet als bijgerecht)",
  "kleine hoeveelheden ui in saus",
] as const;
