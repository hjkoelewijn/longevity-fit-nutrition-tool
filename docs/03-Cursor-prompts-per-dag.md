# Cursor Prompts — Bouwplan per dag

Plak deze prompts één voor één in de Cursor-chat (Cmd+L op Mac, Ctrl+L op Windows) wanneer je aan die dag begint. Cursor leest dan de PRD en filosofie uit `/docs` en bouwt wat er die dag op het programma staat.

**Belangrijke regel voor alle dagen:** check altijd wat Cursor voorstelt voordat je "accept" klikt. Bij twijfel: kom terug naar de Claude-chat en plak wat hij maakt.

---

## Dag 1 — Setup en fundament ✅

```
We gaan vandaag Dag 1 van het bouwplan uitvoeren voor de Longevity Fit voedingstool.

Lees eerst beide documenten in /docs:
- 01-filosofie-systeem-prompt.md
- 02-PRD-hoofddocument.md

Daarna gaan we het volgende doen:

1. Maak een SQL-script dat ik in mijn Supabase SQL Editor kan plakken om alle tabellen uit het datamodel (sectie 7 van het PRD) aan te maken. Voeg ook Row Level Security (RLS) policies toe zodat gebruikers alleen hun eigen data kunnen zien.

2. Installeer de benodigde Supabase packages voor Next.js App Router (@supabase/supabase-js en @supabase/ssr).

3. Maak een Supabase client setup volgens de Next.js App Router best practices (server client, browser client, middleware voor auth).

4. Bouw een simpele login pagina (/login) met magic link authentication. Bij het submitten krijgt de gebruiker een email met een login-link.

5. Bouw een /dashboard pagina die alleen toegankelijk is als de gebruiker is ingelogd. Voor nu een welkomstbericht en een logout-knop.

6. Voeg een middleware toe die niet-ingelogde gebruikers redirect naar /login.

7. Stijl het minimaal maar netjes met Tailwind. Premium-uitstraling met witruimte. Geen drukke kleuren — wel ruimte voor branding later.

Laat me het SQL-script EERST zien zodat ik het kan controleren en in Supabase kan plakken voordat we verder gaan met de code.
```

---

## Dag 2 — Onboarding fase 1, 2 en 3

```
We gaan Dag 2 van het bouwplan uitvoeren: onboarding fase 1, 2 en 3.

Lees /docs/02-PRD-hoofddocument.md sectie 3 (Onboarding) zorgvuldig.

We bouwen een meerstappen onboarding flow op de route /onboarding. Eisen:

1. Maak een onboarding-flow met meerdere schermen die de gebruiker doorloopt na inloggen voor het eerst. De flow moet:
   - Bestaan uit aparte stappen die je kunt navigeren met "Volgende" en "Vorige" knoppen
   - Voortgang opslaan tussen stappen (zodat je niet alles kwijt bent als je tussentijds stopt)
   - Een progress indicator bovenaan tonen
   - Antwoorden opslaan in de `profiles` tabel in Supabase

2. Bouw de schermen voor Fase 1 — Wie ben jij:
   - Naam (tekst)
   - Leeftijd (nummer)
   - Gezinssamenstelling: aantal volwassenen + aantal kinderen + leeftijden kinderen (dynamisch toevoegen per kind)
   - Kookniveau (radio: beginner / gemiddeld / ervaren)
   - Beschikbare kooktijd doordeweeks (radio: 15 min / 30 min / 45+ min)
   - Beschikbare kooktijd weekend (idem)
   - Sportief actief: hoe vaak per week + intensiteit (licht / matig / intensief)

3. Bouw de schermen voor Fase 2 — Hoe eet je nu:
   - Aantal eetmomenten per dag gemiddeld (1-6)
   - Ontbijt-routine (uitgebreid / licht / sla over)
   - Snack-gewoontes (regelmatig / soms / zelden)
   - Hoe vaak buiten de deur eten per week (0-7)
   - Eerlijk-vraag: "Eet je vaak uit gewoonte of uit echte trek?" (vooral gewoonte / vooral trek / gemengd / weet niet)

4. Bouw de schermen voor Fase 3 — Wat past bij jou:
   - Eetstijl (radio): alleseter / flexitariër / pescotariër / vegetariër / veganist / animal-based / anders
   - Allergieën (multi-select): noten, schaaldieren, eieren, soja, vis, gluten (coeliakie), lactose, anders
   - Intoleranties (multi-select): gluten (niet-coeliakie), lactose, peulvruchten, nachtschades, histamine, FODMAP, anders
   - Niet-lekker-lijst (vrije tekst, meerdere items toevoegen)
   - Specifieke dingen om rekening mee te houden (vrije tekst)

5. Belangrijk — onboarding als leerervaring:
   Voeg bij elke vraag een uitklapbare "Waarom vragen we dit?" link toe met een korte uitleg in de Longevity Fit tone of voice (zie filosofie-systeem-prompt). Deze tekst mag voorlopig een placeholder zijn — markeer dat duidelijk in de code zodat ik later de echte teksten kan invullen.

6. Stijl:
   - Premium, rustig, veel witruimte
   - Eén vraag tegelijk waar dat past, geen overweldigende formulieren
   - Tailwind, mobiel-vriendelijk
   - Voortgang-indicator bovenaan ("Stap 3 van 6")

7. Routing:
   - Na inloggen: check of de gebruiker een profiel heeft. Zo nee → redirect naar /onboarding. Zo ja → /dashboard.
   - Na voltooiing van fase 3: redirect naar /onboarding/fase-4 (placeholder voor morgen) of naar /dashboard met melding dat de rest later komt.

Begin met het maken van een plan en de structuur. Laat me weten welke routes je gaat aanmaken voordat je begint met code.
```

