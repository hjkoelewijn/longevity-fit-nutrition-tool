# Cursor-prompt: Categorie "Je hormonen en organen" : module 1 live, 2 en 3 placeholder

**Doel:** de categorie "Je hormonen en organen" aanmaken in de kennisbank van de Longevity Fit voedingstool. Module 1 (Cyclus en eten) is afgerond en wordt live gezet. Modules 2 en 3 worden als placeholder aangemaakt in de data maar zijn nog niet zichtbaar voor deelnemers.

**Context:** dit bouwt voort op de kennisbank-structuur zoals opgeleverd in de eerdere Cursor-prompts. De bestaande categorieën "De basis", "Hoe je eet en leeft" en "Wat gebeurt er in je 40+ lichaam?" blijven ongewijzigd.

**Status implementatie:** voltooid. Moduletekst staat in `src/data/modules/cyclus.ts`. Routes onder `app/kennisbank/hormonen-en-organen/`. Categorie blijft `preview` op het hoofdoverzicht.

---

## DEEL 1: STATUS EN VOLGORDE

De categorie "Je hormonen en organen" heeft status `'preview'` in de kennisbank-overzichtspagina. De categorie-kaart is niet klikbaar voor deelnemers.

Definitieve volgorde:

1. Cyclus en eten (per fase) (id: cyclus, zichtbaar/klikbaar: true)
2. De lever, het orgaan dat alles draagt (id: lever, zichtbaar/klikbaar: false, placeholder)
3. Darmwandherstel: waarom je je in het begin niet meteen beter voelt (id: darmwand, zichtbaar/klikbaar: false, placeholder)

---

## DEEL 2: PAGINA-ROUTES

```
/kennisbank/hormonen-en-organen                          → categorie-tussenpagina (gebouwd, niet vanaf overzicht zolang preview)
/kennisbank/hormonen-en-organen/cyclus                   → module 1 (live)
```

Modules 2 en 3 hebben nog geen routes.

---

## DEEL 3: INTERNE VERWIJZINGEN

Goud accent, subtiel — opgenomen in de luteale-fase- en perimenopauze-paragrafen:

- "zoals je in de bloedsuiker-module las" → `/kennisbank/de-basis/bloedsuiker`
- "de stress-module" → `/kennisbank/hoe-je-eet-en-leeft/stress`
- "de eiwitten-module" → `/kennisbank/de-basis/eiwitten`
- "de module over goede vetten" → `/kennisbank/de-basis/goede-vetten`

---

## DEEL 4: MODULE-CONTENT

Volledige tekst: `src/data/modules/cyclus.ts` (7 min). Geen verdiepingsblok.

---

## DEEL 5: FOOTER-DISCLAIMER

> *Deze module is samengesteld op basis van de kennisbronnen van het Longevity Fit team, waaronder onze gecertificeerde hormoontherapeut opgeleid bij Rieneke Dijkinga. De informatie is bedoeld als algemene voorlichting en vervangt geen medisch advies. Bij hormonale klachten, een bekende aandoening of medicatiegebruik, raadpleeg altijd een arts of gespecialiseerde therapeut. [Lees meer over onze visie](/over#visie)*

---

## DEEL 6: TECHNISCHE SPECS

Categorie `hormonen-en-organen`: `status: 'preview'`. Alleen cyclus `klikbaar: true` met pad. Navigatie: alleen terug naar categorie.

---

## BRON-ATTRIBUTIE

Content samengesteld op basis van de kennisbronnen van het Longevity Fit team, waaronder de gecertificeerde hormoontherapeut opgeleid bij Rieneke Dijkinga. Module-teksten worden letterlijk overgenomen.
