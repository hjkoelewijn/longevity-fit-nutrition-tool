# Cursor-prompt: Kennisbank + Hormonen — REFERENTIE met uitklap-blokken (v3)

**Status:** REFERENTIE-DOCUMENT, NIET IN GEBRUIK

**Doel:** dit document bewaart de 8 uitklap-blokken die later toegevoegd kunnen worden aan de hormonen-module. Wanneer we besluiten de verdieping toe te voegen, kunnen die blokken één voor één worden teruggezet onder de basis-tekst.

**Werkafspraak:** wijzigingen aan de basis-tekst altijd ook in dit document doorvoeren, zodat de referentie up-to-date blijft.

---

## Hoe te gebruiken

Deze uitklap-blokken horen onder de basis-tekst van de hormonen-module. Ze worden gepresenteerd als accordion-elementen waar de gebruiker per onderwerp meer kan lezen.

Plek in de actieve module: na het "Tot slot"-blok, vóór de footer-disclaimer.

---

## Aanpassingen aan de actieve module wanneer uitklap toegevoegd wordt

1. Pas de leestijd-aanduiding aan: `4 minuten basis | 10 minuten volledig`
2. Voeg een tussenkop toe: "Verdieping per onderwerp"
3. Sectie-intro voor de uitklap: "Wil je over een specifiek onderwerp meer weten? Klik dan het bijbehorende blok open."
4. Update de data-structuur:

```typescript
interface Leermodule {
  // bestaande velden...
  uitklapBlokken?: UitklapBlok[];
  leestijd_basis_minuten: number;
  leestijd_volledig_minuten: number;
}

interface UitklapBlok {
  id: string;
  titel: string;
  korteOmschrijving?: string;
  content: string;
}
```

5. Maak component `src/components/LeermoduleUitklapBlok.tsx`
6. Voeg anchor-link ondersteuning toe: `/kennisbank/40plus-lichaam/hormonen#slecht-slapen` opent automatisch dat blok

---

## DE 8 UITKLAP-BLOKKEN

### Uitklap 1: Hoe je menstruatiecyclus eigenlijk werkt

Voor wie wil begrijpen wat er normaal gesproken in een cyclus gebeurt voordat we kijken naar wat er verandert.

Je menstruatiecyclus start op de eerste dag van je menstruatie en eindigt de dag voor je volgende menstruatie. Hij wordt aangestuurd door verschillende hormonen.

Onder invloed van het hormoon FSH (Follikel Stimulerend Hormoon) ontwikkelt een eiblaasje zich tot een rijpe eicel, en wordt de aanmaak van oestrogeen gestimuleerd.

In de **eerste fase** van je cyclus heeft oestrogeen de overhand. Dit hormoon zorgt dat je je energiek voelt, beter met stress kunt omgaan en lekker in je vel zit.

Rond de 14e dag voor de menstruatie volgt de eisprong. Het follikel barst en het eitje zwemt door de eileiders richting de baarmoeder, klaar om bevrucht te worden. Het velletje waar het ei uitkomt, wordt het "gele lichaam" genoemd. Uit dit gele lichaam wordt het hormoon progesteron gevormd.

In de **tweede fase** van je cyclus heeft progesteron de overhand. Onder invloed van progesteron bereidt je lichaam zich voor op een eventuele zwangerschap. Het baarmoederslijmvlies wordt gerijpt. Je voelt meer behoefte aan rust en lekker chillen op de bank.

Als er na een week geen bevruchting plaatsvindt, daalt het progesterongehalte en het laatste beetje oestrogeen. Oestrogeen laag, progesteron laag. En wat ook daalt: je humeur. Je lontje wordt korter en je gaat slechter slapen. De menstruatie start. Deze cyclus herhaalt zich je hele vruchtbare leven.

Wanneer het samenspel tussen alle hormonen goed is, ervaar je nauwelijks klachten tijdens je cyclus. Stress, slechte leefstijl, overgewicht, extreem sporten of ziekte kunnen je cyclus negatief beïnvloeden, waardoor PMS-klachten (premenstrueel syndroom) kunnen ontstaan: pijnlijke borsten, lage rugpijn, gewrichtspijn, hoofdpijn, opgeblazen gevoel, gewichtstoename, moodswings, somber, prikkelbaar, vermoeid.

### Uitklap 2: De drie fases van de overgang

We kennen drie fases:

**Premenopauze (rond 35-45 jaar):** de eerste subtiele schommelingen. Je merkt soms iets, maar nog niet structureel.

**Perimenopauze (rond 40-55 jaar):** de echte overgangsfase. Hormonen schommelen heftig, klachten worden duidelijker. Deze fase kan 5 tot 10 jaar duren. De gemiddelde leeftijd waarop vrouwen meer klachten ervaren is rond de 45 jaar.

**Postmenopauze (vanaf je laatste menstruatie + 1 jaar):** je lichaam heeft zich ingesteld op een nieuwe baseline met lagere hormoonwaarden.

De meeste vrouwen die in Longevity Fit komen, zitten in de premenopauze of perimenopauze. Daar is de meeste winst te halen.

**Belangrijk:** laat altijd uitsluiten of jouw klachten geen andere oorzaak hebben dan de premenopauze. Bezoek bij twijfel je huisarts of een hormoontherapeut.

### Uitklap 3: Slecht slapen, hoe komt dat?

Door de afname van progesteron, het hormoon dat een kalmerende werking heeft, treden er slaapstoornissen op. Je wordt vaker wakker en hebt moeite met doorslapen.

Daarnaast worden we vanaf onze 40e stressgevoeliger, waardoor in de nachtelijke uurtjes heel wat gepiekerd wordt. En niet te vergeten het nachtelijk zweten dat je wakker kan houden.

