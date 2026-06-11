import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { bloedsuikerModule } from "@/src/data/modules/bloedsuiker";

export const dynamic = "force-dynamic";

export default function BloedsuikerModulePage() {
  return (
    <LeermodulePagina
      module={bloedsuikerModule}
      terug={{ label: "← Terug naar De basis", pad: "/kennisbank/de-basis" }}
    />
  );
}
