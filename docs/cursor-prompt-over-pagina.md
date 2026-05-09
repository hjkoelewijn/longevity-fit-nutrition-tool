# Cursor-prompt: Over-pagina met Onze visie

**Doel:** maak een Over-pagina in de Longevity Fit voedingstool met Onze visie als eerste sectie. De pagina is opgezet zodat er later eenvoudig extra secties bij kunnen (Het team, Onze partners, Disclaimer).

---

## INSTRUCTIE VOOR CURSOR — BESTAND OPSLAAN

Sla dit document op in het project:

```
/docs/over/cursor-prompt-over-pagina.md
```

---

## Plek in de tool

**Hoofdmenu:** "Over" (onderaan in het navigatiemenu of in het instellingen-/profielmenu)

**URL:** `/over`

**Anchor-link voor visie:** `/over#visie` (zodat de richtlijnen-disclaimer hierheen kan verwijzen)

**Cross-links naar deze pagina:**
- Footer-disclaimer onderaan elke leermodule (link "[Lees meer over onze visie](/over#visie)")
- Footer-disclaimer onderaan de richtlijnen-pagina
- Footer-disclaimer onderaan de BalanceTest-uitslagpagina
- Onboarding-laatste-stap (optionele "Lees onze visie")

---

## Pagina-structuur

De pagina is opgebouwd uit secties die nu of later ingevuld kunnen worden. Voor v1 alleen "Onze visie" actief, andere secties krijgen een placeholder die later wordt ingevuld.

**Secties (in volgorde):**

1. **Onze visie** (actief in v1)
2. **Het team** (placeholder, later in te vullen)
3. **Onze partners** (placeholder, later in te vullen)
4. **Disclaimer** (placeholder, later in te vullen)

Elke sectie heeft een anchor-link zodat directe links mogelijk zijn:
- `/over#visie`
- `/over#team`
- `/over#partners`
- `/over#disclaimer`

---

## Sectie 1: Onze visie

**Sectie-titel:** Onze visie

**Sectie-subtitel:** Voeding voor 40+ vrouwen, wetenschappelijk onderbouwd en menselijk leefbaar

### Volledige content

**Wie wij zijn**

Wij zijn Heidy en Christina, oprichters van Longevity Fit. Wij geloven dat de tweede helft van je leven de beste mag worden. Krachtiger, sterker, helderder. Niet door harder je best te doen, maar door je lichaam te geven wat het in deze fase nodig heeft.

Achter ons staat een team dat dezelfde visie deelt. Margreet, longevity-expert, begeleidt onze deelnemers bij hun longevity-testen. Onze hormoontherapeut is opgeleid bij Rieneke Dijkinga en houdt onze inzichten inhoudelijk scherp.

**Waar onze visie op rust**

Onze aanpak combineert drie kennis-velden:

**Orthomoleculaire voedingsleer**

De wetenschap die kijkt naar wat het lichaam op celniveau nodig heeft om optimaal te functioneren. Niet alleen "voldoende" voeding, maar de juiste voedingsstoffen in de juiste hoeveelheden. Wij zijn geinspireerd door het werk van Rieneke Dijkinga, een Nederlandse autoriteit op het gebied van orthomoleculaire voeding en de hormonale gezondheid van vrouwen.

**Functionele geneeskunde**

Een benadering die het hele systeem ziet, niet alleen losse symptomen. Waarom heb je last van vermoeidheid? Wat speelt er met je hormonen, je darm, je lever, je stress-systeem? Hoe werken die op elkaar in? Functionele geneeskunde zoekt naar oorzaken, niet naar symptoom-onderdrukking. Het werk van Dr. Collin Robertson op dit gebied is een belangrijke inspiratiebron voor ons.

**Pharmaconutrition**

De wetenschap dat voeding kan werken zoals medicijnen werken. Bepaalde voedingsstoffen kunnen ontstekingen dempen, hormonen ondersteunen, herstel versnellen. Op het gebied van chronische ontsteking en de rol van voeding daarin laten wij ons inspireren door het werk van Dr. Paul Clayton, biochemicus en wetenschappelijk onderzoeker.

