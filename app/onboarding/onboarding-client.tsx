"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { WhyWeAsk } from "@/components/WhyWeAsk";
import type { OnboardingSnapshot } from "@/lib/onboarding-map";
import { INDIVIDUAL_FATTY_ACID_FIELDS } from "@/lib/onboarding-fatty";
import {
  savePhase1Action,
  savePhase2Action,
  savePhase3Action,
  savePhase4Action,
  savePhase5Action,
  savePhase6Action,
  savePhase7Action,
  skipPhase5Action,
} from "./actions";

const allergyOptions = [
  "Noten",
  "Schaaldieren",
  "Eieren",
  "Soja",
  "Vis",
  "Gluten (coeliakie)",
  "Lactose",
  "Anders",
] as const;

const intoleranceOptions = [
  "Gluten (niet-coeliakie)",
  "Lactose",
  "Peulvruchten",
  "Nachtschades (tomaat/paprika/aubergine)",
  "Histamine",
  "FODMAP",
  "Anders",
] as const;

const goalOptions = [
  "Meer energie",
  "Betere slaap",
  "Hormonale balans",
  "Sterker voelen",
  "Stralen / huid en haar",
  "Microbioom herstellen",
  "Fundament leggen voor de volgende fase",
  "Gezond gewicht bereiken",
] as const;

const supplementOptions = [
  "Omega 3",
  "Magnesium",
  "Vitamine D3",
  "Vitamine K2",
  "Multivitamine",
  "Vezels",
  "Anders",
] as const;

const WHY_WE_ASK_CONTENT: Record<string, string> = {
  age: "Leeftijd helpt ons de toon en opbouw van je weekmenu realistischer te maken. Het is geen medisch oordeel.",
  "aantal-volwassenen-in-huishouden":
    "Zo bepalen we voor hoeveel mensen je standaard kookt. Dit voorkomt te kleine of te grote porties.",
  "aantal-kinderen-in-huishouden":
    "Kinderen tellen mee in porties (1 kind = 1 portie), zodat je weekplan direct past bij je gezinssituatie.",
  "beschikbare-kooktijd-doordeweeks":
    "Tijd op drukke dagen bepaalt hoe simpel of uitgebreid recepten kunnen zijn. Zo houden we voeding haalbaar en stressvrij.",
  "beschikbare-kooktijd-weekend":
    "In het weekend is vaak iets meer ruimte. We gebruiken dit om handig te variëren tussen snel en uitgebreider koken.",
  allergieen:
    "Dit is veiligheidskritisch: allergieën worden strikt meegenomen in ingrediënten en bereiding.",
  "intoleranties-gevoeligheden":
    "Zo voorkomen we klachten door voeding waar je gevoelig op reageert, zonder dat je plan onnodig beperkt wordt.",
  eetstijl:
    "Je eetstijl bepaalt welke recepten wel of niet passend zijn, zodat je weekplan aansluit bij hoe je echt wilt eten.",
  "heb-je-je-zinzino-balancetest-gedaan":
    "Als je testdata hebt, kunnen we die meenemen in je persoonlijke advies. Heb je die niet, dan werkt het plan ook gewoon.",
};

const PHASE_LABELS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: "Basisprofiel",
  2: "Eetpatroon",
  3: "Voorkeuren & context",
  4: "Spijsvertering & gevoeligheden",
  5: "Cyclus / levensfase",
  6: "Doelen",
  7: "Suppletie & afronding",
};

