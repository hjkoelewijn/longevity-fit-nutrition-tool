"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { WeekPlanPayload } from "@/lib/weekplan/types";
import { carbProfileNl } from "@/lib/weekplan/carb-labels";
import { toggleMealDoneAction } from "./actions";

export type MealPlanRow = {
  id: string;
  week_start: string;
  cook_sessions_per_week: number;
  snacks_enabled: boolean;
  payload: WeekPlanPayload;
  user_meta: {
    completedMealIds?: string[];
    hydrationStatus?: "hydrating" | "ready" | "failed";
    hydrationError?: string | null;
  } | null;
};

const slotLabel: Record<string, string> = {
  ontbijt: "Ontbijt",
  lunch: "Lunch",
  diner: "Diner",
  tussendoortje: "Tussendoortje",
};

function servingsLabel(slot: string, servings: number): string {
  return servings === 1 ? `1 portie (${slotLabel[slot] ?? slot})` : `${servings} porties`;
}

/**
 * Browser-timeout:
 * - development: ruimer om lokaal debuggen mogelijk te maken bij trage model-calls
 * - production: strakker voor deelnemers-UX
 */
const GENERATE_TIMEOUT_MS =
  process.env.NODE_ENV === "development" ? 900_000 : 540_000;

function nextMondayIso(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (8 - day) % 7 || 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

function formatWeekStartNl(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });
}

