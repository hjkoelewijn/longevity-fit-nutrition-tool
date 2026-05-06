/** Mapt Supabase `profiles` → onboarding client state + aanbevolen stap. */

export type EatingPatternJson = {
  meals_per_day?: string;
  breakfast_routine?: string;
  snack_habits?: string;
  eat_out_per_week?: string;
  habit_vs_hunger?: string;
};

export type GutStatusJson = {
  bowel_regularity?: string;
  bloating?: string;
  gut_issue?: string;
  gut_issue_detail?: string;
};

export type OnboardingSnapshot = {
  step: number;
  phase1: {
    name: string;
    age: string;
    householdAdults: string;
    householdChildrenCount: string;
    householdChildrenAges: string;
    cookingSkill: string;
    cookingTimeWeekday: string;
    cookingTimeWeekend: string;
    sportFrequency: string;
    sportIntensity: string;
  };
  phase2: {
    mealsPerDay: string;
    breakfastRoutine: string;
    snackHabits: string;
    eatOutPerWeek: string;
    habitVsHunger: string;
  };
  phase3: {
    dietStyle: string;
    allergies: string[];
    intolerances: string[];
    dislikes: string;
    notes: string;
  };
  phase4: {
    foodExperience: string;
    bowelRegularity: string;
    bloating: string;
    gutIssue: string;
    gutIssueDetail: string;
    dairyApproach: string;
    glutenApproach: string;
    coffeeIntake: string;
    alcoholIntake: string;
  };
  phase5: {
    cycleStatus: string;
    cycleLastPeriod: string;
    cycleLength: string;
  };
  phase6: {
    goals: string[];
    goalsOther: string;
  };
  phase7: {
    hasBalanceTest: "yes_now" | "yes_later" | "no";
    supplementsUsed: string[];
    supplementsOther: string;
    testDate: string;
    omega3Total: string;
    omega6Total: string;
    omegaRatio: string;
    aaEpaRatio: string;
    saturatedFat: string;
    monounsaturated: string;
    transFat: string;
    fattyAcids: Record<string, string>;
    individualFattyAcidsNote: string;
    cellHardness: string;
    mentalStrength: string;
  };
};

const DEFAULT: OnboardingSnapshot = {
  step: 1,
  phase1: {
    name: "",
    age: "",
    householdAdults: "2",
    householdChildrenCount: "0",
    householdChildrenAges: "",
    cookingSkill: "2",
    cookingTimeWeekday: "30 min",
    cookingTimeWeekend: "45+ min",
    sportFrequency: "3x per week",
    sportIntensity: "matig",
  },
  phase2: {
    mealsPerDay: "3",
    breakfastRoutine: "licht",
    snackHabits: "soms",
    eatOutPerWeek: "1",
    habitVsHunger: "soms gewoonte",
  },
  phase3: {
    dietStyle: "flexitariër",
    allergies: [],
    intolerances: [],
    dislikes: "",
    notes: "",
  },
  phase4: {
    foodExperience: "paar maanden",
    bowelRegularity: "regelmatig dagelijks",
    bloating: "soms",
    gutIssue: "nee",
    gutIssueDetail: "",
    dairyApproach: "volle bio",
    glutenApproach: "probeer minder",
    coffeeIntake: "1-2 per dag",
    alcoholIntake: "1-2 per week",
  },
  phase5: {
    cycleStatus: "onregelmatig / perimenopauze",
    cycleLastPeriod: "",
    cycleLength: "28",
  },
  phase6: {
    goals: [],
    goalsOther: "",
  },
  phase7: {
    hasBalanceTest: "yes_later",
    supplementsUsed: [],
    supplementsOther: "",
    testDate: "",
    omega3Total: "",
    omega6Total: "",
    omegaRatio: "",
    aaEpaRatio: "",
    saturatedFat: "",
    monounsaturated: "",
    transFat: "",
    fattyAcids: {},
    individualFattyAcidsNote: "",
    cellHardness: "",
    mentalStrength: "",
  },
};

