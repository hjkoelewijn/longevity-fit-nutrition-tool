import { KennisbankCategoriePagina } from "@/src/features/kennisbank/KennisbankCategoriePagina";
import { kennisbankCategorieen } from "@/src/data/kennisbank";
import { tussendoortjesModule } from "@/src/data/modules/tussendoortjes";
import { hoeJeEetModule } from "@/src/data/modules/hoe-je-eet";
import { stressModule } from "@/src/data/modules/stress";
import { fastingModule } from "@/src/data/modules/fasting";
import { alcoholModule } from "@/src/data/modules/alcohol";
import { etentjesModule } from "@/src/data/modules/etentjes";

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
  {
    id: stressModule.id,
    subtitel: stressModule.subtitel,
    leestijdMinuten: stressModule.leestijdMinuten,
  },
  {
    id: fastingModule.id,
    subtitel: fastingModule.subtitel,
    leestijdMinuten: fastingModule.leestijdMinuten,
  },
  {
    id: alcoholModule.id,
    subtitel: alcoholModule.subtitel,
    leestijdMinuten: alcoholModule.leestijdMinuten,
  },
  {
    id: etentjesModule.id,
    subtitel: etentjesModule.subtitel,
    leestijdMinuten: etentjesModule.leestijdMinuten,
  },
];

export default function HoeJeEetEnLeeftCategoriePage() {
  return <KennisbankCategoriePagina categorie={categorie} modulesMeta={modulesMeta} />;
}