---

## Dag 3 — Onboarding fase 4-7 + profielpagina

```
We gaan Dag 3 van het bouwplan uitvoeren: onboarding fase 4 t/m 7 + profielpagina.

Lees /docs/02-PRD-hoofddocument.md sectie 3 (Onboarding) en sectie 4 (Cyclus) en sectie 5 (BalanceTest) zorgvuldig.

We bouwen verder op de bestaande onboarding flow:

1. Bouw de schermen voor Fase 4 — Hoe sta jij in voeding:
   - Hoe nieuw in deze manier van eten? (eerste keer / paar maanden / al jaren)
   - Stoelgang (regelmatig dagelijks / onregelmatig / vaak diarree / vaak verstopping / wisselend)
   - Vaak opgeblazen gevoel? (ja / nee / soms)
   - Bekend darmprobleem? (ja, namelijk... [tekst] / nee / weet niet)
   - Hoe ga je nu om met zuivel? (rauwe melk / volle bio / regulier / plantaardig / vermijd ik / weet niet)
   - Hoe ga je nu om met gluten? (eet ik gewoon / probeer minder / vermijd ik)
   - Koffie? (geen / 1-2 per dag / 3+)
   - Alcohol? (geen / 1-2 per week / 3-5 per week / dagelijks)

2. Bouw de schermen voor Fase 5 — Cyclus (OPTIONEEL — kan worden overgeslagen):
   - Hoofdvraag: cyclisch / onregelmatig perimenopauze / postmenopauze / liever niet zeggen / weet niet
   - Als cyclisch: vraag laatste menstruatie (datepicker) + gemiddelde cycluslengte (nummer, default 28)
   - Skip-knop prominent aanwezig

3. Bouw de schermen voor Fase 6 — Wat is je doel (multi-select):
   - Meer energie
   - Betere slaap
   - Hormonale balans
   - Sterker voelen
   - Stralen / huid en haar
   - Microbioom herstellen
   - Fundament leggen voor de volgende fase
   - Gezond gewicht bereiken
   - Anders (vrije tekst)

4. Bouw de schermen voor Fase 7 — BalanceTest (OPTIONEEL):
   - Hoofdvraag: heb je je Zinzino BalanceTest gedaan? (ja vul nu in / ja later invullen / nee nog niet)
   - Als "ja vul nu in": formulier met alle Zinzino-waarden uit de balance_tests tabel:
     * test_date (datepicker)
     * omega_3_total (numeric)
     * omega_6_total (numeric)
     * omega_ratio (numeric)
     * aa_epa_ratio (numeric)
     * saturated_fat (numeric)
     * monounsaturated (numeric)
     * trans_fat (numeric)
     * individual_fatty_acids (jsonb — bouw 11 invulvelden voor individuele vetzuren)
     * cell_hardness (numeric)
     * mental_strength (numeric)
     * supplements_used (multi-select: BalanceOil, Multi, Vit D3, K2, Magnesium, Vezels, Anders)
   - Disclaimer onderaan: "Deze tool stelt geen diagnose en geeft geen medisch advies. Voor een professionele beoordeling van je vetzurenwaarden raden we een consult aan met een gekwalificeerd voedingsdeskundige."

5. Bouw een /profile pagina:
   - Toont alle profiel-data overzichtelijk
   - Per blok een "Bewerken" knop die naar de juiste onboarding-stap leidt (in edit-mode)
   - In edit-mode: dezelfde formulieren als onboarding maar met "Opslaan" en "Annuleren"
   - BalanceTest-blok kan opnieuw worden ingevuld (nieuwe meting toevoegen, oude bewaren met datum)

6. Na voltooiing van fase 7: redirect naar /dashboard met een welkomstbericht: "Welkom [naam]. We hebben je profiel klaar. Je kunt nu je eerste weekplan maken."

7. "Waarom vragen we dit?" placeholders blijven aanwezig bij elke vraag.

8. Belangrijk: de onboarding moet bij elke fase tussentijds opslaan. Als iemand stopt en later terugkomt, moet ze verder kunnen vanaf waar ze was.

Begin met een korte impactanalyse: welke nieuwe routes komen erbij, welke wijzigingen in bestaande code zijn nodig, hoe gaan we de "kan tussentijds stoppen en doorgaan" logica oplossen?
```

