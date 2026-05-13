import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  isUuid,
  recipeDisplayTitle,
  recipeSummary,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await props.params;
  const slug = decodeURIComponent(raw);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const q = isUuid(slug)
    ? supabase.from("recipes").select("*").eq("id", slug).maybeSingle()
    : supabase.from("recipes").select("*").eq("slug", slug).maybeSingle();

  const { data: row, error } = await q;

  if (error) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8">
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      </main>
    );
  }

  if (!row) {
    notFound();
  }

  const r = row as Record<string, unknown>;
  const title = recipeDisplayTitle(r);
  const summary = recipeSummary(r);
  const instructions =
    typeof r.instructions === "string" && r.instructions.trim()
      ? r.instructions
      : null;
  const kidTip =
    typeof r.kid_tip === "string" && r.kid_tip.trim() ? r.kid_tip : null;
  const prep =
    typeof r.prep_time_minutes === "number" ? r.prep_time_minutes : null;
  const servings = typeof r.servings === "number" ? r.servings : null;

  let ingredientsList: string[] = [];
  const ing = r.ingredients;
  if (Array.isArray(ing)) {
    ingredientsList = ing
      .map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "item" in x) {
          return String((x as { item?: unknown }).item ?? "");
        }
        return "";
      })
      .filter(Boolean);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Recept
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">{title}</h1>
            {summary ? <p className="mt-3 text-stone-600">{summary}</p> : null}
            <Link
              href="/richtlijnen"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-stone-700 underline underline-offset-4"
            >
              <span aria-hidden>🧭</span>
              Binnen onze richtlijnen
            </Link>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
              {typeof r.meal_type === "string" ? (
                <span className="rounded-full bg-stone-200 px-2 py-0.5">{r.meal_type}</span>
              ) : null}
              {typeof r.season === "string" ? (
                <span className="rounded-full bg-stone-200 px-2 py-0.5">{r.season}</span>
              ) : null}
              {prep !== null ? (
                <span className="rounded-full bg-stone-200 px-2 py-0.5">
                  {prep} min bereiding
                </span>
              ) : null}
              {servings !== null ? (
                <span className="rounded-full bg-stone-200 px-2 py-0.5">
                  {servings} porties
                </span>
              ) : null}
            </div>
          </div>
          <Link
            href="/recipes"
            className="shrink-0 text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            ← Alle recepten
          </Link>
        </div>

        {ingredientsList.length > 0 ? (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Ingrediënten</h2>
            <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-stone-700">
              {ingredientsList.map((line, i) => (
                <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {instructions ? (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Bereiding</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
              {instructions}
            </p>
          </section>
        ) : null}

        {kidTip ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-sm font-semibold text-amber-950">Tip voor (oudere) kids</h2>
            <p className="mt-2 text-sm text-amber-950">{kidTip}</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
