import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  updateBalanceTestChoiceAction,
  updateProfileAction,
  upsertLatestBalanceTestAction,
} from "./actions";

export const dynamic = "force-dynamic";

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function ProfileSummary({ profile }: { profile: Record<string, unknown> }) {
  const eating = profile.eating_pattern as Record<string, unknown> | undefined;
  const gut = profile.gut_status as Record<string, unknown> | undefined;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">Jouw gegevens (overzicht)</h2>
      <p className="mt-2 text-sm text-stone-600">
        Klik op &quot;Bewerken&quot; om een sectie in de onboarding-flow te openen. Daar kun je
        Opslaan of Terug naar dit profiel.
      </p>

      <div className="mt-6 space-y-6 text-sm">
        <SummaryBlock
          title="Fase 1 — Wie ben jij"
          editHref="/onboarding?from=profile&step=1"
          rows={[
            ["Naam", profile.name],
            ["Leeftijd", profile.age],
            ["Volwassenen", profile.household_adults],
            ["Kinderen (aantal)", profile.household_children_count],
            ["Kinderen (leeftijden)", profile.household_children],
            ["Kooktijd doordeweeks", profile.cooking_time_weekday],
            ["Kooktijd weekend", profile.cooking_time_weekend],
            ["Sport", `${formatVal(profile.sport_frequency)} / ${formatVal(profile.sport_intensity)}`],
          ]}
        />
        <SummaryBlock
          title="Fase 2 — Hoe eet je nu"
          editHref="/onboarding?from=profile&step=2"
          rows={[
            ["Eetpatroon (JSON)", eating],
          ]}
        />
        <SummaryBlock
          title="Fase 3 — Wat past bij jou"
          editHref="/onboarding?from=profile&step=3"
          rows={[
            ["Eetstijl", profile.diet_style],
            ["Allergieën", profile.allergies],
            ["Intoleranties", profile.intolerances],
            ["Niet-lekker", profile.dislikes],
            ["Extra", profile.notes],
          ]}
        />
        <SummaryBlock
          title="Fase 4 — Hoe sta jij in voeding"
          editHref="/onboarding?from=profile&step=4"
          rows={[
            ["Ervaring", profile.food_experience],
            ["Darm / buik (detail)", gut],
            ["Zuivel", profile.dairy_approach],
            ["Gluten", profile.gluten_approach],
            ["Koffie", profile.coffee_intake],
            ["Alcohol", profile.alcohol_intake],
          ]}
        />
        <SummaryBlock
          title="Fase 5 — Cyclus"
          editHref="/onboarding?from=profile&step=5"
          rows={[
            ["Status", profile.cycle_status],
            ["Laatste menstruatie", profile.cycle_last_period],
            ["Cycluslengte", profile.cycle_length],
          ]}
        />
        <SummaryBlock
          title="Fase 6 — Doelen"
          editHref="/onboarding?from=profile&step=6"
          rows={[["Doelen", profile.goals]]}
        />
        <SummaryBlock
          title="Fase 7 — BalanceTest (keuze)"
          editHref="/onboarding?from=profile&step=7"
          rows={[
            ["Keuze", profile.balance_test_choice],
            ["Aanvullende voeding (profiel)", profile.supplements_used],
          ]}
        />
      </div>
    </section>
  );
}

function SummaryBlock(props: {
  title: string;
  editHref: string;
  rows: [string, unknown][];
}) {
  return (
    <div className="border-t border-stone-100 pt-5 first:border-t-0 first:pt-0">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <dt className="font-medium text-stone-900">{props.title}</dt>
        <Link
          href={props.editHref}
          className="shrink-0 text-xs font-medium text-stone-900 underline-offset-4 hover:underline"
        >
          Bewerken
        </Link>
      </div>
      <dd className="mt-3 space-y-1 text-stone-700">
        {props.rows.map(([k, v]) => (
          <p key={k}>
            <span className="text-stone-500">{k}: </span>
            <span className="whitespace-pre-wrap break-words">{formatVal(v)}</span>
          </p>
        ))}
      </dd>
    </div>
  );
}