function numStr(n: unknown): string {
  return typeof n === "number" && Number.isFinite(n) ? String(n) : "";
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function mapProfileRowToSnapshot(
  row: Record<string, unknown> | null | undefined,
): OnboardingSnapshot {
  if (!row) {
    return structuredClone(DEFAULT);
  }

  const eating = row.eating_pattern as EatingPatternJson | null | undefined;
  const gut = row.gut_status as GutStatusJson | null | undefined;
  const children = row.household_children;
  let childrenAges = "";
  if (Array.isArray(children)) {
    childrenAges = children
      .filter((x): x is number => typeof x === "number" && Number.isFinite(x))
      .join(", ");
  }

  const goalsRaw = row.goals;
  const goals: string[] = Array.isArray(goalsRaw)
    ? goalsRaw.filter((g): g is string => typeof g === "string")
    : [];
  let goalsOther = "";
  const otherGoal = goals.find((g) => g.startsWith("Anders: "));
  if (otherGoal) {
    goalsOther = otherGoal.slice("Anders: ".length).trim();
  }

  const stepRaw = row.onboarding_step;
  let step = 1;
  if (typeof stepRaw === "number" && Number.isFinite(stepRaw)) {
    const s = Math.floor(stepRaw);
    // 8 = na afgeronde fase 7; toon laatste stap voor eventuele correctie via URL
    step = Math.min(Math.max(s > 7 ? 7 : s, 1), 7);
  }

  const balanceChoice = str(row.balance_test_choice);
  let hasBalanceTest: OnboardingSnapshot["phase7"]["hasBalanceTest"] = "yes_later";
  if (balanceChoice === "entered") hasBalanceTest = "yes_now";
  else if (balanceChoice === "later") hasBalanceTest = "yes_later";
  else if (balanceChoice === "none") hasBalanceTest = "no";

  const supplementsRaw = row.supplements_used;
  const supplementsUsed: string[] = Array.isArray(supplementsRaw)
    ? supplementsRaw.filter((s): s is string => typeof s === "string")
    : [];

  return {
    step,
    phase1: {
      name: str(row.name),
      age: numStr(row.age),
      householdAdults:
        typeof row.household_adults === "number"
          ? String(row.household_adults)
          : DEFAULT.phase1.householdAdults,
      householdChildrenCount:
        typeof row.household_children_count === "number"
          ? String(row.household_children_count)
          : Array.isArray(children)
            ? String(children.length)
            : DEFAULT.phase1.householdChildrenCount,
      householdChildrenAges: childrenAges,
      cookingSkill: str(
        row.cooking_skill !== undefined && row.cooking_skill !== null
          ? String(row.cooking_skill)
          : DEFAULT.phase1.cookingSkill,
      ),
      cookingTimeWeekday: str(row.cooking_time_weekday, DEFAULT.phase1.cookingTimeWeekday),
      cookingTimeWeekend: str(row.cooking_time_weekend, DEFAULT.phase1.cookingTimeWeekend),
      sportFrequency: str(row.sport_frequency, DEFAULT.phase1.sportFrequency),
      sportIntensity: str(row.sport_intensity, DEFAULT.phase1.sportIntensity),
    },
    phase2: {
      mealsPerDay: str(eating?.meals_per_day, DEFAULT.phase2.mealsPerDay),
      breakfastRoutine: str(eating?.breakfast_routine, DEFAULT.phase2.breakfastRoutine),
      snackHabits: str(eating?.snack_habits, DEFAULT.phase2.snackHabits),
      eatOutPerWeek: str(eating?.eat_out_per_week, DEFAULT.phase2.eatOutPerWeek),
      habitVsHunger: str(eating?.habit_vs_hunger, DEFAULT.phase2.habitVsHunger),
    },
    phase3: {
      dietStyle: str(row.diet_style, DEFAULT.phase3.dietStyle),
      allergies: Array.isArray(row.allergies)
        ? row.allergies.filter((a): a is string => typeof a === "string")
        : [],
      intolerances: Array.isArray(row.intolerances)
        ? row.intolerances.filter((a): a is string => typeof a === "string")
        : [],
      dislikes: str(row.dislikes),
      notes: str(row.notes),
    },
    phase4: {
      foodExperience: str(row.food_experience, DEFAULT.phase4.foodExperience),
      bowelRegularity: str(gut?.bowel_regularity, DEFAULT.phase4.bowelRegularity),
      bloating: str(gut?.bloating, DEFAULT.phase4.bloating),
      gutIssue: str(gut?.gut_issue, DEFAULT.phase4.gutIssue),
      gutIssueDetail: str(gut?.gut_issue_detail),
      dairyApproach: str(row.dairy_approach, DEFAULT.phase4.dairyApproach),
      glutenApproach: str(row.gluten_approach, DEFAULT.phase4.glutenApproach),
      coffeeIntake: str(row.coffee_intake, DEFAULT.phase4.coffeeIntake),
      alcoholIntake: str(row.alcohol_intake, DEFAULT.phase4.alcoholIntake),
    },
    phase5: {
      cycleStatus: str(row.cycle_status, DEFAULT.phase5.cycleStatus),
      cycleLastPeriod: str(row.cycle_last_period),
      cycleLength:
        typeof row.cycle_length === "number"
          ? String(row.cycle_length)
          : DEFAULT.phase5.cycleLength,
    },
    phase6: {
      goals: goals.filter((g) => !g.startsWith("Anders: ")),
      goalsOther,
    },
    phase7: {
      hasBalanceTest,
      supplementsUsed,
      supplementsOther: "",
      testDate: "",
      omega3Total: "",
      omega6Total: "",
      omegaRatio: "",
      aaEpaRatio: "",
      saturatedFat: "",
      monounsaturated: "",
      transFat: "",
      fattyAcids: {},
      individualFattyAcidsNote: "",
      cellHardness: "",
      mentalStrength: "",
    },
  };
}
