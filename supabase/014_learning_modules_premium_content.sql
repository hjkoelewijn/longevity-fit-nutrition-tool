-- ============================================
-- Learning modules: premium content pack
-- ============================================
-- Doel:
-- - Alle kernmodules vullen met coachende, praktische inhoud
-- - Compatibel met legacy schema's (content + content_md)
-- - Idempotent via upsert op slug

insert into public.learning_modules
  (title, slug, summary, content, content_md, sort_order, category, published)
values
  (
    'Eten zonder stress',
    'eten-zonder-stress',
    'Zo eet je gezond in een druk leven zonder streng dieet of dagelijkse keuzestress.',
    '## Waarom dit belangrijk is
Je hoeft niet perfect te eten om grote winst te pakken. Consistentie verslaat perfectie.
Als gezonde keuzes te veel tijd of mentale energie kosten, houd je het niet vol.

## De Longevity Fit basis (druk leven-proof)
1. Kies per dag 1-2 ankermaaltijden die bijna altijd lukken.
2. Houd weekdagen simpel: weinig stappen, korte bereiding, bekende smaken.
3. Bewaar variatie voor momenten met meer tijd (weekend of vrije dag).

## Beslisregels voor drukke dagen
- Is je dag vol? Kies een maaltijd met maximaal 20 minuten bereiding.
- Twijfel je? Ga voor "goed genoeg" in plaats van "helemaal optimaal".
- Heb je weinig energie? Gebruik je altijd-op-voorraad basis.

## Mini-check aan het einde van de dag
- Had ik voldoende groente en eiwit?
- Was het haalbaar zonder stress?
- Wat wil ik morgen herhalen omdat het werkte?

Kleine, haalbare keuzes tellen op. Dat is precies hoe je duurzaam gezond eet.',
    '## Waarom dit belangrijk is
Je hoeft niet perfect te eten om grote winst te pakken. Consistentie verslaat perfectie.
Als gezonde keuzes te veel tijd of mentale energie kosten, houd je het niet vol.

## De Longevity Fit basis (druk leven-proof)
1. Kies per dag 1-2 ankermaaltijden die bijna altijd lukken.
2. Houd weekdagen simpel: weinig stappen, korte bereiding, bekende smaken.
3. Bewaar variatie voor momenten met meer tijd (weekend of vrije dag).

## Beslisregels voor drukke dagen
- Is je dag vol? Kies een maaltijd met maximaal 20 minuten bereiding.
- Twijfel je? Ga voor "goed genoeg" in plaats van "helemaal optimaal".
- Heb je weinig energie? Gebruik je altijd-op-voorraad basis.

## Mini-check aan het einde van de dag
- Had ik voldoende groente en eiwit?
- Was het haalbaar zonder stress?
- Wat wil ik morgen herhalen omdat het werkte?

Kleine, haalbare keuzes tellen op. Dat is precies hoe je duurzaam gezond eet.',
    10,
    'Basis',
    true
  ),
  (
    'Bordopbouw in 3 stappen',
    'bordopbouw-3-stappen',
    'Een simpele bordvolgorde die helpt bij verzadiging, energie en minder snaaidrang.',
    '## De volgorde
1. Groente + eiwit
2. Gezonde vetten
3. Koolhydraatbron op behoefte

## Waarom deze volgorde werkt
Starten met groente en eiwit geeft vaak eerder verzadiging en stabielere energie.
Daarna voeg je vetten toe voor smaak en langer vol zitten.
Koolhydraten stem je af op je dagbelasting (rustdag, werkdag, sportdag).

## Praktische voorbeelden
- Ontbijt: groente-omelet + avocado, daarna eventueel havermout.
- Lunch: grote salade met kip/bonen + olijfolie, daarna eventueel volkoren brood.
- Diner: veel groente + vis/vlees/peulvruchten + vetbron, daarna rijst/aardappel naar behoefte.

## Veelgemaakte fout
Beginnen met snelle koolhydraten als basis terwijl je eigenlijk vooral trek hebt.
Draai de volgorde om en evalueer na 10 minuten hoe je je voelt.

Doel is niet "weinig koolhydraten", maar "koolhydraten bewust inzetten".',
    '## De volgorde
1. Groente + eiwit
2. Gezonde vetten
3. Koolhydraatbron op behoefte

## Waarom deze volgorde werkt
Starten met groente en eiwit geeft vaak eerder verzadiging en stabielere energie.
Daarna voeg je vetten toe voor smaak en langer vol zitten.
Koolhydraten stem je af op je dagbelasting (rustdag, werkdag, sportdag).

## Praktische voorbeelden
- Ontbijt: groente-omelet + avocado, daarna eventueel havermout.
- Lunch: grote salade met kip/bonen + olijfolie, daarna eventueel volkoren brood.
- Diner: veel groente + vis/vlees/peulvruchten + vetbron, daarna rijst/aardappel naar behoefte.

## Veelgemaakte fout
Beginnen met snelle koolhydraten als basis terwijl je eigenlijk vooral trek hebt.
Draai de volgorde om en evalueer na 10 minuten hoe je je voelt.

Doel is niet "weinig koolhydraten", maar "koolhydraten bewust inzetten".',
    20,
    'Basis',
    true
  ),
  (
    'Intuitief eten als kompas',
    'intuitief-eten-kompas',
    'Gebruik porties als startpunt en leer bijsturen op honger, verzadiging en energiebehoefte.',
    '## Porties zijn een richtlijn
Een schema helpt je starten, maar jouw lichaam bepaalt de finetuning.
Je hoeft niet altijd hetzelfde te eten op dezelfde hoeveelheid.

## De 3 check-ins
1. Voor de maaltijd: hoe hongerig ben ik nu?
2. Halverwege: heb ik nog echt trek of eet ik op automatisme?
3. Na de maaltijd: ben ik prettig verzadigd voor 2-4 uur?

## Zo stuur je bij zonder schuldgevoel
- Nog honger na je bord? Voeg eerst groente/eiwit toe, dan eventueel extra koolhydraten.
- Te vol? Volgende keer iets kleinere startportie nemen.
- Veel trek op sportdagen? Plan bewust meer koolhydraat- en eiwitruimte in.

## Wat je wilt voelen
Rust rond eten, minder "alles of niets", en stabielere energie over de dag.
Dat is precies het doel van intuïtief eten binnen Longevity Fit.',
    '## Porties zijn een richtlijn
Een schema helpt je starten, maar jouw lichaam bepaalt de finetuning.
Je hoeft niet altijd hetzelfde te eten op dezelfde hoeveelheid.

## De 3 check-ins
1. Voor de maaltijd: hoe hongerig ben ik nu?
2. Halverwege: heb ik nog echt trek of eet ik op automatisme?
3. Na de maaltijd: ben ik prettig verzadigd voor 2-4 uur?

## Zo stuur je bij zonder schuldgevoel
- Nog honger na je bord? Voeg eerst groente/eiwit toe, dan eventueel extra koolhydraten.
- Te vol? Volgende keer iets kleinere startportie nemen.
- Veel trek op sportdagen? Plan bewust meer koolhydraat- en eiwitruimte in.

## Wat je wilt voelen
Rust rond eten, minder "alles of niets", en stabielere energie over de dag.
Dat is precies het doel van intuïtief eten binnen Longevity Fit.',
    30,
    'Mindset',
    true
  ),
  (
    'Slim plannen voor drukke weken',
    'slim-plannen-drukke-weken',
    'Met 15 minuten planning voorkom je dagelijkse keuzestress en terugval naar snelle noodopties.',
    '## Plan kort, plan slim
Je hoeft geen perfect weekmenu te maken. Je hebt alleen een slim minimum nodig.

## 15-minuten aanpak
1. Kijk naar je agenda: welke dagen zijn echt druk?
2. Koppel per drukke dag een snelle standaardmaaltijd.
3. Kies 1-2 dagen met meer tijd voor iets uitgebreider koken.
4. Maak een korte boodschappenlijst + altijd-op-voorraad check.

## De praktische ondergrens
- Minimaal 2 snelle diners die altijd lukken.
- Minimaal 1 no-cook of low-cook lunchoptie.
- Minimaal 2 snacks met eiwit/vezels voor drukke momenten.

## Noodplan (als alles anders loopt)
Gebruik je basisvoorraad + 1 pan/1 bakplaat maaltijd.
Doel: voedzaam genoeg, snel klaar, geen mentale overbelasting.',
    '## Plan kort, plan slim
Je hoeft geen perfect weekmenu te maken. Je hebt alleen een slim minimum nodig.

## 15-minuten aanpak
1. Kijk naar je agenda: welke dagen zijn echt druk?
2. Koppel per drukke dag een snelle standaardmaaltijd.
3. Kies 1-2 dagen met meer tijd voor iets uitgebreider koken.
4. Maak een korte boodschappenlijst + altijd-op-voorraad check.

## De praktische ondergrens
- Minimaal 2 snelle diners die altijd lukken.
- Minimaal 1 no-cook of low-cook lunchoptie.
- Minimaal 2 snacks met eiwit/vezels voor drukke momenten.

## Noodplan (als alles anders loopt)
Gebruik je basisvoorraad + 1 pan/1 bakplaat maaltijd.
Doel: voedzaam genoeg, snel klaar, geen mentale overbelasting.',
    40,
    'Planning',
    true
  ),
  (
    'Koolhydraatmomenten simpel houden',
    'koolhydraatmomenten-simpel',
    'Houd het praktisch met maximaal twee duidelijke zetmeelmomenten per dag als werkbare richtlijn.',
    '## Wat telt als koolhydraatmoment
Vooral zetmeelbronnen zoals brood, pasta, rijst, aardappel, wraps, havermout.
Groente en fruit tellen in deze aanpak niet mee als zetmeelmoment.

## Eenvoudige dagstructuur
1. Kies je eerste zetmeelmoment (bijv. ontbijt of lunch).
2. Kies je tweede zetmeelmoment (vaak diner).
3. Vul de rest met groente, eiwit en vetten.

## Wanneer je afwijkt (en dat is oké)
- Zware sportdag: extra koolhydraatmoment kan functioneel zijn.
- Slechte nachtrust/ziek: soms meer behoefte aan snelle energie.
- Veel stress: kies dan vooral eenvoud en regelmaat.

De richtlijn helpt je keuzes maken. Het is geen streng verbod.',
    '## Wat telt als koolhydraatmoment
Vooral zetmeelbronnen zoals brood, pasta, rijst, aardappel, wraps, havermout.
Groente en fruit tellen in deze aanpak niet mee als zetmeelmoment.

## Eenvoudige dagstructuur
1. Kies je eerste zetmeelmoment (bijv. ontbijt of lunch).
2. Kies je tweede zetmeelmoment (vaak diner).
3. Vul de rest met groente, eiwit en vetten.

## Wanneer je afwijkt (en dat is oké)
- Zware sportdag: extra koolhydraatmoment kan functioneel zijn.
- Slechte nachtrust/ziek: soms meer behoefte aan snelle energie.
- Veel stress: kies dan vooral eenvoud en regelmaat.

De richtlijn helpt je keuzes maken. Het is geen streng verbod.',
    50,
    'Voeding',
    true
  ),
  (
    'Altijd op voorraad basis',
    'altijd-op-voorraad-basis',
    'Met een slimme basisvoorraad kook je sneller, voedzamer en met veel minder dagelijkse stress.',
    '## Waarom dit werkt
Een goede voorraad is een eenmalige investering die dagelijks rust oplevert.
Je voorkomt "niks in huis"-momenten en impulskeuzes.

## Jouw minimale basis
- Eiwit: eieren, blikvis, peulvruchten, (diepvries)kip/tofu
- Groente: diepvriesgroente, tomatenblokjes, ui/knoflook
- Vetten: olijfolie, noten/zaden, avocado (wanneer op voorraad)
- Koolhydraatbronnen: havermout, volkoren pasta/rijst, aardappels
- Smaakmakers: kruiden, citroen/azijn, mosterd, bouillon

## 10-minuten noodgevallen
1. Groenteomelet + restjes
2. Linzen-tomatensaus met volkoren pasta
3. Rijst + wokgroente + ei/kip/tofu

## Wekelijkse reset
Check 1x per week wat op is en vul alleen de kern aan.
Zo blijft gezond eten haalbaar, ook in de drukste weken.',
    '## Waarom dit werkt
Een goede voorraad is een eenmalige investering die dagelijks rust oplevert.
Je voorkomt "niks in huis"-momenten en impulskeuzes.

## Jouw minimale basis
- Eiwit: eieren, blikvis, peulvruchten, (diepvries)kip/tofu
- Groente: diepvriesgroente, tomatenblokjes, ui/knoflook
- Vetten: olijfolie, noten/zaden, avocado (wanneer op voorraad)
- Koolhydraatbronnen: havermout, volkoren pasta/rijst, aardappels
- Smaakmakers: kruiden, citroen/azijn, mosterd, bouillon

## 10-minuten noodgevallen
1. Groenteomelet + restjes
2. Linzen-tomatensaus met volkoren pasta
3. Rijst + wokgroente + ei/kip/tofu

## Wekelijkse reset
Check 1x per week wat op is en vul alleen de kern aan.
Zo blijft gezond eten haalbaar, ook in de drukste weken.',
    60,
    'Planning',
    true
  )
on conflict (slug) do update
set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  content_md = excluded.content_md,
  sort_order = excluded.sort_order,
  category = excluded.category,
  published = excluded.published;

