import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { stressModule } from "@/src/data/modules/stress";

export const dynamic = "force-dynamic";

export default function StressModulePage() {
  return (
    <LeermodulePagina
      module={stressModule}
      terug={{ label: "← Terug naar Hoe je eet en leeft", pad: "/kennisbank/hoe-je-eet-en-leeft" }}
      volgende={{
        label: "Fasting voor vrouwen 40+",
        pad: "/kennisbank/hoe-je-eet-en-leeft/fasting",
      }}
    />
  );
}