Daarnaast verwerken wij in onze tool de klinische en praktische ervaring van ons team. Bijna 30 jaar ervaring van Christina in de fitnessbranche (ex-Nike Master Trainer), ervaringsdeskundigheid van Heidy en 8 jaar Studio C Online. Samen hebben we met duizenden 40+ vrouwen gewerkt. Die praktijkkennis vertalen we naar dagelijkse keuzes die haalbaar zijn voor vrouwen met weinig tijd, hoge standaarden en een vol leven.

**Wat dat in de praktijk betekent**

- We focussen op voeding die je lichaam echt voedt, in plaats van calorieën tellen.
- We helpen je bewust kiezen wat voor jou werkt, zonder onnodig veel te schrappen.
- We bouwen aan een stevig fundament dat je op lange termijn kunt volhouden.
- We kiezen voor consistentie en keuzes die passen bij je echte leven.

**Wat de tool wel en niet is**

Deze voedingstool is jouw dagelijkse hulp bij eten. Recepten, weekmenu's, boodschappenlijsten, en uitleg over wat voeding doet in je lichaam.

Het is geen vervanging van medisch advies. Heb je hormonale klachten, een bekende aandoening, gebruik je medicatie, of twijfel je over iets, raadpleeg dan altijd een arts of therapeut. Binnen ons netwerk zijn ook hormoontherapeut Liane en Margreet (orthomoleculair adviseur en stress counselor) beschikbaar voor verdiepende vragen. Margreet biedt daarnaast een 1-op-1 consult van een uur, waar deelnemers vaak veel aan hebben. Gaat het om diepere problematiek waarvoor meerdere 1-op-1 sessies nodig zijn, dan kijken we samen naar een passende follow-up via een apart traject.

**Tot slot**

Wij maken de beste tool voor 40+ vrouwen met weinig tijd, hoge standaarden en die klaar zijn voor de beste helft van hun leven. Doordacht en ontwikkeld om elke dag te gebruiken.

Welkom in Longevity Fit.

Heidy en Christina

---

## Sectie 2: Het team (placeholder)

**Status in v1:** placeholder, niet zichtbaar of met "Binnenkort meer over ons team" tekst.

Wanneer je deze sectie later invult, komen hier korte profielen van:
- Heidy en Christina (oprichters)
- Margreet (longevity-expert, BalanceTest-begeleiding)
- Hormoontherapeut (opgeleid bij Rieneke Dijkinga)

---

## Sectie 3: Onze partners (placeholder)

**Status in v1:** placeholder, eventueel met de huidige partner-info uit de visie-sectie verplaatst hier naartoe als de pagina te lang wordt.

Later uitbreiden met:
- Logo en korte beschrijving Zinzino + BalanceTest
- Logo en korte beschrijving Vlees van Ons
- Toekomstige partners

---

## Sectie 4: Disclaimer (placeholder)

**Status in v1:** placeholder, later vullen met de juridische disclaimer.

Later uitbreiden met:
- Medische disclaimer
- Privacyverwijzing
- Aansprakelijkheid
- Eventuele juridische tekst

---

## Technische specs voor Cursor

### Pagina-route

```
/over
```

### Component-naam

```
OverPagina
```

### UI-structuur

```jsx
<OverPagina>
  <PaginaHeader 
    titel="Over Longevity Fit"
  />
  
  <SectieNavigatie>
    {/* Optionele anchor-navigatie bovenaan met links naar de secties */}
    <a href="#visie">Onze visie</a>
    {/* Andere links worden later toegevoegd als de secties actief zijn */}
  </SectieNavigatie>
  
  <OverSectie id="visie" titel="Onze visie" subtitel="Voeding voor 40+ vrouwen...">
    {/* Volledige visie-content */}
  </OverSectie>
  
  <OverSectie id="team" titel="Het team" placeholder>
    {/* Placeholder of niet zichtbaar in v1 */}
  </OverSectie>
  
  <OverSectie id="partners" titel="Onze partners" placeholder>
    {/* Placeholder of niet zichtbaar in v1 */}
  </OverSectie>
  
  <OverSectie id="disclaimer" titel="Disclaimer" placeholder>
    {/* Placeholder of niet zichtbaar in v1 */}
  </OverSectie>
</OverPagina>
```

