import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { cyclusModule } from "@/src/data/modules/cyclus";

export const dynamic = "force-dynamic";

export default function CyclusModulePage() {
  return (
    <LeermodulePagina
      module={cyclusModule}
      terug={{
        label: "← Terug naar Je hormonen en organen",
        pad: "/kennisbank/hormonen-en-organen",
      }}
    />
  );
}
