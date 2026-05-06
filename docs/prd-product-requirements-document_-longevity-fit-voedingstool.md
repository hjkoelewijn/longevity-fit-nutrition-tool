# Product Requirements Document: Longevity Fit Voedingstool

## Introduction/Overview
Een voedingstool voor vrouwen 40+ die meer is dan een receptenapp. De tool helpt deelnemers van het Longevity Fit programma om gezond en hormoonproof te eten in een druk gezinsleven, zonder stress over macro's of calorieën. Het kernprincipe: de tool maakt het makkelijker om naar je lichaam te leren luisteren — niet om je lichaam te outsourcen aan een app.

## Goals
1. Deelnemers van het 8-weken Longevity Fit programma voorzien van gepersonaliseerde weekmenu's
2. AI-gedreven receptgeneratie op basis van voorraad en voorkeuren
3. Integratie van Zinzino BalanceTest voor voedingsfocus
4. Cyclus-bewuste voedingsadviezen voor vrouwen 40+
5. Educatie via 22 leermodules over Longevity Fit filosofie
6. Gezinsvriendelijke recepten met kindertips en portie-schaling

## User Stories
1. Als een 45-jarige moeder wil ik een weekmenu genereren op basis van mijn gezinssamenstelling en BalanceTest-waarden, zodat ik hormoonproof kan eten zonder stress.
2. Als een drukke vrouw wil ik recepten kunnen maken met wat ik in huis heb, zodat ik niet extra hoef te winkelen.
3. Als iemand die nieuw is met deze eetwijze wil ik begeleiding en uitleg bij elke keuze, zodat ik leer luisteren naar mijn lichaam.
4. Als een cyclische vrouw wil ik dat mijn voedingsadvies aanpast aan mijn menstruatiefase, zodat ik optimaal ondersteund word.
5. Als een gebruiker wil ik toegang tot een bibliotheek met filosofie-goedgekeurde recepten, zodat ik kan variëren.

## Functional Requirements

### Core Features
1. Het systeem moet gebruikers kunnen registreren en authenticeren via Supabase Auth
2. Het systeem moet een 7-fase onboarding uitvoeren die profiel, voorkeuren, cyclus en BalanceTest-waarden vastlegt
3. Het systeem moet gepersonaliseerde 7-daagse weekmenu's genereren via Claude AI op basis van gebruikersprofiel
4. Het systeem moet recepten genereren op basis van gebruiker-opgegeven voorraad
5. Het systeem moet een doorzoekbare receptenbibliotheek bieden met filters op maaltijdtype, seizoen, eetstijl
6. Het systeem moet boodschappenlijsten genereren uit weekmenu's met voorraad-aftrekmogelijkheid
7. Het systeem moet 22 leermodules hosten over Longevity Fit voedingsfilosofie

### AI & Philosophy Integration
8. Het systeem moet alle AI-generaties filteren door de Longevity Fit filosofie-prompt (max 4 eetmomenten, 1-2 koolhydraatmomenten, etc.)
9. Het systeem moet voedingsfocus aanpassen op basis van BalanceTest omega-3/6 waarden
10. Het systeem moet cyclus-specifieke voedingsadviezen geven (folliculair/ovulatie/luteaal/perimenopauze/postmenopauze)
11. Het systeem moet seizoensgebonden ingrediënten prioriteren in receptgeneratie

### User Experience
12. Het systeem moet recepten kunnen schalen voor verschillende gezinsgroottes (2-6 personen)
13. Het systeem moet kindertips tonen bij gezinsvriendelijke diners
14. Het systeem moet individuele maaltijden in weekmenu's kunnen vervangen
15. Het systeem moet favoriete recepten kunnen opslaan per gebruiker
16. Het systeem moet vooruitgang bijhouden van gelezen leermodules

### Data Management
17. Het systeem moet alle Zinzino BalanceTest-waarden kunnen opslaan en historiek bijhouden
18. Het systeem moet gebruikersprofielen volledig bewerkbaar maken
19. Het systeem moet gebruikersfeedback verzamelen op AI-gegenereerde recepten
20. Het systeem moet admin-functionaliteit bieden voor handmatig recepten toevoegen

### Privacy & Security
21. Het systeem moet AVG-compliant zijn voor verwerking van gezondheidsdata
22. Het systeem moet data-export en -verwijdering functionaliteit bieden
23. Het systeem moet gevoelige data encrypten at rest

### Performance & Reliability
24. Het systeem moet fallback-recepten tonen bij AI API-failures
25. Het systeem moet optimistische UI updates tonen tijdens AI-generatie
26. Het systeem moet veelgebruikte AI-antwoorden cachen
27. Het systeem moet error tracking en monitoring implementeren

## Non-Goals (Out of Scope)
1. Calorie of macro-tracking in getallen
2. Bestelintegratie met supermarkten (fase 2)
3. Mobile app (web-responsive is voldoende)
4. Vleesvanons.nl integratie (fase 2)
5. Dagelijkse check-ins of reflecties (fase 2)
6. Community features (fase 3+)
7. Whitelabel-architectuur (fase 2)
8. Medische diagnoses of claims

## Design Considerations
- Longevity Fit huisstijl kleuren en typografie
- Responsive design voor desktop en mobile browsers
- Gebruik van shadcn/ui componenten met Tailwind CSS
- Duidelijke "Waarom vragen we dit?" micro-uitleg in onboarding
- Skeleton loading states tijdens AI-generatie
- Intuïtieve navigatie tussen de 3 hoofdmodi

## Technical Considerations
- Next.js 14+ met App Router voor frontend en API routes
- Supabase voor database, auth en real-time features
- Anthropic Claude API voor receptgeneratie en weekmenu's
- Vercel voor hosting en deployment
- Row-level security voor gebruikersdata isolatie
- EU data hosting voor AVG compliance

## Success Metrics
1. 8-10 deelnemers kunnen succesvol onboarden in week 1
2. Gemiddeld 3+ tool-gebruiken per week per deelnemer
3. 90%+ tevredenheid met AI-gegenereerde recepten (thumbs up/down)
4. Minder dan 5% AI API failure rate met succesvolle fallbacks
5. Alle 30 basis-recepten beschikbaar in bibliotheek bij launch
6. 5+ leermodules beschikbaar en toegankelijk bij launch

## Open Questions
1. Hoe vaak mogen gebruikers BalanceTest-waarden updaten?
2. Moeten we notificaties implementeren voor weekmenu-generatie?
3. Hoe gaan we om met seizoenstransities in menu-suggesties?
4. Wat is de ideale cache-tijd voor AI-gegenereerde content?
5. Hoe modereren we user-generated recepten die in de bibliotheek komen?