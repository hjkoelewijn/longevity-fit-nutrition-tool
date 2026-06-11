import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { eetmomentenModule } from "@/src/data/modules/eetmomenten";

export const dynamic = "force-dynamic";

export default function EetmomentenModulePage() {
  return (
    <LeermodulePagina
      module={eetmomentenModule}
      terug={{ label: "← Terug naar De basis", pad: "/kennisbank/de-basis" }}
      volgende={{
        label: "Koolhydraten: wanneer wel, wanneer minder",
        pad: "/kennisbank/de-basis/koolhydraten",
      }}
    />
  );
}
