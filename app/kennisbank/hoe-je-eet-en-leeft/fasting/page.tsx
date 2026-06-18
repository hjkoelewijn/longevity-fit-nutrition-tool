import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { fastingModule } from "@/src/data/modules/fasting";

export const dynamic = "force-dynamic";

export default function FastingModulePage() {
  return (
    <LeermodulePagina
      module={fastingModule}
      terug={{ label: "← Terug naar Hoe je eet en leeft", pad: "/kennisbank/hoe-je-eet-en-leeft" }}
      volgende={{
        label: "Alcohol en je hormonen",
        pad: "/kennisbank/hoe-je-eet-en-leeft/alcohol",
      }}
    />
  );
}
