import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { hoeJeEetModule } from "@/src/data/modules/hoe-je-eet";

export const dynamic = "force-dynamic";

export default function HoeJeEetModulePage() {
  return (
    <LeermodulePagina
      module={hoeJeEetModule}
      terug={{ label: "← Terug naar Hoe je eet en leeft", pad: "/kennisbank/hoe-je-eet-en-leeft" }}
    />
  );
}
