# Cursor-prompt: Algemene Richtlijnen-pagina (v5 — MET MODULE-VERWIJZINGEN, REFERENTIE)

**Status:** REFERENTIE-DOCUMENT, NIET IN GEBRUIK

**Doel:** dit document bewaart de "Lees verder"-verwijzingen naar leermodules. Wanneer de modules zijn gebouwd, kunnen die blokken één voor één worden teruggezet in `cursor-prompt-richtlijnen-v5.md`.

**Werkafspraak:** wijzigingen aan de richtlijnen zelf altijd ook hier doorvoeren, zodat dit document up-to-date blijft.

---

## Per richtlijn: welke module-verwijzingen horen erbij

### Richtlijn 1 — 3 - 4 eetmomenten per dag

```
**Lees verder:**
- [Module Bloedsuiker, insuline en je energie](/leermodules/bloedsuiker)
- [Module Tussendoortjes: trek vs. gewoonte](/leermodules/tussendoortjes)
```

### Richtlijn 2 — Eet niet tot je vol zit

```
**Lees verder:**
- [Module Hoe je eet, niet alleen wat je eet](/leermodules/hoe-je-eet)
```

### Richtlijn 3 — Neem de tijd om te eten

```
**Lees verder:**
- [Module Hoe je eet, niet alleen wat je eet](/leermodules/hoe-je-eet)
```

### Richtlijn 4 — Eet na je avondeten niets meer

```
**Lees verder:**
- [Module De lever en de overgang](/leermodules/lever)
- [Module Fasting voor vrouwen 40+](/leermodules/fasting)
```

### Richtlijn 5 — Train nuchter

```
**Lees verder:**
- [Module Eten rondom training](/leermodules/training)
- [Module Bloedsuiker, insuline en je energie](/leermodules/bloedsuiker)
```

### Richtlijn 6 — Eet een eiwitrijk ontbijt

```
**Lees verder:**
- [Module Eiwitten: dierlijk én plantaardig](/leermodules/eiwitten)
- [Module Bloedsuiker, insuline en je energie](/leermodules/bloedsuiker)
```

### Richtlijn 7 — Beperk koolhydraatrijke maaltijden tot 2 per dag

```
**Lees verder:**
- [Module Koolhydraten: wanneer wel, wanneer minder](/leermodules/koolhydraten)
- [Module Bloedsuiker, insuline en je energie](/leermodules/bloedsuiker)
- [Module Eten rondom training](/leermodules/training)
```

### Richtlijn 8 — Eet per dag 500 gram groenten

```
**Lees verder:**
- [Module De lever en de overgang](/leermodules/lever)
- [Module Darmwandherstel](/leermodules/darmwandherstel)
- [Module Seizoensgebonden eten](/leermodules/seizoen)
```

### Richtlijn 9 — Varieer ontbijt, lunch en diner

```
(Geen specifieke module-verwijzing nodig)
```

### Richtlijn 10 — Kook, stoom of wok groenten kort

```
(Geen specifieke module-verwijzing nodig)
```

### Richtlijn 11 — Eet zo min mogelijk fabrieksmatig bewerkte producten

```
(Geen specifieke module-verwijzing nodig)
```

### Richtlijn 12 — Drink minimaal 1,5 – 2 liter water per dag

```
(Geen specifieke module-verwijzing nodig)
```

### Richtlijn 13 — Drink maximaal 2 koppen koffie per dag

```
**Lees verder:**
- [Module Stress en je lichaam](/leermodules/stress)
```

### Richtlijn 14 — Drink liever geen alcohol

```
**Lees verder:**
- [Module De lever en de overgang](/leermodules/lever)
```

### Richtlijn 15 — Beperk dierlijke zuivel

```
**Lees verder:**
- [Module Zuivel: het hele verhaal](/leermodules/zuivel)
- [Module Plantaardige melk vs. rauwe melk](/leermodules/plantaardige-melk)
```

### Richtlijn 16 — Beperk geraffineerde suiker

```
**Lees verder:**
- [Module Bloedsuiker, insuline en je energie](/leermodules/bloedsuiker)
- [Module Suikervervangers: wat wel, wat niet](/leermodules/suikervervangers)
```

---

## Hoe deze verwijzingen later toevoegen

Wanneer de leermodules zijn gebouwd:

1. Open `cursor-prompt-richtlijnen-v5.md`
2. Voor elke richtlijn waarvoor de bijbehorende module beschikbaar is, plak het "Lees verder"-blok onderaan de uitklap-uitleg
3. Werk ook de data-structuur bij in `src/data/richtlijnen.ts`:

```typescript
interface Richtlijn {
  // bestaande velden...
  gerelateerdeModules?: ModuleLink[];
}

interface ModuleLink {
  titel: string;
  pad: string;
}
```

4. Pas de `RichtlijnKaart`-component aan om `gerelateerdeModules` weer te geven
5. Implementeer een graceful fallback: als een module nog niet bestaat, toon dan "Binnenkort beschikbaar" of laat het blok weg

---

## Mapping per module: welke richtlijnen verwijzen ernaar

Handig overzicht voor wanneer je een module bouwt en wilt weten welke richtlijnen ernaar verwijzen:

| Module | Verwezen vanuit richtlijnen |
|--------|----------------------------|
| Bloedsuiker, insuline en je energie | 1, 5, 6, 7, 16 |
| Tussendoortjes: trek vs. gewoonte | 1 |
| Hoe je eet, niet alleen wat je eet | 2, 3 |
| De lever en de overgang | 4, 8, 14 |
| Fasting voor vrouwen 40+ | 4 |
| Eten rondom training | 5, 7 |
| Eiwitten: dierlijk én plantaardig | 6 |
| Koolhydraten: wanneer wel, wanneer minder | 7 |
| Darmwandherstel | 8 |
| Seizoensgebonden eten | 8 |
| Stress en je lichaam | 13 |
| Zuivel: het hele verhaal | 15 |
| Plantaardige melk vs. rauwe melk | 15 |
| Suikervervangers: wat wel, wat niet | 16 |

Dit overzicht helpt bij prioritering: modules die vaak worden gerefereerd, zoals Bloedsuiker (5x) en De lever (3x), zijn de eerste om te bouwen omdat ze de meeste richtlijnen verrijken.
