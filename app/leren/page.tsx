import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { moduleDisplayTitle, moduleSummary } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function LerenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: modules, error: modError } = await supabase
    .from("learning_modules")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: doneRows } = await supabase
    .from("module_completions")
    .select("module_id")
    .eq("user_id", user.id);

  const done = new Set(
    (doneRows ?? [])
      .map((r) => r.module_id)
      .filter((id): id is string => typeof id === "string"),
  );

  if (modError) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8">
          <h1 className="text-lg font-semibold text-stone-900">Modules laden mislukt</h1>
          <p className="mt-2 text-sm text-red-700">{modError.message}</p>
        </div>
      </main>
    );
  }

  const list = (modules ?? []) as Record<string, unknown>[];
  const total = list.length;
  const completedN = list.filter((m) => done.has(String(m.id ?? ""))).length;
  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const m of list) {
    const c =
      typeof m.category === "string" && m.category.trim()
        ? m.category.trim()
        : "Algemeen";
    const arr = grouped.get(c) ?? [];
    arr.push(m);
    grouped.set(c, arr);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Longevity Fit
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">Kennisbank</h1>
            <p className="mt-2 text-sm text-stone-600">
              Korte modules over de Longevity Fit voedingsfilosofie. Je voortgang wordt bewaard.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Terug naar dashboard
          </Link>
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-700">
            Je hebt <strong>{completedN}</strong> van <strong>{total}</strong>{" "}
            modules gelezen.
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: total > 0 ? `${Math.round((completedN / total) * 100)}%` : "0%",
              }}
            />
          </div>
        </section>

        <div className="space-y-6">
          {list.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-sm text-stone-600">
              Nog geen modules. Voer{" "}
              <span className="font-mono text-stone-900">004_recipes_learning_catalog.sql</span> uit
              in Supabase om voorbeeldmodules toe te voegen.
            </div>
          ) : (
            [...grouped.entries()].map(([category, modulesInCategory]) => (
              <section key={category}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
                  {category}
                </h2>
                <ul className="space-y-3">
                  {modulesInCategory.map((m) => {
                    const id = String(m.id ?? "");
                    const slug =
                      typeof m.slug === "string" && m.slug.trim() ? m.slug.trim() : id;
                    const href = `/leren/${encodeURIComponent(slug)}`;
                    const complete = done.has(id);
                    return (
                      <li key={id || slug}>
                        <Link
                          href={href}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-stone-300"
                        >
                          <div>
                            <h3 className="text-lg font-semibold text-stone-900">
                              {moduleDisplayTitle(m)}
                            </h3>
                            {moduleSummary(m) ? (
                              <p className="mt-2 text-sm text-stone-600">{moduleSummary(m)}</p>
                            ) : null}
                          </div>
                          {complete ? (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900">
                              Afgerond
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600">
                              Open
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