---

## Dag 4 — Modus 1: Mijn Weekplan

```
We gaan Dag 4 van het bouwplan uitvoeren: Modus 1 — Mijn Weekplan.

Lees /docs/02-PRD-hoofddocument.md sectie 2.1 (Modus 1) en /docs/01-filosofie-systeem-prompt.md zorgvuldig.

We gaan het volgende bouwen:

1. Een nieuwe pagina /weekplan met:
   - Bovenaan: knop "Genereer mijn weekplan" (en als er al een actief weekplan is: "Maak een nieuw weekplan")
   - Een datum-selector om de startdatum van de week te kiezen (default: aanstaande maandag)
   - Een optie: hoeveel kookmomenten per week? (3, 5, 7) — beïnvloedt of recepten herhaald worden voor restjes
   - Optie: tussendoortjes ja/nee
   - Klik op "Genereer" → roept een API-route aan die het weekplan genereert via Claude API

2. API-route /api/weekplan/generate:
   - Haalt het profiel van de ingelogde gebruiker op uit Supabase (inclusief allergieën, voorkeuren, eetstijl, gezinssamenstelling, cyclusfase, BalanceTest indien aanwezig)
   - Bepaalt het seizoen op basis van de datum
   - Stuurt een prompt naar Claude API (gebruik @anthropic-ai/sdk) met:
     * Systeem-prompt: de exacte tekst uit /docs/01-filosofie-systeem-prompt.md (laad dit dynamisch uit het bestand)
     * User-prompt: alle profiel-data + verzoek om een weekplan voor 7 dagen, met ontbijt + lunch + diner per dag, geschaald op gezinssamenstelling, met optionele kindertip, en met een boodschappenlijst.
     * Vraag om gestructureerd JSON terug te krijgen (geef het verwachte JSON-schema mee in de prompt)
   - Slaat het gegenereerde weekplan op in de meal_plans tabel
   - Slaat de boodschappenlijst op in shopping_lists tabel
   - Stuurt het resultaat terug naar de frontend

3. Op de weekplan-pagina toon je het gegenereerde plan:
   - Per dag een kaart met de drie maaltijden
   - Klik op een maaltijd → recept-detailpagina met ingrediënten, bereiding, kindertip, kooktijd
   - Optie per maaltijd: "Vervang dit recept" (genereert een alternatief)
   - Optie per maaltijd: "Markeer als gemaakt" (voor eigen tracking)

4. Een /weekplan/boodschappen pagina:
   - Boodschappenlijst gegroepeerd per categorie (groenten, eiwitten, vetten, etc.)
   - Per item: hoeveelheid + checkbox "ik heb dit al in voorraad"
   - Items die "in voorraad" zijn worden doorgestreept maar blijven zichtbaar
   - Knop "Print" en "Deel via WhatsApp" (stuur als platte tekst)

5. AI-output validatie:
   - Controleer dat het weekplan max 4 eetmomenten per dag heeft
   - Controleer dat er max 2 koolhydraatmomenten per dag zijn
   - Controleer dat allergieën niet in ingrediënten voorkomen
   - Bij fout: toon een nette foutmelding en bied "Opnieuw proberen" aan

6. Loading-state: het genereren kan 10-30 seconden duren. Toon een nette loader met statusmeldingen ("Je profiel wordt gelezen...", "Recepten worden geselecteerd...", "Boodschappenlijst wordt gemaakt...").

7. Foutafhandeling: als de API faalt, toon dat netjes en laat de gebruiker opnieuw proberen.

Begin met een plan: welke routes komen erbij, welk JSON-schema verwacht je terug van de AI, hoe ga je de prompt structureren? Laat me het JSON-schema en de prompt-template eerst zien voordat je begint met bouwen.
```

