import type { OverPaginaData } from "@/src/data/overContent";
import { OverSectie } from "@/src/components/OverSectie";
import { OverPageViewTracker } from "@/src/features/over/OverPageViewTracker";

export function OverPagina({ data }: { data: OverPaginaData }) {
  const visie = data.secties.find((s) => s.id === "visie" && s.zichtbaar);

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-10 sm:px-6 sm:py-14">
      <OverPageViewTracker />
      <div className="mx-auto w-full max-w-[680px] space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.18em] text-stone-500">Longevity Fit</p>
          <h1 className="text-4xl font-semibold text-[#2A2520] sm:text-5xl">{data.paginaTitel}</h1>
        </header>

        {visie ? (
          <OverSectie
            id={visie.id}
            titel={visie.titel}
            subtitel={visie.subtitel}
            blocks={visie.blocks ?? []}
          />
        ) : null}
      </div>
    </main>
  );
}

