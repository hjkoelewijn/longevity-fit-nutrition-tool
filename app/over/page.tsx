import { OverPagina } from "@/src/features/over/OverPagina";
import { getOverPaginaData } from "@/src/data/overContent";

export const dynamic = "force-dynamic";

export default async function OverPage() {
  const data = await getOverPaginaData();
  return <OverPagina data={data} />;
}