---

## Dag 5 — Modus 2: Wat heb ik in huis

```
We gaan Dag 5 van het bouwplan uitvoeren: Modus 2 — Wat heb ik in huis.

Lees /docs/02-PRD-hoofddocument.md sectie 2.2 (Modus 2) en /docs/01-filosofie-systeem-prompt.md zorgvuldig.

We gaan het volgende bouwen:

1. Een nieuwe pagina /wat-heb-ik-in-huis met een formulier:
   - Voorraad-input: meerdere ingrediënten kunnen invoeren als tags (typ ingrediënt + Enter, blijft staan als tag, x om te verwijderen)
   - Optionele suggestie-lijst van veelvoorkomende voorraadkast-items (knoflook, ui, olijfolie, zout, peper, kruiden) die ze met één klik kunnen toevoegen
   - Type maaltijd: ontbijt / lunch / diner / snack / maakt niet uit
   - Hoeveel personen (default uit profiel)
   - Hoeveel tijd heb je: 15 min / 30 min / 45+ min
   - Knop "Genereer recept"

2. API-route /api/recept/genereer-uit-voorraad:
   - Haalt het profiel op (allergieën, eetstijl, voorkeuren, BalanceTest)
   - Stuurt prompt naar Claude API met:
     * Systeem-prompt: de filosofie-systeem-prompt (uit het bestand)
     * User-prompt: ingrediënten in voorraad + maaltijdtype + tijd + porties + alle profiel-restricties + verzoek om 1-3 receptsuggesties die passen
     * Verwacht gestructureerd JSON terug
   - Geeft de resultaten terug aan de frontend

3. Op de pagina:
   - Toon 1-3 receptkaarten met titel, kooktijd, korte beschrijving
   - Klik op een kaart → expand naar volledig recept (ingrediënten + bereiding + kindertip)
   - Per recept: knoppen "Bewaar in mijn favorieten", "Wat heb ik nog nodig?" (toont ontbrekende kerningrediënten zoals goede vetten of eiwitten als die niet in de voorraad zaten)

4. "Wat heb ik nog nodig?" suggestie:
   - Als de voorraad geen goede vet bevat → suggereer olijfolie / avocado / noten
   - Als de voorraad geen eiwit bevat → suggereer eieren / kip / linzen / kwark
   - Als de voorraad weinig groente bevat → suggereer 2-3 seizoens-groenten
   - Optie: "Voeg toe aan boodschappenlijst" (creëert nieuwe shopping_list of voegt toe aan bestaande)

5. Favorieten:
   - Bewaarde recepten komen in de favorite_recipes tabel
   - Apart pagina /favorieten waar gebruiker haar favorieten ziet

6. Loading + foutafhandeling zoals bij Dag 4.

7. Optie voor admin (jij): bij een gegenereerd recept de knop "Voeg toe aan algemene bibliotheek" — dit slaat het recept op in de recipes tabel met source='ai_curated' (uit te bouwen op Dag 6).

Begin met een plan en laat me het JSON-schema en de prompt-template zien voordat je begint met bouwen.
```

