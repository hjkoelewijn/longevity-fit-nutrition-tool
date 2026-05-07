import type { Richtlijn } from "@/src/data/richtlijnen";
import { RichtlijnKaart } from "@/src/components/RichtlijnKaart";

export function RichtlijnenSectie({
  titel,
  richtlijnen,
}: {
  titel: string;
  richtlijnen: Richtlijn[];
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-3xl italic tracking-wide text-[#2A2520]">{titel}</h2>
      <div className="space-y-4">
        {richtlijnen.map((r) => (
          <RichtlijnKaart key={r.nummer} richtlijn={r} />
        ))}
      </div>
    </section>
  );
}

