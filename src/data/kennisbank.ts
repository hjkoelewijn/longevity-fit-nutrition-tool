export type ModuleEntry = {
  id: string;
  titel: string;
  klikbaar: boolean;
  pad?: string;
};

export type KennisbankCategorie = {
  id: string;
  titel: string;
  korteOmschrijving: string;
  modules: ModuleEntry[];
  status: "actief" | "preview";
  pad?: string;
};

export const kennisbankIntro = [
  "Welkom in de Longevity Fit Kennisbank.",
  "Deze plek vullen we de komende weken stap voor stap met alles wat jij nodig hebt om te begrijpen wat er in jouw lichaam speelt en waarom de keuzes binnen Longevity Fit zo werken. Geen losse weetjes, geen knip-en-plak voedingstips. Wel de achtergrond die jou helpt om bewuste keuzes te maken die bij jouw lichaam in deze fase passen.",
  "We beginnen met de basis. Wat gebeurt er eigenlijk in je lichaam vanaf je 40e? Welke hormonen schommelen, wat doet dat met je energie, je slaap, je gewicht, je hoofd? En waarom werkt het fundament dat we in Longevity Fit leggen zo goed om die klachten te minimaliseren?",
  "In de komende weken komen daar steeds meer stukken bij. Over je lever, je darmen, hoe je eet, stress, de waarheid over zuivel en suiker, en wat goede vetten echt voor je doen. Allemaal in begrijpelijke taal, met praktische handvatten.",
  "Onze missie: dat jij over een paar weken niet alleen weet wat je moet eten, maar ook waarom. Dat je begrijpt wat je voelt en waarom je het voelt. Dat je je lichaam herkent in plaats van ertegen vecht.",
  "Want de tweede helft van je leven mag de beste worden. Niet ondanks deze fase. Maar door wat je nu doet.",
];

export const kennisbankCategorieen: KennisbankCategorie[] = [
  {
    id: "40plus-lichaam",
    titel: "Wat gebeurt er in je 40+ lichaam?",
    korteOmschrijving:
      "De basis voor alles wat je daarna leest. Hier begrijp je wat er in jouw lichaam gebeurt en waarom Longevity Fit doet wat het doet.",
    status: "actief",
    modules: [
      {
        id: "hormonen",
        titel: "Hormonen, je lichaam in beweging",
        klikbaar: true,
        pad: "/kennisbank/40plus-lichaam/hormonen",
      },
    ],
  },
  {
    id: "de-basis",
    titel: "De basis",
    korteOmschrijving: "De fundamenten van eten voor je 40+ lichaam.",
    status: "actief",
    pad: "/kennisbank/de-basis",
    modules: [
      {
        id: "eetmomenten",
        titel: "Waarom max 4 eetmomenten?",
        klikbaar: true,
        pad: "/kennisbank/de-basis/eetmomenten",
      },
      {
        id: "koolhydraten",
        titel: "Koolhydraten: wanneer wel, wanneer minder",
        klikbaar: true,
        pad: "/kennisbank/de-basis/koolhydraten",
      },
      {
        id: "goede-vetten",
        titel: "Goede vetten en de omega 3/6 balans",
        klikbaar: true,
        pad: "/kennisbank/de-basis/goede-vetten",
      },
      {
        id: "eiwitten",
        titel: "Eiwitten: dierlijk en plantaardig",
        klikbaar: true,
        pad: "/kennisbank/de-basis/eiwitten",
      },
      {
        id: "bloedsuiker",
        titel: "Bloedsuiker, insuline en je energie",
        klikbaar: true,
        pad: "/kennisbank/de-basis/bloedsuiker",
      },
    ],
  },
  {
    id: "hoe-je-eet-en-leeft",
    titel: "Hoe je eet en leeft",
    korteOmschrijving: "Het is niet alleen wat je eet, maar ook hoe en wanneer.",
    status: "actief",
    pad: "/kennisbank/hoe-je-eet-en-leeft",
    modules: [
      {
        id: "tussendoortjes",
        titel: "Tussendoortjes: trek vs. gewoonte",
        klikbaar: true,
        pad: "/kennisbank/hoe-je-eet-en-leeft/tussendoortjes",
      },
      {
        id: "hoe-je-eet",
        titel: "Hoe je eet, niet alleen wat je eet",
        klikbaar: true,
        pad: "/kennisbank/hoe-je-eet-en-leeft/hoe-je-eet",
      },
      { id: "stress", titel: "Stress en je lichaam", klikbaar: false },
      { id: "fasting", titel: "Fasting voor vrouwen 40+", klikbaar: false },
      { id: "alcohol", titel: "Alcohol en je hormonen", klikbaar: false },
      { id: "etentjes", titel: "Etentjes en sociale events", klikbaar: false },
    ],
  },
  {
    id: "specifieke-voedingsmiddelen",
    titel: "Specifieke voedingsmiddelen",
    korteOmschrijving: "De waarheid achter producten waar je veel vragen over hebt.",
    status: "preview",
    modules: [
      { id: "zuivel", titel: "Zuivel: het hele verhaal", klikbaar: false },
      { id: "gluten", titel: "Gluten: niet voor iedereen een probleem", klikbaar: false },
      { id: "melk", titel: "Plantaardige melk vs. rauwe melk", klikbaar: false },
      { id: "eieren", titel: "Eieren: biologisch, scharrel, weidegang", klikbaar: false },
      { id: "vis", titel: "Vis: wild vs. gekweekt", klikbaar: false },
      { id: "suikervervangers", titel: "Suikervervangers: wat wel, wat niet", klikbaar: false },
      { id: "koffie-thee", titel: "Koffie en thee", klikbaar: false },
      {
        id: "bewerkingsmethoden",
        titel: "Bewerkingsmethoden: rauw, gekookt, gefermenteerd",
        klikbaar: false,
      },
    ],
  },
  {
    id: "hormonen-en-organen",
    titel: "Je hormonen en organen",
    korteOmschrijving: "Hoe je organen samenwerken met je hormonen, en wat voeding daarin doet.",
    status: "preview",
    modules: [
      { id: "cyclus", titel: "Cyclus en eten (per fase)", klikbaar: false },
      { id: "lever", titel: "De lever, het orgaan dat alles draagt", klikbaar: false },
      {
        id: "darmwandherstel",
        titel: "Darmwandherstel: waarom je je in begin niet meteen beter voelt",
        klikbaar: false,
      },
    ],
  },
  {
    id: "praktisch-en-bewust",
    titel: "Praktisch en bewust",
    korteOmschrijving: "De bredere context: training, seizoen, biologisch, aanvullende voeding.",
    status: "preview",
    modules: [
      { id: "eten-training", titel: "Eten rondom training", klikbaar: false },
      { id: "biologisch", titel: "Biologisch eten: dirty dozen / clean fifteen", klikbaar: false },
      { id: "seizoen", titel: "Seizoensgebonden eten", klikbaar: false },
      {
        id: "pharmaconutrition",
        titel: "Pharmaconutrition: waarom aanvullende voeding meer is dan een pilletje",
        klikbaar: false,
      },
    ],
  },
];

