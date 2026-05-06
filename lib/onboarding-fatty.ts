/** 11 invulvelden voor individuele vetzuren (BalanceTest-rapport). Keys → JSON in balance_tests.individual_fatty_acids */

export const INDIVIDUAL_FATTY_ACID_FIELDS = [
  { key: "c16_0", label: "Palmitic acid (C16:0)" },
  { key: "c18_0", label: "Stearic acid (C18:0)" },
  { key: "c18_1_9", label: "Oleic acid (C18:1 n-9)" },
  { key: "c18_2", label: "Linoleic acid (C18:2 n-6)" },
  { key: "c18_3", label: "ALA (C18:3 n-3)" },
  { key: "c20_4", label: "Arachidonic acid / AA (C20:4 n-6)" },
  { key: "c20_5", label: "EPA (C20:5 n-3)" },
  { key: "c22_5", label: "DPA (C22:5 n-3)" },
  { key: "c22_6", label: "DHA (C22:6 n-3)" },
  { key: "c20_3", label: "DGLA (C20:3 n-6)" },
  { key: "other", label: "Overig (noem in opmerking)" },
] as const;
