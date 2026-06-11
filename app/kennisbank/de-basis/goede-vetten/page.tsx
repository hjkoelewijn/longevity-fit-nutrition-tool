import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { goedVettenModule } from "@/src/data/modules/goede-vetten";

export const dynamic = "force-dynamic";

export default function GoedVettenModulePage() {
  return (
    <LeermodulePagina
      module={goedVettenModule}
      terug={{ label: "← Terug naar De basis", pad: "/kennisbank/de-basis" }}
      volgende={{
        label: "Eiwitten: dierlijk en plantaardig",
        pad: "/kennisbank/de-basis/eiwitten",
      }}
    />
  );
}
