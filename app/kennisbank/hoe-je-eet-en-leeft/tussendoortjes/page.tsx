import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { tussendoortjesModule } from "@/src/data/modules/tussendoortjes";

export const dynamic = "force-dynamic";

export default function TussendoortjesModulePage() {
  return (
    <LeermodulePagina
      module={tussendoortjesModule}
      terug={{ label: "← Terug naar Hoe je eet en leeft", pad: "/kennisbank/hoe-je-eet-en-leeft" }}
      volgende={{
        label: "Hoe je eet, niet alleen wat je eet",
        pad: "/kennisbank/hoe-je-eet-en-leeft/hoe-je-eet",
      }}
    />
  );
}
