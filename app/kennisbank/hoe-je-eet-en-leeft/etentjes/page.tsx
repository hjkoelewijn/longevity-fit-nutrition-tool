import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { etentjesModule } from "@/src/data/modules/etentjes";

export const dynamic = "force-dynamic";

export default function EtentjesModulePage() {
  return (
    <LeermodulePagina
      module={etentjesModule}
      terug={{ label: "← Terug naar Hoe je eet en leeft", pad: "/kennisbank/hoe-je-eet-en-leeft" }}
    />
  );
}