function savedMessage(saved: string): string {
  switch (saved) {
    case "profile":
      return "Je profiel is opgeslagen.";
    case "balance_choice":
      return "Je keuze voor de balansmeting is opgeslagen.";
    case "balance_test":
      return "Je balansmeting is opgeslagen.";
    case "onboarding":
      return "Onboarding-sectie bijgewerkt.";
    default:
      if (saved.startsWith("fase_")) {
        return "Je wijzigingen in deze sectie zijn opgeslagen.";
      }
      return "Opgeslagen.";
  }
}

export default async function ProfilePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const saved = typeof searchParams.saved === "string" ? searchParams.saved : null;
  const error =
    typeof searchParams.error === "string" ? searchParams.error : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-red-200 bg-white p-8">
          <h1 className="text-xl font-semibold text-stone-900">
            Profiel kon niet geladen worden
          </h1>
          <p className="mt-2 text-sm text-red-700">{profileError.message}</p>
          <p className="mt-4 text-sm text-stone-600">
            Dit gebeurt vaak als de nieuwe databasevelden nog niet zijn toegevoegd.
            Run in Supabase SQL Editor:{" "}
            <span className="font-mono text-stone-900">
              supabase/002_onboarding_balance_test_fields.sql
            </span>
          </p>
        </div>
      </main>
    );
  }

  const { data: latestTest } = await supabase
    .from("balance_tests")
    .select(
      "id,test_date,omega_3_total,omega_6_total,omega_ratio,aa_epa_ratio,saturated_fat,monounsaturated,trans_fat,individual_fatty_acids,cell_hardness,mental_strength,supplements_used",
    )
    .eq("user_id", user.id)
    .order("test_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const supplementsFromProfile = Array.isArray(profile?.supplements_used)
    ? (profile?.supplements_used as unknown[]).filter(
        (v): v is string => typeof v === "string",
      )
    : [];

  const supplementsFromTest = Array.isArray(latestTest?.supplements_used)
    ? (latestTest?.supplements_used as unknown[]).filter(
        (v): v is string => typeof v === "string",
      )
    : [];

  const supplementsValue =
    supplementsFromTest.length > 0 ? supplementsFromTest : supplementsFromProfile;

  const individualNote =
    latestTest?.individual_fatty_acids &&
    typeof latestTest.individual_fatty_acids === "object" &&
    latestTest.individual_fatty_acids !== null &&
    "note" in latestTest.individual_fatty_acids
      ? String(
          (latestTest.individual_fatty_acids as { note?: unknown }).note ?? "",
        )
      : "";

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {saved ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {savedMessage(saved)}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Longevity Fit
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">
              Profiel
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Pas je basisgegevens aan en vul je BalanceTest later aan wanneer je
              rapport binnen is.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Terug naar dashboard
          </Link>
        </div>

        {profile ? (
          <ProfileSummary profile={profile as Record<string, unknown>} />
        ) : null}

        <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Basis</h2>
              <p className="mt-2 text-sm text-stone-600">
                Kernvelden (ook in onboarding fase 1).
              </p>
            </div>
            <Link
              href="/onboarding?from=profile&step=1"
              className="shrink-0 text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Bewerken in onboarding
            </Link>
          </div>

          <form action={updateProfileAction} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-stone-800">
              Naam
              <input
                name="name"
                defaultValue={profile?.name ?? ""}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-stone-800">
                Leeftijd
                <input
                  name="age"
                  inputMode="numeric"
                  defaultValue={profile?.age ?? ""}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-stone-800">
                Aantal volwassenen
                <input
                  name="household_adults"
                  inputMode="numeric"
                  defaultValue={profile?.household_adults ?? ""}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-stone-800">
                Aantal kinderen
                <input
                  name="household_children_count"
                  inputMode="numeric"
                  defaultValue={profile?.household_children_count ?? 0}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Opslaan
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">BalanceTest</h2>
          <p className="mt-2 text-sm text-stone-600">
            Status is handig als je de test pas later doet. Waarden kun je
            invullen zodra je rapport er is.
          </p>
          <p className="mt-2 text-xs text-stone-600">
            Wil je context bij je uitslag? Lees onze{" "}
            <Link href="/richtlijnen" className="font-medium text-stone-900 underline underline-offset-4">
              richtlijnen
            </Link>
            {" "}en{" "}
            <Link href="/over#visie" className="font-medium text-stone-900 underline underline-offset-4">
              visie
            </Link>
            .
          </p>

          <form action={updateBalanceTestChoiceAction} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-stone-800">
              Waar sta je nu?
              <select
                name="balance_test_choice"
                defaultValue={profile?.balance_test_choice ?? "later"}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              >
                <option value="entered">Ik heb testwaarden ingevuld</option>
                <option value="later">Ik vul later in (nog geen rapport)</option>
                <option value="none">Nog geen test / geen plan</option>
              </select>
            </label>

            <button
              type="submit"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
            >
              Status opslaan
            </button>
          </form>

          <div className="mt-8 border-t border-stone-200 pt-8">
            <h3 className="text-base font-semibold text-stone-900">
              Testwaarden (laatste meting)
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              {latestTest?.id
                ? "We updaten je meest recente meting. (Historiek komt later als aparte tijdlijn.)"
                : "Nog geen meting opgeslagen — dit wordt je eerste meting."}
            </p>

            <form action={upsertLatestBalanceTestAction} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-stone-800">
                Testdatum
                <input
                  type="date"
                  name="test_date"
                  defaultValue={latestTest?.test_date ?? ""}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-stone-800">
                Supplementen (comma-gescheiden)
                <input
                  name="supplements_used"
                  defaultValue={supplementsValue.join(", ")}
                  placeholder="BalanceOil, Magnesium"
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Omega 3 totaal" name="omega_3_total" defaultValue={latestTest?.omega_3_total} />
                <Field label="Omega 6 totaal" name="omega_6_total" defaultValue={latestTest?.omega_6_total} />
                <Field label="Omega 6:3 ratio" name="omega_ratio" defaultValue={latestTest?.omega_ratio} />
                <Field label="AA:EPA ratio" name="aa_epa_ratio" defaultValue={latestTest?.aa_epa_ratio} />
                <Field label="Verzadigd vet" name="saturated_fat" defaultValue={latestTest?.saturated_fat} />
                <Field
                  label="Enkelvoudig onverzadigd vet"
                  name="monounsaturated"
                  defaultValue={latestTest?.monounsaturated}
                />
                <Field label="Transvet" name="trans_fat" defaultValue={latestTest?.trans_fat} />
                <Field label="Celhardheid" name="cell_hardness" defaultValue={latestTest?.cell_hardness} />
                <Field label="Mentale kracht" name="mental_strength" defaultValue={latestTest?.mental_strength} />
              </div>

              <label className="block text-sm font-medium text-stone-800">
                Individuele vetzuren (vrij veld)
                <textarea
                  name="individual_fatty_acids_note"
                  defaultValue={individualNote}
                  className="mt-2 min-h-[120px] w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                />
              </label>

              <p className="text-xs text-stone-500">
                Disclaimer: dit is geen medisch advies en vervangt je Zinzino-rapport
                niet.
              </p>

              <button
                type="submit"
                className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                Testwaarden opslaan
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  name: string;
  defaultValue: string | number | null | undefined;
}) {
  return (
    <label className="block text-sm font-medium text-stone-800">
      {props.label}
      <input
        name={props.name}
        defaultValue={
          props.defaultValue === null || props.defaultValue === undefined
            ? ""
            : String(props.defaultValue)
        }
        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
      />
    </label>
  );
}