### Data-structuur

```typescript
interface OverSectie {
  id: string;
  titel: string;
  subtitel?: string;
  content?: React.ReactNode;
  placeholder?: boolean;
  zichtbaar: boolean;
}

const overSecties: OverSectie[] = [
  {
    id: 'visie',
    titel: 'Onze visie',
    subtitel: 'Voeding voor 40+ vrouwen, wetenschappelijk onderbouwd en menselijk leefbaar',
    content: <VisieContent />,
    zichtbaar: true,
  },
  {
    id: 'team',
    titel: 'Het team',
    placeholder: true,
    zichtbaar: false, // in v1 niet tonen
  },
  // etc.
];
```

### Stijling (volgens huisstijl)

- Achtergrond: `#FAF7F2`
- Sectie-titels: Cormorant of Playfair, 32px italic, kleur `#2A2520`, ruim spaced
- Subtitels: Cormorant 20px italic, lichte kleur
- Body-tekst: Work Sans 16px regular, kleur `#2A2520`, line-height 1.7 (iets ruimer dan elders, voor leesbaarheid van langere tekst)
- Subkoppen binnen visie ("Wie wij zijn", "Waar onze visie op rust", etc.): Work Sans 20px semibold
- Sub-subkoppen ("Orthomoleculaire voedingsleer", etc.): Work Sans 17px semibold, kleur goud `#D4AF37`
- Bullet-icoon (✓): goud `#D4AF37`
- Citaat onderaan ("*Heidy en Christina*"): Cormorant italic, 18px, gecentreerd

### Layout

- Maximale leesbreedte: 680px (smaller dan de richtlijnen-pagina, voor langere lopende tekst)
- Ruime witregels tussen secties
- Op mobiel: full-width met goede padding

### Interactie

- Anchor-links bovenaan navigeren met smooth-scroll naar de secties
- Sectie-titels hebben een visuele scheiding (lijntje of extra witruimte)
- Lezen-flow is van boven naar beneden, geen accordion-uitklap (in tegenstelling tot de richtlijnen)

---

## Implementatie-stappen voor Cursor

1. Sla dit document op in `/docs/over/cursor-prompt-over-pagina.md`
2. Maak `src/pages/Over.tsx`
3. Maak `src/data/overContent.ts` met de visie-content als typed structuur
4. Maak component `src/components/OverSectie.tsx` met optionele placeholder-modus
5. Voeg route toe: `/over`
6. Voeg link toe aan hoofdnavigatie of profielmenu (afhankelijk van design)
7. Verifieer dat anchor-links werken: `/over#visie` springt direct naar de visie-sectie
8. Update de footer-disclaimer in alle leermodules en de richtlijnen-pagina:

   Vervang in de disclaimer:
   ```
   [Lees meer over onze visie](/onze-visie)
   ```
   Door:
   ```
   [Lees meer over onze visie](/over#visie)
   ```

9. Test op mobiel (vooral leesbaarheid lange tekst)
10. Voeg analytics-event toe op het bezoeken van de Over-pagina

---

## Werkafspraak voor toekomstige uitbreidingen

Wanneer een placeholder-sectie wordt geactiveerd:

1. Schrijf de content (in dezelfde tone of voice als de visie-sectie)
2. Update `overContent.ts` met de nieuwe sectie-content en zet `zichtbaar: true`
3. Voeg de anchor-link toe aan de SectieNavigatie bovenaan
4. Test of de pagina niet te lang wordt; zo ja, splits dan op naar aparte pagina's:
   - `/over/team`
   - `/over/partners`
   - `/over/disclaimer`
5. Pas de cross-links in andere disclaimers aan als de URL verandert

---

## Bron

De visie-tekst is samengesteld door Heidy en Christina, met inhoudelijke afstemming met de gecertificeerde hormoontherapeut van het Longevity Fit team (opgeleid bij Rieneke Dijkinga).