export default function OnboardingClient(props: {
  initialStep: number;
  snapshot: OnboardingSnapshot;
  fromProfile: boolean;
}) {
  const { initialStep, snapshot, fromProfile } = props;
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(() => {
    const s = Math.min(Math.max(Math.floor(initialStep), 1), 7);
    return s as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isFinishing, setIsFinishing] = useState(false);

  const [phase1, setPhase1] = useState(snapshot.phase1);
  const [phase2, setPhase2] = useState(snapshot.phase2);
  const [phase3, setPhase3] = useState(snapshot.phase3);
  const [phase4, setPhase4] = useState(snapshot.phase4);
  const [phase5, setPhase5] = useState(snapshot.phase5);

  const [phase6, setPhase6] = useState(snapshot.phase6);

  const [phase7, setPhase7] = useState(() => {
    const fa: Record<string, string> = { ...snapshot.phase7.fattyAcids };
    return {
      ...snapshot.phase7,
      fattyAcids: fa,
    };
  });

  useEffect(() => {
    if (step === 7) {
      router.prefetch(fromProfile ? "/profile" : "/dashboard");
    }
  }, [step, router, fromProfile]);

  const parsedChildrenAges = useMemo(() => {
    const raw = phase1.householdChildrenAges.trim();
    if (!raw) return [];

    return raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => Number(part))
      .filter((n) => Number.isFinite(n));
  }, [phase1.householdChildrenAges]);

  function toggleStringArrayValue(
    key: "allergies" | "intolerances" | "goals" | "supplementsUsed",
    value: string,
  ) {
    if (key === "goals") {
      setPhase6((prev) => {
        const current = new Set(prev.goals);
        if (current.has(value)) current.delete(value);
        else current.add(value);
        return { ...prev, goals: Array.from(current) };
      });
      return;
    }

    if (key === "supplementsUsed") {
      setPhase7((prev) => {
        const current = new Set(prev.supplementsUsed);
        if (current.has(value)) current.delete(value);
        else current.add(value);
        return { ...prev, supplementsUsed: Array.from(current) };
      });
      return;
    }

    setPhase3((prev) => {
      const current = new Set(prev[key]);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [key]: Array.from(current) };
    });
  }

  function pushProfile(saved: string) {
    router.push(`/profile?saved=${encodeURIComponent(saved)}`);
  }

  function advanceOrProfile(
    fromPhase: 1 | 2 | 3 | 4 | 5 | 6,
    nextStep: 1 | 2 | 3 | 4 | 5 | 6 | 7,
  ) {
    if (fromProfile) {
      pushProfile(`fase_${fromPhase}`);
      return;
    }
    setStep(nextStep);
  }

  async function onSubmitPhase1(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const age = Number(phase1.age);
    const householdAdults = Number(phase1.householdAdults);
    const householdChildrenCount = Number(phase1.householdChildrenCount);
    const cookingSkill = Number(phase1.cookingSkill) as 1 | 2 | 3;

    if (!phase1.name.trim()) {
      setError("Vul je naam in.");
      return;
    }
    if (!Number.isFinite(age) || age < 18 || age > 100) {
      setError("Vul een realistische leeftijd in.");
      return;
    }
    if (!Number.isFinite(householdAdults) || householdAdults < 1) {
      setError("Vul het aantal volwassenen in.");
      return;
    }
    if (
      !Number.isFinite(householdChildrenCount) ||
      householdChildrenCount < 0 ||
      !Number.isInteger(householdChildrenCount)
    ) {
      setError("Vul een geldig aantal kinderen in (0 of hoger).");
      return;
    }
    if (![1, 2, 3].includes(cookingSkill)) {
      setError("Kies je kookniveau.");
      return;
    }

    startTransition(async () => {
      const result = await savePhase1Action({
        name: phase1.name.trim(),
        age,
        householdAdults,
        householdChildrenCount,
        householdChildrenAges: parsedChildrenAges,
        cookingSkill,
        cookingTimeWeekday: phase1.cookingTimeWeekday,
        cookingTimeWeekend: phase1.cookingTimeWeekend,
        sportFrequency: phase1.sportFrequency,
        sportIntensity: phase1.sportIntensity,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      advanceOrProfile(1, 2);
    });
  }

  async function onSubmitPhase2(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await savePhase2Action({
        mealsPerDay: phase2.mealsPerDay,
        breakfastRoutine: phase2.breakfastRoutine,
        snackHabits: phase2.snackHabits,
        eatOutPerWeek: phase2.eatOutPerWeek,
        habitVsHunger: phase2.habitVsHunger,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      advanceOrProfile(2, 3);
    });
  }

  async function onSubmitPhase3(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!phase3.dietStyle) {
      setError("Kies een eetstijl.");
      return;
    }

    startTransition(async () => {
      const result = await savePhase3Action({
        dietStyle: phase3.dietStyle,
        allergies: phase3.allergies,
        intolerances: phase3.intolerances,
        dislikes: phase3.dislikes,
        notes: phase3.notes,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      advanceOrProfile(3, 4);
    });
  }

  async function onSubmitPhase4(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await savePhase4Action({
        foodExperience: phase4.foodExperience,
        gutStatus: {
          bowel_regularity: phase4.bowelRegularity,
          bloating: phase4.bloating,
          gut_issue: phase4.gutIssue,
          legumes_approach: phase4.legumeApproach,
          gut_issue_detail:
            phase4.gutIssue === "ja" ? phase4.gutIssueDetail.trim() || undefined : undefined,
        },
        dairyApproach: phase4.dairyApproach,
        glutenApproach: phase4.glutenApproach,
        coffeeIntake: phase4.coffeeIntake,
        alcoholIntake: phase4.alcoholIntake,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      advanceOrProfile(4, 5);
    });
  }

  async function onSkipPhase5() {
    setError(null);
    startTransition(async () => {
      const result = await skipPhase5Action();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      advanceOrProfile(5, 6);
    });
  }

  async function onSubmitPhase5(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (phase5.cycleStatus === "cyclisch") {
      if (!phase5.cycleLastPeriod.trim()) {
        setError("Vul de datum van je laatste menstruatie in.");
        return;
      }
      const cycleLength = Number(phase5.cycleLength);
      if (!Number.isFinite(cycleLength) || cycleLength < 20 || cycleLength > 45) {
        setError("Vul een realistische cycluslengte in (dagen).");
        return;
      }
    }

    startTransition(async () => {
      const result = await savePhase5Action({
        cycleStatus: phase5.cycleStatus,
        cycleLastPeriod:
          phase5.cycleStatus === "cyclisch" ? phase5.cycleLastPeriod : null,
        cycleLength:
          phase5.cycleStatus === "cyclisch"
            ? Number(phase5.cycleLength)
            : null,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      advanceOrProfile(5, 6);
    });
  }

  async function onSubmitPhase6(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const goals = [...phase6.goals];
    const other = phase6.goalsOther.trim();
    if (other) goals.push(`Anders: ${other}`);

    if (goals.length === 0) {
      setError("Kies minimaal één doel (of vul ‘Anders’ in).");
      return;
    }

    startTransition(async () => {
      const result = await savePhase6Action({ goals });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      advanceOrProfile(6, 7);
    });
  }

  async function onSubmitPhase7(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supplements = [...phase7.supplementsUsed];
    const supOther = phase7.supplementsOther.trim();
    if (supOther) supplements.push(`Anders: ${supOther}`);

    if (phase7.hasBalanceTest === "yes_now") {
      if (!phase7.testDate.trim()) {
        setError("Vul de datum van de test in.");
        return;
      }
    }

    setIsFinishing(true);
    try {
      const result = await savePhase7Action({
        hasBalanceTest: phase7.hasBalanceTest,
        supplementsUsed: supplements,
        finishLanding: fromProfile ? "profile" : "dashboard",
        balanceTest: {
          testDate: phase7.hasBalanceTest === "yes_now" ? phase7.testDate : null,
          omega3Total: phase7.omega3Total,
          omega6Total: phase7.omega6Total,
          omegaRatio: phase7.omegaRatio,
          aaEpaRatio: phase7.aaEpaRatio,
          saturatedFat: phase7.saturatedFat,
          monounsaturated: phase7.monounsaturated,
          transFat: phase7.transFat,
          individualFattyAcidsNote: phase7.individualFattyAcidsNote,
          fattyAcids: phase7.fattyAcids,
          cellHardness: phase7.cellHardness,
          mentalStrength: phase7.mentalStrength,
        },
      });

      if (result && !result.ok) {
        setError(result.message);
      }
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/branding/longevity-fit-zwart-goud.png"
                alt="Longevity Fit"
                width={240}
                height={28}
                priority
              />
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-stone-900">
              Onboarding
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Fase {step} van 7 · {PHASE_LABELS[step]}
            </p>
          </div>
          <div className="hidden text-right text-xs text-stone-500 sm:block">
            <div>Stap {step}/7</div>
          </div>
        </div>

        <div className="mt-8 flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full ${
                n <= step ? "bg-stone-900" : "bg-stone-200"
              }`}
            />
          ))}
        </div>

        {error ? (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <form className="mt-8 space-y-5" onSubmit={onSubmitPhase1}>
            <Field label="Naam">
              <input
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase1.name}
                onChange={(e) =>
                  setPhase1((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Leeftijd">
                <input
                  inputMode="numeric"
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  value={phase1.age}
                  onChange={(e) =>
                    setPhase1((p) => ({ ...p, age: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Aantal volwassenen in huishouden">
                <input
                  inputMode="numeric"
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  value={phase1.householdAdults}
                  onChange={(e) =>
                    setPhase1((p) => ({ ...p, householdAdults: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Aantal kinderen in huishouden">
                <input
                  inputMode="numeric"
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  value={phase1.householdChildrenCount}
                  onChange={(e) =>
                    setPhase1((p) => ({
                      ...p,
                      householdChildrenCount: e.target.value,
                    }))
                  }
                  required
                />
              </Field>
            </div>

            <Field
              label="Leeftijden kinderen (optioneel)"
              hint="Komma-gescheiden, bv. 8, 12. Extra detail; het aantal kinderen hierboven bepaalt porties."
            >
              <input
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase1.householdChildrenAges}
                onChange={(e) =>
                  setPhase1((p) => ({
                    ...p,
                    householdChildrenAges: e.target.value,
                  }))
                }
                placeholder="bv. 8, 12"
              />
            </Field>

            <Field label="Kookniveau">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase1.cookingSkill}
                onChange={(e) =>
                  setPhase1((p) => ({ ...p, cookingSkill: e.target.value }))
                }
              >
                <option value="1">1 — beginner</option>
                <option value="2">2 — gemiddeld</option>
                <option value="3">3 — ervaren</option>
              </select>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Beschikbare kooktijd doordeweeks">
                <select
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  value={phase1.cookingTimeWeekday}
                  onChange={(e) =>
                    setPhase1((p) => ({
                      ...p,
                      cookingTimeWeekday: e.target.value,
                    }))
                  }
                >
                  <option value="15 min">15 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45+ min">45+ min</option>
                </select>
              </Field>
              <Field label="Beschikbare kooktijd weekend">
                <select
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  value={phase1.cookingTimeWeekend}
                  onChange={(e) =>
                    setPhase1((p) => ({
                      ...p,
                      cookingTimeWeekend: e.target.value,
                    }))
                  }
                >
                  <option value="15 min">15 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45+ min">45+ min</option>
                </select>
              </Field>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Opslaan..." : "Verder naar fase 2"}
            </button>
          </form>
        ) : null}

        {step === 2 ? (
          <form className="mt-8 space-y-5" onSubmit={onSubmitPhase2}>
            <Field label="Eetmomenten als basis voor jouw weekmenu">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase2.mealsPerDay}
                onChange={(e) =>
                  setPhase2((p) => ({ ...p, mealsPerDay: e.target.value }))
                }
              >
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Bij Longevity Fit adviseren we maximaal 4 eetmomenten per dag.</li>
                  <li>Dit wordt uitgelegd in de kennisbank.</li>
                  <li>We gaan uit van 3 hoofdmaaltijden en een snack.</li>
                </ul>
              </div>
            </Field>

            <Field label="Ontbijt-routine">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase2.breakfastRoutine}
                onChange={(e) =>
                  setPhase2((p) => ({
                    ...p,
                    breakfastRoutine: e.target.value,
                  }))
                }
              >
                <option value="uitgebreid">uitgebreid</option>
                <option value="licht">licht</option>
                <option value="sla over">sla over</option>
              </select>
            </Field>

            <Field label="Snack-gewoontes">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase2.snackHabits}
                onChange={(e) =>
                  setPhase2((p) => ({ ...p, snackHabits: e.target.value }))
                }
              >
                <option value="regelmatig">regelmatig</option>
                <option value="soms">soms</option>
                <option value="zelden">zelden</option>
              </select>
            </Field>

            <Field label="Hoe vaak per week eet je buiten de deur (richting)">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase2.eatOutPerWeek}
                onChange={(e) =>
                  setPhase2((p) => ({ ...p, eatOutPerWeek: e.target.value }))
                }
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3+">3+</option>
              </select>
            </Field>

            <Field label='Eerlijke vraag: eet je vaak uit gewoonte of uit echte trek?'>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase2.habitVsHunger}
                onChange={(e) =>
                  setPhase2((p) => ({
                    ...p,
                    habitVsHunger: e.target.value,
                  }))
                }
              >
                <option value="meestal trek">meestal trek</option>
                <option value="soms gewoonte">soms gewoonte</option>
                <option value="vaak gewoonte">vaak gewoonte</option>
                <option value="weet ik niet">weet ik niet</option>
              </select>
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
              >
                Terug
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Opslaan..." : "Verder naar fase 3"}
              </button>
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <form className="mt-8 space-y-5" onSubmit={onSubmitPhase3}>
            <Field label="Eetstijl">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase3.dietStyle}
                onChange={(e) =>
                  setPhase3((p) => ({ ...p, dietStyle: e.target.value }))
                }
              >
                <option value="alleseter">alleseter</option>
                <option value="flexitariër">flexitariër</option>
                <option value="pescotariër">pescotariër</option>
                <option value="vegetariër">vegetariër</option>
                <option value="veganist">veganist</option>
                <option value="animal-based">animal-based</option>
                <option value="anders">anders / eigen mix</option>
              </select>
            </Field>

            <div>
              <p className="text-sm font-medium text-stone-800">Allergieën</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {allergyOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm text-stone-700"
                  >
                    <input
                      type="checkbox"
                      checked={phase3.allergies.includes(opt)}
                      onChange={() => toggleStringArrayValue("allergies", opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-stone-800">
                Intoleranties / gevoeligheden
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {intoleranceOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm text-stone-700"
                  >
                    <input
                      type="checkbox"
                      checked={phase3.intolerances.includes(opt)}
                      onChange={() =>
                        toggleStringArrayValue("intolerances", opt)
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <Field
              label="Niet-lekker-lijst"
              hint="Geen oordeel — dit helpt ons variatie te bouwen zonder ‘nee-foods’."
            >
              <textarea
                className="min-h-[96px] w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase3.dislikes}
                onChange={(e) =>
                  setPhase3((p) => ({ ...p, dislikes: e.target.value }))
                }
              />
            </Field>

            <Field
              label="Specifieke dingen om rekening mee te houden"
              hint="Optioneel. Bijvoorbeeld geuren, textuur, praktische beperkingen."
            >
              <textarea
                className="min-h-[96px] w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase3.notes}
                onChange={(e) =>
                  setPhase3((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
              >
                Terug
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Opslaan..." : "Verder naar fase 4"}
              </button>
            </div>
          </form>
        ) : null}

        {step === 4 ? (
          <form className="mt-8 space-y-5" onSubmit={onSubmitPhase4}>
            <Field label="Stoelgang">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase4.bowelRegularity}
                onChange={(e) =>
                  setPhase4((p) => ({
                    ...p,
                    bowelRegularity: e.target.value,
                  }))
                }
              >
                <option value="regelmatig dagelijks">regelmatig dagelijks</option>
                <option value="onregelmatig">onregelmatig</option>
                <option value="vaak diarree">vaak diarree</option>
                <option value="vaak verstopping">vaak verstopping</option>
                <option value="wisselend">wisselend</option>
              </select>
            </Field>

            <Field label="Vaak opgeblazen gevoel?">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase4.bloating}
                onChange={(e) =>
                  setPhase4((p) => ({ ...p, bloating: e.target.value }))
                }
              >
                <option value="nee">nee</option>
                <option value="soms">soms</option>
                <option value="ja">ja</option>
              </select>
            </Field>

            <Field label="Bekend darmprobleem?">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase4.gutIssue}
                onChange={(e) =>
                  setPhase4((p) => ({ ...p, gutIssue: e.target.value }))
                }
              >
                <option value="nee">nee</option>
                <option value="ja">ja, namelijk…</option>
                <option value="weet niet">weet niet</option>
              </select>
            </Field>

            {phase4.gutIssue === "ja" ? (
              <Field
                label="Welk darmprobleem (of diagnose in behandeling)?"
                hint="Vrijwillig; helpt ons je traject beter af te stemmen."
              >
                <textarea
                  className="min-h-[88px] w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  value={phase4.gutIssueDetail}
                  onChange={(e) =>
                    setPhase4((p) => ({ ...p, gutIssueDetail: e.target.value }))
                  }
                />
              </Field>
            ) : null}

            <Field label="Hoe ga je nu om met zuivel?">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase4.dairyApproach}
                onChange={(e) =>
                  setPhase4((p) => ({ ...p, dairyApproach: e.target.value }))
                }
              >
                <option value="hoofdzakelijk rauwe zuivel">
                  Hoofdzakelijk rauwe zuivel
                </option>
                <option value="hoofdzakelijk biologische zuivel">
                  Hoofdzakelijk biologische zuivel
                </option>
                <option value="regulier">reguliere supermarkt-zuivel</option>
                <option value="hoofdzakelijk plantaardige zuivel">
                  Hoofdzakelijk plantaardige "zuivel"
                </option>
                <option value="vermijd ik">vermijd ik</option>
              </select>
            </Field>

            <Field label="Hoe ga je nu om met gluten?">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase4.glutenApproach}
                onChange={(e) =>
                  setPhase4((p) => ({ ...p, glutenApproach: e.target.value }))
                }
              >
                <option value="eet ik gewoon">eet ik gewoon</option>
                <option value="eet ik minimaal">eet ik minimaal</option>
                <option value="vermijd ik">vermijd ik</option>
              </select>
            </Field>

            <Field label="Hoe reageer je op peulvruchten?">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase4.legumeApproach}
                onChange={(e) =>
                  setPhase4((p) => ({ ...p, legumeApproach: e.target.value }))
                }
              >
                <option value="eet ik gewoon zonder klachten">
                  Eet ik gewoon zonder klachten
                </option>
                <option value="word ik opgeblazen / winderig van">
                  Word ik opgeblazen / winderig van
                </option>
                <option value="vermijd ik">Vermijd ik</option>
              </select>
            </Field>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Darmklachten nu zeggen iets over je huidige belastbaarheid, niet over
                  "voor altijd".
                </li>
                <li>
                  Als je darmwand en vertering herstellen, kan tolerantie voor bepaalde
                  producten later verbeteren.
                </li>
              </ul>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Koffie">
                <select
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  value={phase4.coffeeIntake}
                  onChange={(e) =>
                    setPhase4((p) => ({ ...p, coffeeIntake: e.target.value }))
                  }
                >
                  <option value="geen">geen</option>
                  <option value="1-2 per dag">1-2 per dag</option>
                  <option value="3+ per dag">3+ per dag</option>
                </select>
              </Field>
              <Field label="Alcohol">
                <select
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  value={phase4.alcoholIntake}
                  onChange={(e) =>
                    setPhase4((p) => ({ ...p, alcoholIntake: e.target.value }))
                  }
                >
                  <option value="geen">geen</option>
                  <option value="1-2 per week">1-2 per week</option>
                  <option value="3-5 per week">3-5 per week</option>
                  <option value="dagelijks">dagelijks</option>
                </select>
              </Field>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
              >
                Terug
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Opslaan..." : "Verder naar fase 5"}
              </button>
            </div>
          </form>
        ) : null}

        {step === 5 ? (
          <form className="mt-8 space-y-5" onSubmit={onSubmitPhase5}>
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Deze cyclusinformatie gebruiken we nu vooral als intake-inzicht voor
                  begeleiding.
                </li>
                <li>
                  Een latere versie kan weekmenu's per cyclusfase verfijnen.
                </li>
              </ul>
            </div>
            <Field label="Cyclus / levensfase">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase5.cycleStatus}
                onChange={(e) =>
                  setPhase5((p) => ({ ...p, cycleStatus: e.target.value }))
                }
              >
                <option value="cyclisch">cyclisch (regelbare cyclus)</option>
                <option value="onregelmatig / perimenopauze">
                  onregelmatig / perimenopauze
                </option>
                <option value="postmenopauze">postmenopauze</option>
                <option value="liever niet">liever niet zeggen</option>
                <option value="weet niet">weet niet</option>
              </select>
            </Field>

            {phase5.cycleStatus === "cyclisch" ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Laatste menstruatie (datum)">
                  <input
                    type="date"
                    className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                    value={phase5.cycleLastPeriod}
                    onChange={(e) =>
                      setPhase5((p) => ({
                        ...p,
                        cycleLastPeriod: e.target.value,
                      }))
                    }
                    required
                  />
                </Field>
                <Field label="Gemiddelde cycluslengte (dagen)">
                  <input
                    inputMode="numeric"
                    className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                    value={phase5.cycleLength}
                    onChange={(e) =>
                      setPhase5((p) => ({
                        ...p,
                        cycleLength: e.target.value,
                      }))
                    }
                    required
                  />
                </Field>
              </div>
            ) : (
              <p className="text-sm text-stone-600">
                Geen probleem — we gebruiken dit alleen als het voor jou relevant
                is. Je kunt dit later altijd aanpassen in je profiel.
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onSkipPhase5}
                disabled={isPending}
                className="w-full rounded-xl border-2 border-dashed border-stone-400 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-100 disabled:opacity-60"
              >
                Cyclus overslaan (optioneel)
              </button>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
                >
                  Terug
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Opslaan..." : "Verder naar fase 6"}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {step === 6 ? (
          <form className="mt-8 space-y-5" onSubmit={onSubmitPhase6}>
            <div>
              <p className="text-sm font-medium text-stone-800">Doelen</p>
              <p className="mt-1 text-xs text-stone-500">
                Meerdere opties mogelijk.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {goalOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm text-stone-700"
                  >
                    <input
                      type="checkbox"
                      checked={phase6.goals.includes(opt)}
                      onChange={() => toggleStringArrayValue("goals", opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <Field label="Anders (optioneel)">
              <input
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase6.goalsOther}
                onChange={(e) =>
                  setPhase6((p) => ({ ...p, goalsOther: e.target.value }))
                }
                placeholder="bv. minder stress rond eten voor het gezin"
              />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
              >
                Terug
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Opslaan..." : "Verder naar fase 7"}
              </button>
            </div>
          </form>
        ) : null}

        {step === 7 ? (
          <form className="mt-8 space-y-5" onSubmit={onSubmitPhase7}>
            <Field label="Heb je je Zinzino BalanceTest gedaan?">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase7.hasBalanceTest}
                onChange={(e) =>
                  setPhase7((p) => ({
                    ...p,
                    hasBalanceTest: e.target.value as
                      | "yes_now"
                      | "yes_later"
                      | "no",
                  }))
                }
              >
                <option value="yes_now">Ja, ik vul de waarden nu in</option>
                <option value="yes_later">Ja, maar later invullen</option>
                <option value="no">Nee, nog niet</option>
              </select>
            </Field>

            <div>
              <p className="text-sm font-medium text-stone-800">
                Gebruik je aanvullende voeding (optioneel)
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {supplementOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm text-stone-700"
                  >
                    <input
                      type="checkbox"
                      checked={phase7.supplementsUsed.includes(opt)}
                      onChange={() =>
                        toggleStringArrayValue("supplementsUsed", opt)
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <Field label="Toelichting supplementen (optioneel)">
              <input
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={phase7.supplementsOther}
                onChange={(e) =>
                  setPhase7((p) => ({ ...p, supplementsOther: e.target.value }))
                }
                placeholder="bv. merk/productnaam"
              />
            </Field>

            {phase7.hasBalanceTest === "yes_now" ? (
              <div className="space-y-5 rounded-2xl border border-stone-200 bg-stone-50 p-6">
                <p className="text-sm text-stone-700">
                  Vul de waarden in zoals op je rapport. Leeg laten mag — maar
                  datum is verplicht.
                </p>

                <Field label="Datum van de test">
                  <input
                    type="date"
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                    value={phase7.testDate}
                    onChange={(e) =>
                      setPhase7((p) => ({ ...p, testDate: e.target.value }))
                    }
                    required
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Omega 3 totaal">
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                      value={phase7.omega3Total}
                      onChange={(e) =>
                        setPhase7((p) => ({
                          ...p,
                          omega3Total: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Omega 6 totaal">
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                      value={phase7.omega6Total}
                      onChange={(e) =>
                        setPhase7((p) => ({
                          ...p,
                          omega6Total: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Omega 6:3 ratio">
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                      value={phase7.omegaRatio}
                      onChange={(e) =>
                        setPhase7((p) => ({
                          ...p,
                          omegaRatio: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="AA:EPA ratio">
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                      value={phase7.aaEpaRatio}
                      onChange={(e) =>
                        setPhase7((p) => ({
                          ...p,
                          aaEpaRatio: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Verzadigd vet">
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                      value={phase7.saturatedFat}
                      onChange={(e) =>
                        setPhase7((p) => ({
                          ...p,
                          saturatedFat: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Enkelvoudig onverzadigd vet">
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                      value={phase7.monounsaturated}
                      onChange={(e) =>
                        setPhase7((p) => ({
                          ...p,
                          monounsaturated: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>

                <Field label="Transvet">
                  <input
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                    value={phase7.transFat}
                    onChange={(e) =>
                      setPhase7((p) => ({ ...p, transFat: e.target.value }))
                    }
                  />
                </Field>

                <div>
                  <p className="text-sm font-medium text-stone-800">
                    Individuele vetzuren (zoals op je rapport)
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Vul de 11 waarden in indien beschikbaar; leeg laten mag.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {INDIVIDUAL_FATTY_ACID_FIELDS.map((f) => (
                      <Field key={f.key} label={f.label}>
                        <input
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                          value={phase7.fattyAcids[f.key] ?? ""}
                          onChange={(e) =>
                            setPhase7((p) => ({
                              ...p,
                              fattyAcids: {
                                ...p.fattyAcids,
                                [f.key]: e.target.value,
                              },
                            }))
                          }
                        />
                      </Field>
                    ))}
                  </div>
                </div>

                <Field
                  label="Opmerking bij individuele vetzuren (optioneel)"
                  hint="Vrij veld voor toelichting of afwijkingen op het rapport."
                >
                  <textarea
                    className="min-h-[80px] w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                    value={phase7.individualFattyAcidsNote}
                    onChange={(e) =>
                      setPhase7((p) => ({
                        ...p,
                        individualFattyAcidsNote: e.target.value,
                      }))
                    }
                  />
                </Field>

                <p className="text-xs leading-relaxed text-stone-600">
                  Deze tool stelt geen diagnose en geeft geen medisch advies. Voor een
                  professionele beoordeling van je vetzurenwaarden raden we een consult
                  aan met een gekwalificeerd voedingsdeskundige.
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Celhardheid">
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                      value={phase7.cellHardness}
                      onChange={(e) =>
                        setPhase7((p) => ({
                          ...p,
                          cellHardness: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Mentale kracht">
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                      value={phase7.mentalStrength}
                      onChange={(e) =>
                        setPhase7((p) => ({
                          ...p,
                          mentalStrength: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(6)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
              >
                Terug
              </button>
              <button
                type="submit"
                disabled={isFinishing}
                className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isFinishing ? "Afronden..." : "Opslaan en naar dashboard"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  hint?: string;
  /** Optioneel handmatig uitzetten; normaal tonen we alleen als er content in WHY_WE_ASK_CONTENT staat. */
  hideWhy?: boolean;
  whyId?: string;
  children: ReactNode;
}) {
  const whyKey =
    props.whyId ??
    props.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64);
  const whyText = WHY_WE_ASK_CONTENT[whyKey];

  return (
    <div className="block">
      <span className="text-sm font-medium text-stone-800">{props.label}</span>
      {props.hint ? (
        <span className="mt-1 block text-xs text-stone-500">{props.hint}</span>
      ) : null}
      {!props.hideWhy && whyText ? <WhyWeAsk id={whyKey}>{whyText}</WhyWeAsk> : null}
      <div className="mt-2">{props.children}</div>
    </div>
  );
}