---

## Dag 6 — Modus 3: Receptenbibliotheek + 30 recepten invoeren

```
We gaan Dag 6 van het bouwplan uitvoeren: Modus 3 — Receptenbibliotheek + admin-paneel + recepten invoeren.

Lees /docs/02-PRD-hoofddocument.md sectie 2.3 (Modus 3) zorgvuldig.

We gaan het volgende bouwen:

1. Een /recepten pagina:
   - Lijst-view met receptkaartjes (titel, kooktijd, foto indien aanwezig, tags)
   - Filters bovenin:
     * Maaltijdtype (ontbijt / lunch / diner / snack)
     * Seizoen (lente-zomer / herfst-winter / hele jaar)
     * Eetstijl (alleseter / vegetarisch / veganistisch / etc.)
     * Kooktijd (max 15 min / max 30 min / max 45 min / niet belangrijk)
     * Hoofdingredient (selectievak — toont alle hoofdingrediënten uit de bibliotheek)
   - Zoekbalk: zoek op naam of ingrediënt
   - Klikt op recept → /recepten/[id]

2. /recepten/[id] detailpagina:
   - Naam, foto (indien aanwezig), kooktijd
   - Ingrediëntenlijst met portie-schaler ("voor 2 / 4 / 6 personen") — herberekent grammen
   - Bereidingsstappen
   - Kindertip indien aanwezig
   - Knoppen: "Bewaar in favorieten" en "Voeg toe aan boodschappenlijst"

3. Admin-paneel op /admin (alleen toegankelijk voor admin-users — voor nu hardcoded jouw email):
   - Lijst van alle recepten in de database
   - Knop "Nieuw recept toevoegen"
   - Formulier voor nieuw recept met alle velden uit de recipes tabel:
     * Naam (tekst)
     * Bron (own / ai_curated / external)
     * Maaltijdtype (radio)
     * Seizoen (multi-select)
     * Eetstijl-compatibiliteit (multi-select)
     * Allergenen die in dit recept zitten (multi-select)
     * Tags (vrije tags)
     * Voorbereiding-tijd + kook-tijd in minuten
     * Basis-porties (default 4)
     * Ingrediënten (dynamische lijst: naam + hoeveelheid + eenheid)
     * Bereiding (textarea, markdown)
     * Kindertip (textarea, optioneel)
     * Foto upload (Supabase Storage) — optioneel
     * Filosofie-check checkbox (default true voor own/ai_curated)
   - Bewerken en verwijderen van bestaande recepten

4. Setup van Supabase Storage voor recept-foto's:
   - Bucket `recipe-images` aanmaken (public)
   - Upload-functie in admin formulier
   - Sla URL op in recipes.image_url

5. AI-recept-import functie in admin (optioneel voor vandaag):
   - Tekstvak waar je een receptbeschrijving plakt
   - Knop "Parseer en voeg toe": Claude API zet de tekst om in gestructureerd recept-format dat het admin-formulier vult, klaar om te bewerken en op te slaan

6. Eerste 30 recepten invoeren:
   - Selecteer 30 recepten uit de bestaande Longevity Fit ebooks (mix van ontbijt, lunch, diner, snack, soepen, salades)
   - Voer ze in via het admin-formulier
   - Voor recepten zonder foto: laat image_url leeg, recept werkt nog steeds
   - Tag elk recept correct met seizoen, eetstijl, allergenen

Begin met punt 1, 2 en 3 (de basis-bibliotheek + admin). Punt 5 (AI-import) en punt 6 (30 recepten invoeren) zijn voor de namiddag of overloop naar morgen als nodig.
```

