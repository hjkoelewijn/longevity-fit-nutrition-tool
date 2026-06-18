import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { alcoholModule } from "@/src/data/modules/alcohol";

export const dynamic = "force-dynamic";

export default function AlcoholModulePage() {
  return (
    <LeermodulePagina
      module={alcoholModule}
      terug={{ label: "← Terug naar Hoe je eet en leeft", pad: "/kennisbank/hoe-je-eet-en-leeft" }}
      volgende={{
        label: "Etentjes en sociale events",
        pad: "/kennisbank/hoe-je-eet-en-leeft/etentjes",
      }}
    />
  );
}
