import { KennisbankCategorieKaart } from "@/src/components/KennisbankCategorieKaart";
import { KennisbankIntro } from "@/src/components/KennisbankIntro";
import { KennisbankPreviewKaart } from "@/src/components/KennisbankPreviewKaart";
import { kennisbankCategorieen, kennisbankIntro } from "@/src/data/kennisbank";
import { KennisbankPageViewTracker } from "@/src/features/kennisbank/KennisbankPageViewTracker";

export function KennisbankPagina() {
  const actieveCategorieen = kennisbankCategorieen.filter((c) => c.status === "actief");
  const previewCategorieen = kennisbankCategorieen.filter((c) => c.status === "preview");

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-10 sm:px-6 sm:py-14">
      <KennisbankPageViewTracker />
      <div className="mx-auto w-full max-w-4xl space-y-10">
        <header>
          <h1 className="text-5xl italic text-[#2A2520]">Kennisbank</h1>
          <p className="mt-3 text-lg text-stone-700">
            Begrijp wat er in jouw lichaam gebeurt en waarom we doen wat we doen
          </p>
        </header>

        <KennisbankIntro paragraphs={kennisbankIntro} />

        <section className="space-y-4">
          <h2 className="text-3xl italic text-[#2A2520]">Beschikbaar nu</h2>
          {actieveCategorieen.map((categorie) => (
            <KennisbankCategorieKaart key={categorie.id} categorie={categorie} />
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl italic text-[#2A2520]">Binnenkort beschikbaar</h2>
          <p className="text-base text-stone-600">
            De komende weken bouwen we deze kennisbank verder uit. Dit is wat eraan komt:
          </p>
          <div className="space-y-4">
            {previewCategorieen.map((categorie) => (
              <KennisbankPreviewKaart key={categorie.id} categorie={categorie} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

