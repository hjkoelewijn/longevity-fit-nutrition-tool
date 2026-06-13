import Link from "next/link";
import { LeestijdBadge } from "@/src/components/LeestijdBadge";
import { VerdiepingBlok } from "@/src/components/VerdiepingBlok";
import type { LeermoduleData } from "@/src/data/modules/hormonen";
import type { LeermoduleDataMetVerdieping } from "@/src/data/modules/goede-vetten";
import { ModuleTimeTracker } from "@/src/features/kennisbank/ModuleTimeTracker";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <Link key={idx} href={linkMatch[2]} className="font-medium text-[#9C7A22] underline-offset-2 hover:underline">
          {linkMatch[1]}
        </Link>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const blocks: Array<
    | { type: "heading"; text: string }
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[] }
  > = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      blocks.push({ type: "heading", text: line.slice(2, -2).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    const p = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\*\*[^*]+\*\*$/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("- ")
    ) {
      p.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: p.join(" ") });
  }

  return blocks.map((block, idx) => {
    if (block.type === "heading") {
      return (
        <h2 key={idx} className="mt-10 text-2xl font-semibold text-[#2A2520] first:mt-0">
          {block.text}
        </h2>
      );
    }
    if (block.type === "list") {
      return (
        <ul
          key={idx}
          className="mt-4 list-disc space-y-2 pl-5 text-base leading-[1.7] text-[#2A2520] marker:text-[#D4AF37]"
        >
          {block.items.map((item, itemIdx) => (
            <li key={itemIdx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={idx} className="mt-4 text-base leading-[1.7] text-[#2A2520]">
        {renderInline(block.text)}
      </p>
    );
  });
}

type LeermodulePaginaProps = {
  module: LeermoduleData | LeermoduleDataMetVerdieping;
  terug?: { label: string; pad: string };
  volgende?: { label: string; pad: string };
};

function hasVerdieping(m: LeermoduleData | LeermoduleDataMetVerdieping): m is LeermoduleDataMetVerdieping {
  return "verdieping" in m && typeof (m as LeermoduleDataMetVerdieping).verdieping === "string";
}

export function LeermodulePagina({ module, terug, volgende }: LeermodulePaginaProps) {
  const parts = module.content.split("**Tot slot**");
  const mainContent = parts[0] ?? "";
  const totSlotContent = parts[1] ?? "";

  const verdiepingMinuten = hasVerdieping(module)
    ? (module as LeermoduleDataMetVerdieping).leestijdVerdiepingMinuten
    : undefined;

  const verdiepingContent = hasVerdieping(module)
    ? (module as LeermoduleDataMetVerdieping).verdieping
    : undefined;

  const terugLink = terug ?? { label: "← Terug naar kennisbank", pad: "/kennisbank" };

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-10 sm:px-6 sm:py-14">
      <ModuleTimeTracker moduleId={module.id} />
      <div className="mx-auto w-full max-w-[680px] space-y-8">
        <Link
          href={terugLink.pad}
          className="text-sm font-medium text-stone-800 underline underline-offset-4"
        >
          {terugLink.label}
        </Link>

        <header className="space-y-3">
          <h1 className="text-5xl italic text-[#2A2520]">{module.titel}</h1>
          <p className="text-lg text-stone-700">{module.subtitel}</p>
          <LeestijdBadge minuten={module.leestijdMinuten} verdiepingMinuten={verdiepingMinuten} />
        </header>

        <article className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          {renderMarkdown(mainContent)}
          {totSlotContent ? (
            <section className="mt-10 rounded-2xl bg-[#E8DCC8] p-6">
              <h2 className="text-2xl font-semibold text-[#2A2520]">Tot slot</h2>
              <div>{renderMarkdown(totSlotContent)}</div>
            </section>
          ) : null}
          {verdiepingContent ? (
            <VerdiepingBlok moduleId={module.id} content={verdiepingContent} />
          ) : null}
        </article>

        <nav className="flex items-center justify-between gap-4 pt-2">
          <Link
            href={terugLink.pad}
            className="text-sm font-medium text-stone-700 underline underline-offset-4"
          >
            {terugLink.label}
          </Link>
          {volgende && (
            <Link
              href={volgende.pad}
              className="text-sm font-medium text-[#9C7A22] underline underline-offset-4"
            >
              Volgende: {volgende.label} →
            </Link>
          )}
        </nav>

        <footer className="text-sm leading-7 text-stone-600">
          <p>
            <em>
              {module.footerDisclaimer}{" "}
              <Link href="/over#visie" className="underline underline-offset-4">
                Lees meer over onze visie
              </Link>
            </em>
          </p>
        </footer>
      </div>
    </main>
  );
}