export function WeekplanClient({
  initialPlan,
}: {
  initialPlan: MealPlanRow | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [genLoading, setGenLoading] = useState(false);
  const [genElapsedSec, setGenElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [weekStart, setWeekStart] = useState(nextMondayIso);
  const [cook, setCook] = useState<3 | 5 | 7>(5);
  const [snacks, setSnacks] = useState(false);

  useEffect(() => {
    if (initialPlan?.user_meta?.hydrationStatus !== "hydrating") return;
    const id = window.setInterval(() => {
      router.refresh();
    }, 15000);
    return () => window.clearInterval(id);
  }, [initialPlan?.id, initialPlan?.user_meta?.hydrationStatus, router]);

  useEffect(() => {
    if (!genLoading) return;
    const id = window.setInterval(() => {
      setGenElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [genLoading]);

  async function fetchWithUrlFallback(
    absoluteUrl: string,
    relativeUrl: string,
    init: RequestInit,
  ) {
    try {
      return await fetch(absoluteUrl, init);
    } catch (err) {
      const isInvalidValue =
        err instanceof TypeError &&
        String(err.message).toLowerCase().includes("invalid value");
      if (!isInvalidValue) {
        throw err;
      }
      return fetch(relativeUrl, init);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenElapsedSec(0);
    setGenLoading(true);
    const ac = new AbortController();
    const timeoutId = window.setTimeout(() => ac.abort(), GENERATE_TIMEOUT_MS);
    try {
      const generateUrl = new URL(
        "/api/weekplan/generate",
        window.location.origin,
      ).toString();
      const generateInit: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start_iso: weekStart,
          cook_sessions_per_week: cook,
          snacks_enabled: snacks,
        }),
        signal: ac.signal,
      };
      const res = await fetchWithUrlFallback(
        generateUrl,
        "/api/weekplan/generate",
        generateInit,
      );
      const raw = await res.text();
      let data: {
        error?: string;
        code?: string;
        retry?: boolean;
        mealPlanId?: string;
      } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as {
            error?: string;
            code?: string;
            retry?: boolean;
            mealPlanId?: string;
          };
        } catch {
          if (!res.ok) {
            const shortBody = raw.slice(0, 120).trim();
            setError(
              `Serverfout (${res.status}). ${shortBody || "Geen JSON-respons ontvangen."}`,
            );
            return;
          }
        }
      }
      if (!res.ok) {
        const msg = data.error ?? `Fout (${res.status})`;
        const codePart = data.code ? ` [${data.code}]` : "";
        setError(
          res.status === 422
            ? `${msg}${codePart}${data.retry ? " — klik opnieuw op Weekplan maken voor een nieuwe poging." : ""}`
            : msg,
        );
        return;
      }
      if (typeof data.mealPlanId === "string" && data.mealPlanId) {
        const hydrateUrl = new URL(
          "/api/weekplan/hydrate",
          window.location.origin,
        ).toString();
        const hydrateInit: RequestInit = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meal_plan_id: data.mealPlanId }),
        };
        void fetchWithUrlFallback(
          hydrateUrl,
          "/api/weekplan/hydrate",
          hydrateInit,
        ).catch((hydrateErr) => {
          console.error("[weekplan/hydrate] client trigger failed", hydrateErr);
        });
      }
      router.refresh();
    } catch (err) {
      const aborted =
        (err instanceof DOMException || err instanceof Error) &&
        err.name === "AbortError";
      if (aborted) {
        setError(
          process.env.NODE_ENV === "development"
            ? "Het duurde langer dan 15 minuten. Kijk in het terminalvenster waar `npm run dev` draait (regels `[weekplan/generate]`). Staat daar geen succesvolle POST, dan liep de API vast — probeer opnieuw of kies een sneller model via ANTHROPIC_MODEL in .env.local."
            : "Het duurt langer dan verwacht. Probeer opnieuw; bij herhaling neem contact op.",
        );
        return;
      }
      setError("Netwerkfout. Probeer opnieuw.");
    } finally {
      window.clearTimeout(timeoutId);
      setGenLoading(false);
      setGenElapsedSec(0);
    }
  }

  const completed = new Set(
    Array.isArray(initialPlan?.user_meta?.completedMealIds)
      ? initialPlan!.user_meta!.completedMealIds
      : [],
  );

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">
          Nieuw weekplan genereren
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Op basis van je profiel en (indien aanwezig) je balanstest.{" "}
          {process.env.NODE_ENV === "development" ? (
            <>
              Reken op soms <strong>meerdere minuten</strong> (groot JSON-plan).
              In de terminal van <code className="text-xs">npm run dev</code> zie
              je voortgang (<code className="text-xs">[weekplan/generate]</code>).
            </>
          ) : (
            <>Dit kan een paar minuten duren.</>
          )}
        </p>
        <form onSubmit={handleGenerate} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="week_start"
              className="block text-sm font-medium text-stone-800"
            >
              Week start (maandag)
            </label>
            <input
              id="week_start"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-xl border border-stone-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-stone-800">
              Kooksessies per week
            </legend>
            <details className="mt-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-left text-xs text-amber-950">
              <summary className="cursor-pointer font-medium text-amber-900">
                Wat betekent dit?
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed">
                <li>
                  <strong>Kooksessies</strong> = hoe vaak je per week echt aan het
                  fornuis staat voor het <strong>diner</strong> dat je zelf wilt koken.
                </li>
                <li>
                  Kies je bijvoorbeeld <strong>3×</strong>, dan vult het plan de week
                  met <strong>dubbel koken / tweede dag hetzelfde gerecht</strong>, en —
                  als dat in je profiel staat — je aangegeven frequentie{" "}
                  <strong>uit eten</strong>.
                </li>
              </ul>
            </details>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {([3, 5, 7] as const).map((n) => (
                <label key={n} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="cook"
                    checked={cook === n}
                    onChange={() => setCook(n)}
                  />
                  {n}× per week koken
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-stone-800">
            <input
              type="checkbox"
              checked={snacks}
              onChange={(e) => setSnacks(e.target.checked)}
            />
            Tussendoortjes meenemen (max. 4 eetmomenten per dag)
          </label>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={genLoading}
            className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {genLoading
              ? `Bezig met genereren… (${genElapsedSec}s)`
              : "Weekplan maken"}
          </button>
        </form>
      </section>

      {initialPlan ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Jouw week</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={`/weekplan/boodschappen?mp=${initialPlan.id}`}
                className="font-medium text-stone-900 underline-offset-4 hover:underline"
              >
                Boodschappenlijst
              </Link>
            </div>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Week van {formatWeekStartNl(initialPlan.week_start)} · {initialPlan.cook_sessions_per_week}{" "}
            kooksessies
            {initialPlan.snacks_enabled ? " · met tussendoortjes" : ""}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-stone-500">
            <li>Portieregel: alle recepten hebben een basisportie van 1 en zijn schaalbaar.</li>
            <li>
              Intuïtief eten: zie porties als richtlijn en luister naar trek/verzadiging
              (actieve dag = vaak meer trek).
            </li>
            <li>
              Bordvolgorde: start met groente + eiwit, daarna vetten, daarna
              koolhydraten.
            </li>
          </ul>
          {initialPlan.user_meta?.hydrationStatus === "hydrating" ? (
            <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              Je weekplan staat klaar. We vullen nu de recepten verder aan (1-3
              min). Deze pagina ververst automatisch.
            </p>
          ) : null}
          {initialPlan.user_meta?.hydrationStatus === "failed" ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Aanvullen van receptdetails is nog niet gelukt.
              {initialPlan.user_meta.hydrationError
                ? ` ${initialPlan.user_meta.hydrationError}`
                : ""}
            </p>
          ) : null}

          <div className="mt-6 space-y-8">
            {initialPlan.payload.days.map((day) => {
              const d = new Date(day.date_iso + "T12:00:00");
              const dayTitle = d.toLocaleDateString("nl-NL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              });
              const meals = [
                day.meals.ontbijt,
                day.meals.lunch,
                day.meals.diner,
                ...(day.tussendoortjes ?? []),
              ];
              return (
                <div key={day.date_iso}>
                  <h3 className="border-b border-stone-200 pb-2 text-base font-medium capitalize text-stone-900">
                    {dayTitle}
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {meals.map((m) => {
                      const done = completed.has(m.id);
                      return (
                        <li
                          key={m.id}
                          className="flex flex-col gap-2 rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                              {slotLabel[m.slot] ?? m.slot}
                            </p>
                            <Link
                              href={`/weekplan/recept/${encodeURIComponent(m.id)}?mp=${initialPlan.id}`}
                              className="mt-0.5 block text-sm font-semibold text-stone-900 underline-offset-4 hover:underline"
                            >
                              {m.title}
                            </Link>
                            <p className="mt-1 text-xs text-stone-600">
                              {m.prep_minutes} min · {servingsLabel(m.slot, m.servings)} ·
                              {" "}koolhydraatmoment:{" "}
                              {carbProfileNl(m.carb_profile)}
                            </p>
                          </div>
                          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-stone-700">
                            <input
                              type="checkbox"
                              checked={done}
                              disabled={pending}
                              onChange={() => {
                                startTransition(async () => {
                                  await toggleMealDoneAction({
                                    mealPlanId: initialPlan.id,
                                    mealId: m.id,
                                    done: !done,
                                  });
                                  router.refresh();
                                });
                              }}
                            />
                            Gemaakt
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <p className="text-sm text-stone-600">
          Nog geen weekplan. Vul het formulier hierboven in om je eerste plan te
          laten maken.
        </p>
      )}
    </div>
  );
}
