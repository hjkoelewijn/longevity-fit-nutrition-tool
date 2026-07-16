import { KennisbankCategoriePagina } from "@/src/features/kennisbank/KennisbankCategoriePagina";
import { kennisbankCategorieen } from "@/src/data/kennisbank";
import { cyclusModule } from "@/src/data/modules/cyclus";

export const dynamic = "force-dynamic";

const categorie = kennisbankCategorieen.find((c) => c.id === "hormonen-en-organen")!;

const modulesMeta = [
  {
    id: cyclusModule.id,
    subtitel: cyclusModule.subtitel,
    leestijdMinuten: cyclusModule.leestijdMinuten,
  },
];

export default function HormonenEnOrganenCategoriePage() {
  return <KennisbankCategoriePagina categorie={categorie} modulesMeta={modulesMeta} />;
}
