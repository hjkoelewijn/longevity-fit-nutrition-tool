import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { eiwittenModule } from "@/src/data/modules/eiwitten";

export const dynamic = "force-dynamic";

export default function EiwittenModulePage() {
  return (
    <LeermodulePagina
      module={eiwittenModule}
      terug={{ label: "← Terug naar De basis", pad: "/kennisbank/de-basis" }}
      volgende={{
        label: "Bloedsuiker, insuline en je energie",
        pad: "/kennisbank/de-basis/bloedsuiker",
      }}
    />
  );
}
