import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { recipeDisplayTitle, recipeSummary } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const MEALS = ["ontbijt", "lunch", "diner", "snack"] as const;
const SEASONS = ["lente", "zomer", "herfst", "winter"] as const;

export default async function RecipesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const meal =
    typeof sp.meal === "string" && MEALS.includes(sp.meal as (typeof MEALS)[number])
      ? sp.meal
      : "";
  const season =
    typeof sp.season === "string" &&
    SEASONS.includes(sp.season as (typeof SEASONS)[number])
      ? sp.season
      : "";
  const diet = typeof sp.diet === "string" ? sp.diet.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase.from("recipes").select("*").order("title", { ascending: true });

  if (meal) {
    query = query.eq("meal_type", meal);
  }
  if (season) {
    query = query.eq("season", season);
  }
  if (diet) {
    query = query.contains("diet_styles", [diet]);
  }

  const { data: rows, error } = await query;

  if (error) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8">
          <h1 className="text-lg font-semibold text-stone-900">Recepten laden mislukt</h1>
          <p className="mt-2 text-sm text-red-700">{error.message}</p>
          <p className="mt-4 text-sm text-stone-600">
            Controleer of <span className="font-mono">004_recipes_learning_catalog.sql</span>{" "}
            in Supabase is uitgevoerd.
          </p>
        </div>
      </main>
    );
  }

  const list = (rows ?? []) as Record<string, unknown>[];

  function hrefWithParams(next: { meal?: string; season?: string; diet?: string }) {
    const p = new URLSearchParams();
    const m = next.meal !== undefined ? next.meal : meal;
    const s = next.season !== undefined ? next.season : season;
    const d = next.diet !== undefined ? next.diet : diet;
    if (m) p.set("meal", m);
    if (s) p.set("season", s);
    if (d) p.set("diet", d);
    const q = p.toString();
    return q ? `/recipes?${q}` : "/recipes";
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Longevity Fit
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">Recepten</h1>
            <p className="mt-2 text-sm text-stone-600">
              Bibliotheek met filters op maaltijd, seizoen en eetstijl (tags).
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Terug naar dashboard
          </Link>
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Filters</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip
              label="Alle maaltijden"
              active={!meal}
              href={hrefWithParams({ meal: "" })}
            />
            {MEALS.map((m) => (
              <FilterChip
                key={m}
                label={m}
                active={meal === m}
                href={hrefWithParams({ meal: meal === m ? "" : m })}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip
              label="Alle seizoenen"
              active={!season}
              href={hrefWithParams({ season: "" })}
            />
            {SEASONS.map((s) => (
              <FilterChip
                key={s}
                label={s}
                active={season === s}
                href={hrefWithParams({ season: season === s ? "" : s })}
              />
            ))}
          </div>
          <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="meal" value={meal} />
            <input type="hidden" name="season" value={season} />
            <label className="block text-sm text-stone-700">
              Tag / eetstijl
              <input
                name="diet"
                defaultValue={diet}
                placeholder="bijv. vegetarisch"
                className="mt-1 w-48 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Zoek
            </button>
            {diet ? (
              <Link
                href={hrefWithParams({ diet: "" })}
                className="text-sm text-stone-600 underline-offset-2 hover:underline"
              >
                Wis tag
              </Link>
            ) : null}
          </form>
        </section>

        <ul className="space-y-3">
          {list.length === 0 ? (
            <li className="rounded-2xl border border-stone-200 bg-white p-8 text-sm text-stone-600">
              Geen recepten gevonden. Voeg recepten toe in Supabase of voer het seed-gedeelte van{" "}
              <span className="font-mono text-stone-900">004_recipes_learning_catalog.sql</span> uit
              (als je bibliotheek nog leeg is).
            </li>
          ) : (
            list.map((row) => {
              const id = String(row.id ?? "");
              const slug =
                typeof row.slug === "string" && row.slug.trim() ? row.slug.trim() : id;
              const href = `/recipes/${encodeURIComponent(slug)}`;
              return (
                <li key={id || slug}>
                  <Link
                    href={href}
                    className="block rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-stone-300"
                  >
                    <h2 className="text-lg font-semibold text-stone-900">
                      {recipeDisplayTitle(row)}
                    </h2>
                    {recipeSummary(row) ? (
                      <p className="mt-2 text-sm text-stone-600">{recipeSummary(row)}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                      {typeof row.meal_type === "string" ? (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5">{row.meal_type}</span>
                      ) : null}
                      {typeof row.season === "string" ? (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5">{row.season}</span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </main>
  );
}

function FilterChip(props: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={props.href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        props.active
          ? "bg-stone-900 text-white"
          : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      {props.label}
    </Link>
  );
}
