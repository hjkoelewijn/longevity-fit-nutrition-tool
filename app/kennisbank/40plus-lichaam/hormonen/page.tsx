import { LeermodulePagina } from "@/src/features/kennisbank/LeermodulePagina";
import { hormonenModule } from "@/src/data/modules/hormonen";

export const dynamic = "force-dynamic";

export default function HormonenModulePage() {
  return <LeermodulePagina module={hormonenModule} />;
}

