# Cursor-prompt: Categorie "Hoe je eet en leeft": alle 6 modules compleet

**Doel:** de categorie "Hoe je eet en leeft" volledig live zetten in de kennisbank van de Longevity Fit voedingstool. Alle zes modules zijn afgerond en worden toegevoegd. De categorie gaat van status 'preview' naar 'actief'.

**Context:** dit bouwt voort op de eerder gebouwde kennisbank-structuur. De eerste twee modules (tussendoortjes en hoe-je-eet) zijn al als data klaargezet. Dit document is de definitieve versie voor de categorie "Hoe je eet en leeft". Verander niets aan "De basis" of "Wat gebeurt er in je 40+ lichaam?".

**Status implementatie:** voltooid. Moduleteksten staan in `src/data/modules/`. Routes onder `app/kennisbank/hoe-je-eet-en-leeft/`.

---

## DEEL 1: STATUS EN VOLGORDE

De categorie "Hoe je eet en leeft" heeft status `'actief'`. De categorie-kaart op `/kennisbank` is klikbaar en leidt naar `/kennisbank/hoe-je-eet-en-leeft`.

Definitieve volgorde:

1. Tussendoortjes: trek vs. gewoonte (id: tussendoortjes)
2. Hoe je eet, niet alleen wat je eet (id: hoe-je-eet)
3. Stress en je lichaam (id: stress)
4. Fasting voor vrouwen 40+ (id: fasting)
5. Alcohol en je hormonen (id: alcohol)
6. Etentjes en sociale events (id: etentjes)

Alle zes modules: `zichtbaar: true`.

---

## DEEL 2: PAGINA-ROUTES

```
/kennisbank/hoe-je-eet-en-leeft                          → categorie-tussenpagina
/kennisbank/hoe-je-eet-en-leeft/tussendoortjes           → module 1
/kennisbank/hoe-je-eet-en-leeft/hoe-je-eet               → module 2
/kennisbank/hoe-je-eet-en-leeft/stress                   → module 3
/kennisbank/hoe-je-eet-en-leeft/fasting                  → module 4
/kennisbank/hoe-je-eet-en-leeft/alcohol                  → module 5
/kennisbank/hoe-je-eet-en-leeft/etentjes                 → module 6
```

---

## DEEL 3: INTERNE VERWIJZINGEN

Goud accent (#D4AF37 / `#9C7A22` in UI), subtiel:

**Module 1 (Tussendoortjes):**
- "de modules over eetmomenten en bloedsuiker" → `/kennisbank/de-basis/eetmomenten` en `/kennisbank/de-basis/bloedsuiker`
- "de achtbaan uit de bloedsuiker-module" → `/kennisbank/de-basis/bloedsuiker`
- "In de eiwitten-module vind je daar een uitgebreidere lijst van" → `/kennisbank/de-basis/eiwitten`

**Module 2 (Hoe je eet):**
- "In de bloedsuiker-module lees je meer over waarom die rustige bloedsuiker zoveel voor je doet" → `/kennisbank/de-basis/bloedsuiker`

**Module 3 (Stress):**
- "zoals je in de bloedsuiker-module las" → `/kennisbank/de-basis/bloedsuiker`
- "hoe je eet, uit de vorige module" → `/kennisbank/hoe-je-eet-en-leeft/hoe-je-eet`
- "we gaan daar in de alcohol-module dieper op in" → `/kennisbank/hoe-je-eet-en-leeft/alcohol`

**Module 4 (Fasting):**
- "Zoals je in de bloedsuiker-module las" → `/kennisbank/de-basis/bloedsuiker`
- "precies wat je in de stress-module las" → `/kennisbank/hoe-je-eet-en-leeft/stress`
- "zoals wij adviseren" bij nuchter trainen → `/kennisbank/de-basis/eetmomenten`

**Module 5 (Alcohol):**
- "precies de klachten die je in de bloedsuiker-module las" → `/kennisbank/de-basis/bloedsuiker` *(alleen indien aanwezig in definitieve tekst)*

**Module 6 (Etentjes):**
- "zoals de eetvolgorde-module beschrijft" → `/kennisbank/hoe-je-eet-en-leeft/hoe-je-eet`

---

## DEEL 4: MODULE-CONTENT

Volledige teksten staan letterlijk in:

- `src/data/modules/tussendoortjes.ts` (5 min)
- `src/data/modules/hoe-je-eet.ts` (5 min)
- `src/data/modules/stress.ts` (6 min)
- `src/data/modules/fasting.ts` (6 min)
- `src/data/modules/alcohol.ts` (5 min)
- `src/data/modules/etentjes.ts` (5 min)

Geen verdiepingsblokken bij deze categorie.

---

## DEEL 5: FOOTER-DISCLAIMER

Onder elke module dezelfde footer-disclaimer als bij "De basis":

> *Deze module is samengesteld door de gecertificeerde hormoontherapeut van het Longevity Fit team, opgeleid bij Rieneke Dijkinga. De informatie is bedoeld als algemene voorlichting en vervangt geen medisch advies. Bij hormonale klachten, een bekende aandoening of medicatiegebruik, raadpleeg altijd een arts of gespecialiseerde therapeut. [Lees meer over onze visie](/over#visie)*

---

## DEEL 6: TECHNISCHE SPECS

### Data-structuur `src/data/kennisbank.ts`

Categorie `hoe-je-eet-en-leeft`: `status: 'actief'`, alle zes modules `klikbaar: true` met paden.

### Navigatie onderaan elke module

Terug naar categorie-pagina; link naar volgende module in vaste volgorde. Module 6 (etentjes) alleen terug-link.

### Stijling

Identiek aan "De basis": achtergrond #FAF7F2, Cormorant italic koppen, Work Sans body 16px/1.7, leesbreedte 680px, goud accent, sand-box #E8DCC8 voor "Tot slot"-blok.

---

## BRON-ATTRIBUTIE

Alle module-content is samengesteld door de gecertificeerde hormoontherapeut van het Longevity Fit team, opgeleid bij Rieneke Dijkinga. Teksten zijn definitief en worden letterlijk overgenomen.
