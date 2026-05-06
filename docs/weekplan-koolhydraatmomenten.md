# Weekplan — koolhydraatmomenten (productafspraak)

## Wat we bedoelen

Een **koolhydraatmoment** is hier: het **hoofdmoment waar het maal vooral om zetmeel / korrel / brood / aardappelachtige basis** gaat (impact op glycemische belasting en maaltijdsamenstelling in de Longevity Fit-zin).

- **Wél:** granen, **rijst**, pasta, brood, gewone **aardappel**, enz.
- **Niet als dit soort moment:** **fruit** en **groente** (ook al bevatten ze koolhydraten).

Dit is een **richtlijn** (max. 2 van die momenten per dag in de filosofie), geen strafreglement — wel consequent verwerkt in menu en AI-output.

## Zoete aardappel — vaste regel (één zin)

> Zoete aardappel is een **mild** koolhydraatmoment (niet hetzelfde als witte rijst of wit brood): altijd als **complexe** bron, met ruim groente en kwaliteits-eiwit, volgens de Longevity Fit-filosofie en de lijn uit onze e-books / benoemde kaders.

In technische prompts: gebruik `carb_profile: "light"` voor maaltijden waar zoete aardappel de duidelijke zetmeelbron is, en stel nooit gelijk aan geraffineerde snelle koolhydraten.

## Code

Zie `lib/weekplan/carb-moment-rules.ts` voor dezelfde teksten als constants (Claude-prompts, validatie).
