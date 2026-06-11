import { KennisbankCategoriePagina } from "@/src/features/kennisbank/KennisbankCategoriePagina";
import { kennisbankCategorieen } from "@/src/data/kennisbank";
import { eetmomentenModule } from "@/src/data/modules/eetmomenten";
import { koolhydratenModule } from "@/src/data/modules/koolhydraten";
import { goedVettenModule } from "@/src/data/modules/goede-vetten";
import { eiwittenModule } from "@/src/data/modules/eiwitten";
import { bloedsuikerModule } from "@/src/data/modules/bloedsuiker";

export const dynamic = "force-dynamic";

const categorie = kennisbankCategorieen.find((c) => c.id === "de-basis")!;

const modulesMeta = [
  {
    id: eetmomentenModule.id,
    subtitel: eetmomentenModule.subtitel,
    leestijdMinuten: eetmomentenModule.leestijdMinuten,
  },
  {
    id: koolhydratenModule.id,
    subtitel: koolhydratenModule.subtitel,
    leestijdMinuten: koolhydratenModule.leestijdMinuten,
  },
  {
    id: goedVettenModule.id,
    subtitel: goedVettenModule.subtitel,
    leestijdMinuten: goedVettenModule.leestijdMinuten,
    leestijdVerdiepingMinuten: goedVettenModule.leestijdVerdiepingMinuten,
  },
  {
    id: eiwittenModule.id,
    subtitel: eiwittenModule.subtitel,
    leestijdMinuten: eiwittenModule.leestijdMinuten,
  },
  {
    id: bloedsuikerModule.id,
    subtitel: bloedsuikerModule.subtitel,
    leestijdMinuten: bloedsuikerModule.leestijdMinuten,
  },
];

export default function DeBasisCategoriePage() {
  return <KennisbankCategoriePagina categorie={categorie} modulesMeta={modulesMeta} />;
}