---

## Dag 7 — Leermodules + polishing + testen

```
We gaan Dag 7 van het bouwplan uitvoeren: Leermodules + polishing + testen voor launch.

Lees /docs/02-PRD-hoofddocument.md sectie 6 (Leermodules) zorgvuldig.

We gaan het volgende bouwen:

1. Een /leren pagina:
   - Overzicht van alle leermodules (uit learning_modules tabel)
   - Gegroepeerd per categorie
   - Per module: titel, korte intro (eerste 1-2 zinnen), "lees meer" link
   - Voltooide modules krijgen een vinkje
   - Voortgang bovenaan: "Je hebt X van Y modules gelezen"

2. /leren/[slug] detailpagina:
   - Titel + content (markdown gerenderd)
   - "Markeer als gelezen" knop (slaat op in module_completions)
   - Aan het einde: links naar gerelateerde modules
   - Mobile-vriendelijk, prettig leesbaar (max 70 tekens per regel, goede line-height)

3. Eerste 7 modules schrijven (basics):
   - Module 1: Waarom max 4 eetmomenten?
   - Module 2: Koolhydraten: wanneer wel, wanneer minder
   - Module 3: Goede vetten en de omega 3/6 balans
   - Module 4: Eiwitten: dierlijk én plantaardig
   - Module 5: Zuivel: het hele verhaal
   - Module 6: Plantaardige melk vs. rauwe melk
   - Module 20: Darmwandherstel: waarom je je in begin niet meteen beter voelt

   Schrijf deze in de Longevity Fit tone of voice (zie filosofie-systeem-prompt). Elk module 1-2 pagina's tekst.

4. "Waarom vragen we dit?" placeholders in onboarding koppelen aan deze modules waar relevant. Bijvoorbeeld:
   - Onboarding-vraag over eetmomenten → link naar Module 1
   - Onboarding-vraag over koolhydraten → link naar Module 2
   - Onboarding-vraag over zuivel → link naar Module 5

5. Polishing pas:
   - Check alle pagina's op mobiele weergave
   - Check dat alle foutmeldingen netjes zijn
   - Check dat alle loading-states een nette loader tonen
   - Check dat alle formulieren validatie hebben
   - Check dat de logout-knop overal werkt

6. Smoke test scenario:
   - Maak een testaccount aan (eigen tweede email)
   - Doorloop de complete onboarding
   - Genereer een weekplan
   - Probeer "wat heb ik in huis"
   - Bekijk receptenbibliotheek
   - Lees een leermodule
   - Log uit en weer in

   Documenteer alle bugs die je vindt en fix de kritieke.

7. Klaar voor de launch:
   - Stuur 8-10 deelnemers een welkom-email met de link naar de tool
   - Geef heldere uitleg dat dit een eerste versie is en feedback welkom is
   - Klaar om te lanceren

Begin met de leermodules-pagina's (punt 1 en 2). Daarna de eerste 7 modules schrijven. Daarna de koppelingen + polishing + testen.
```

---

## Algemene tips bij elke dag

- **Begin altijd met "lees de docs eerst"** — Cursor weet dan de context.
- **Vraag om een plan voordat hij begint te bouwen** — bespaart herwerken.
- **Test elk onderdeel meteen na het bouwen** in de browser, niet pas op vrijdag.
- **Commit naar GitHub elke avond** — dan kun je altijd terug naar wat werkte.
- **Bij vastlopen: neem een pauze, vraag het hier in de chat.**
- **Niet alle dagen halen kan ook** — beter een goede Dag 4 in 2 dagen dan een halfslachtige in één.

---

**Einde document.**