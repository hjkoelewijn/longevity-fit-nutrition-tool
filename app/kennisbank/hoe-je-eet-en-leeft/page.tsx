import { KennisbankCategoriePagina } from "@/src/features/kennisbank/KennisbankCategoriePagina";
import { kennisbankCategorieen } from "@/src/data/kennisbank";
import { tussendoortjesModule } from "@/src/data/modules/tussendoortjes";
import { hoeJeEetModule } from "@/src/data/modules/hoe-je-eet";

export const dynamic = "force-dynamic";

const categorie = kennisbankCategorieen.find((c) => c.id === "hoe-je-eet-en-leeft")!;

const modulesMeta = [
  {
    id: tussendoortjesModule.id,
    subtitel: tussendoortjesModule.subtitel,
    leestijdMinuten: tussendoortjesModule.leestijdMinuten,
  },
  {
    id: hoeJeEetModule.id,
    subtitel: hoeJeEetModule.subtitel,
    leestijdMinuten: hoeJeEetModule.leestijdMinuten,
  },
];

export default function HoeJeEetEnLeeftCategoriePage() {
  return <KennisbankCategoriePagina categorie={categorie} modulesMeta={modulesMeta} />;
}
