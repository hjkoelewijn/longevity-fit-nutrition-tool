import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isUuid, moduleDisplayTitle, moduleSummary } from "@/lib/catalog";
import { markModuleCompleteAction } from "../actions";

export const dynamic = "force-dynamic";

function renderSimpleMarkdown(md: string) {
  const lines = md.split("\n");
  const blocks: Array<
    | { type: "h2" | "h3" | "p"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
  > = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2).trim());
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const pLines = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next || next.startsWith("## ") || next.startsWith("### ") || next.startsWith("- ")) {
        break;
      }
      pLines.push(next);
      i += 1;
    }
    blocks.push({ type: "p", text: pLines.join(" ") });
  }

  return blocks.map((b, idx) => {
    if (b.type === "h2") {
      return (
        <h2 key={`h2-${idx}`} className="mt-6 text-xl font-semibold text-stone-900 first:mt-0">
          {b.text}
        </h2>
      );
    }
    if (b.type === "h3") {
      return (
        <h3 key={`h3-${idx}`} className="mt-5 text-lg font-semibold text-stone-900 first:mt-0">
          {b.text}
        </h3>
      );
    }
    if (b.type === "ul") {
      return (
        <ul key={`ul-${idx}`} className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-800">
          {b.items.map((item, itemIdx) => (
            <li key={itemIdx}>{item}</li>
          ))}
        </ul>
      );
    }
    if (b.type === "ol") {
      return (
        <ol key={`ol-${idx}`} className="mt-3 list-decimal space-y-1 pl-5 text-sm text-stone-800">
          {b.items.map((item, itemIdx) => (
            <li key={itemIdx}>{item}</li>
          ))}
        </ol>
      );
    }
    return (
      <p key={`p-${idx}`} className="mt-3 text-sm leading-relaxed text-stone-800 first:mt-0">
        {b.text}
      </p>
    );
  });
}

export default async function ModuleDetailPage(props: {
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
    ? supabase.from("learning_modules").select("*").eq("id", slug).maybeSingle()
    : supabase.from("learning_modules").select("*").eq("slug", slug).maybeSingle();

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

  const m = row as Record<string, unknown>;
  if (m.published === false) {
    notFound();
  }

  const id = String(m.id ?? "");
  const title = moduleDisplayTitle(m);
  const summary = moduleSummary(m);
  const body =
    typeof m.content_md === "string" && m.content_md.trim()
      ? m.content_md.trim()
      : typeof m.content === "string" && m.content.trim()
        ? m.content.trim()
        : "Inhoud volgt.";
  const category =
    typeof m.category === "string" && m.category.trim() ? m.category.trim() : null;

  const { data: completion } = await supabase
    .from("module_completions")
    .select("id")
    .eq("user_id", user.id)
    .eq("module_id", id)
    .maybeSingle();

  const isDone = Boolean(completion);
  const { data: relatedRows } = category
    ? await supabase
        .from("learning_modules")
        .select("id,slug,title")
        .eq("category", category)
        .neq("id", id)
        .order("sort_order", { ascending: true })
        .limit(3)
    : { data: [] };
  const related = (relatedRows ?? []) as Record<string, unknown>[];

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Module
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">{title}</h1>
            {summary ? <p className="mt-3 text-stone-600">{summary}</p> : null}
          </div>
          <Link
            href="/leren"
            className="shrink-0 text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            ← Alle modules
          </Link>
        </div>

        <article className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div>{renderSimpleMarkdown(body)}</div>
        </article>

        {isDone ? (
          <p className="text-sm font-medium text-emerald-800">Je hebt deze module afgerond.</p>
        ) : (
          <form action={markModuleCompleteAction} className="flex flex-wrap items-center gap-4">
            <input type="hidden" name="module_id" value={id} />
            <button
              type="submit"
              className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Markeer als afgerond
            </button>
          </form>
        )}

        {related.length > 0 ? (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Gerelateerde modules
            </h2>
            <ul className="mt-3 space-y-2">
              {related.map((r) => {
                const relatedId = String(r.id ?? "");
                const relatedSlug =
                  typeof r.slug === "string" && r.slug.trim() ? r.slug.trim() : relatedId;
                return (
                  <li key={relatedId || relatedSlug}>
                    <Link
                      href={`/leren/${encodeURIComponent(relatedSlug)}`}
                      className="text-sm text-stone-900 underline-offset-4 hover:underline"
                    >
                      {moduleDisplayTitle(r)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