**Wat helpt:**
- Eet eiwitrijk en zorg voor stabiele bloedsuiker overdag, dat houdt je 's nachts rustiger
- Stop met alcohol of beperk dit echt heel sterk, alcohol verstoort je slaap zelfs als je sneller in slaap valt
- Eet minimaal 3 uur voor het slapen je laatste maaltijd
- Magnesium kan helpen, vooral magnesiumbisglycinaat 's avonds
- Voldoende vitamine D en omega 3 ondersteunen je hele systeem

### Uitklap 4: Spier- en gewrichtspijn

Door de afname van oestrogeen wordt er minder collageen aangemaakt. Collageen zorgt voor soepele spieren, banden, pezen en huid. Hierdoor krijg je eerder klachten aan spieren en gewrichten.

Daarnaast worden vrouwen vanaf hun 40e stressgevoeliger. Dat resulteert in een toename van spierspanning, wat de pijn verergert.

**Wat helpt:**
- Eiwit bij elke maaltijd voor de aanmaak van collageen en het behoud van je spieren
- Kracht- en weerstandstraining is in deze fase niet optioneel meer, het is essentieel
- Goede omega 3-balans dempt ontstekingen
- Voldoende rust en ontspanning, niet alleen sporten

### Uitklap 5: Botontkalking

Oestrogeen is verantwoordelijk voor de aanmaak van bot. Weinig oestrogeen leidt tot botontkalking, oftewel broze botten.

Vitamine D en sporten zijn belangrijk om botontkalking te vertragen. Zorg dus dat je vitamine D-waarden goed zijn. Van oktober tot april maken we in Nederland geen vitamine D meer aan via zonlicht. Vul je voeding daarom aan met een hoogwaardig supplement.

Ook al voel je je nu (voor je gevoel) goed en zijn je vitamine D-waarden laag, realiseer je dat er vanbinnen van alles gebeurt waar je op latere leeftijd last van kan krijgen, zoals botontkalking.

**Tip:** uit onderzoek is gebleken dat het eten van 50 gram pruimen per dag tijdens de premenopauze het effect van botontkalking verkleint.

### Uitklap 6: Gewichtstoename rond je middel

Als we ouder worden, vertraagt onze stofwisseling. Tegelijkertijd gaat de hoeveelheid oestrogeen omlaag. Je lichaam gaat onder invloed van testosteron oestrogeen maken uit buikvetweefsel om toch een eisprong te kunnen laten plaatsvinden. Progesteron is ook gedaald, en progesteron helpt juist bij het verbranden van vet.

Meer oestrogeen vanuit vetweefsel en minder progesteron betekent dus meer vetopslag. Veranderen we niets in onze leefstijl, dan vliegen de kilo's er aan en zien we onze taille beetje bij beetje verdwijnen.

Een paar kilo aankomen (2 tot 4) is niet eens zo slecht. Zo kan je lichaam nog wat oestrogenen blijven aanmaken zodra ook oestrogeen verder daalt. Vrouwen met een laag vetpercentage kunnen juist meer klachten ervaren van de overgang. Een gezond vetpercentage voor een vrouw rond de 40-55 ligt tussen de 23 en 30%.

**Wat helpt:**
- Stabiele bloedsuiker via 3-4 eetmomenten
- Eiwit bij elke maaltijd voor het behoud van je spiermassa
- Krachttraining
- Niet te streng diëten, dat verstoort je hormonen verder
- Stress omlaag, want cortisol stimuleert vetopslag rond je middel

### Uitklap 7: Verminderd libido en vaginale droogheid

Dit heeft te maken met de afname van de hormonen oestrogeen en progesteron, en deels door de afname van testosteron. Daarnaast kan de afname van oestrogeen zorgen voor vaginale droogheid, waardoor er pijn kan zijn tijdens het vrijen.

**Wat helpt:**
- Goede vetten en cholesterol uit voeding (cholesterol is een bouwstof voor geslachtshormonen)
- Voldoende slaap en stressreductie
- Bij hardnekkige klachten: bezoek aan een hormoontherapeut of overgangsconsulent kan zinvol zijn

### Uitklap 8: Voedingsmiddelen die "rustgevende" hormonen stimuleren

Tijdens de premenopauze zijn deze voedingsmiddelen extra belangrijk omdat ze helpen bij de aanmaak van rustgevende stoffen in je lichaam:

- Ei en gevogelte
- Chiazaad, lijnzaad, sesamzaad, zonnebloempitten, pompoenpitten, pijnboompitten, maanzaad, korianderzaad, komijnzaad
- Verse basilicum, munt
- Haver, boekweit, quinoa
- Mozzarella (vet, niet light), tahin
- Banaan (niet te rijp), cacao, kaneel
- Cashewnoot, pistachenoten, amandel
- Spirulina, zeewier
- Fenegriek, gember

Combineer dit met **kruisbloemige groenten** (broccoli, boerenkool, bloemkool, paksoi, kool, spruiten) die het teveel aan oestrogeen helpen afvoeren en je lever ondersteunen.

**Bladgroenten** zoals spinazie, andijvie en snijbiet leveren magnesium, dat overgangsklachten zoals slapeloosheid en stemmingswisselingen helpt verminderen.

**Gefermenteerde voedingsmiddelen** zoals zuurkool, kefir, yoghurt (met mate) en tempé zijn goed voor je darmflora, wat indirect je hormoonbalans ondersteunt.

---

## Bron

Deze module is samengesteld door de gecertificeerde hormoontherapeut van het Longevity Fit team, opgeleid bij Rieneke Dijkinga.
