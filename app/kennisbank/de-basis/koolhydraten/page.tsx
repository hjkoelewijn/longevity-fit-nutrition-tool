import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { koolhydratenModule } from "@/src/data/modules/koolhydraten";

export const dynamic = "force-dynamic";

export default function KoolhydratenModulePage() {
  return (
    <LeermodulePagina
      module={koolhydratenModule}
      terug={{ label: "← Terug naar De basis", pad: "/kennisbank/de-basis" }}
      volgende={{
        label: "Goede vetten en de omega 3/6 balans",
        pad: "/kennisbank/de-basis/goede-vetten",
      }}
    />
  );
}
