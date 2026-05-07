import { RichtlijnenPagina } from "@/src/features/richtlijnen/Richtlijnen";
import { getRichtlijnenData } from "@/src/data/richtlijnen";

export const dynamic = "force-dynamic";

export default async function RichtlijnenPage() {
  const data = await getRichtlijnenData();
  return <RichtlijnenPagina data={data} />;
}

