import Link from "next/link";
import type { RichtlijnenPaginaData } from "@/src/data/richtlijnen";
import { RichtlijnenSectie } from "@/src/components/RichtlijnenSectie";

function renderFooterText(text: string) {
  const m = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!m) return text;
  const [full, label, href] = m;
  const [before, after] = text.split(full);
  return (
    <>
      {before}
      <Link href={href} className="underline decoration-[#D4AF37] underline-offset-4">
        {label}
      </Link>
      {after}
    </>
  );
}

export function RichtlijnenPagina({ data }: { data: RichtlijnenPaginaData }) {
  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.18em] text-stone-500">Longevity Fit</p>
          <h1 className="text-4xl font-semibold text-[#2A2520] sm:text-5xl">{data.titel}</h1>
          <p className="text-base text-stone-700 sm:text-lg">{data.subtitel}</p>
        </header>

        <section className="rounded-2xl border border-[#E8DCC8] bg-[#E8DCC8] p-6">
          <p className="whitespace-pre-line text-base leading-relaxed text-stone-800">{data.intro}</p>
        </section>

        {data.secties.map((sectie) => (
          <RichtlijnenSectie
            key={sectie.id}
            titel={sectie.titel}
            richtlijnen={data.richtlijnen.filter((r) => sectie.richtlijnen.includes(r.nummer))}
          />
        ))}

        <footer className="rounded-2xl border border-stone-300 bg-white/60 p-5 text-sm italic text-stone-700">
          {renderFooterText(data.footerDisclaimer)}
        </footer>
      </div>
    </main>
  );
}

