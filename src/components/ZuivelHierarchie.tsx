export function ZuivelHierarchie({
  items,
}: {
  items: { positie: number; tekst: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-5 rounded-xl border border-[#E8DCC8] bg-[#FAF7F2] p-4">
      <p className="text-sm font-semibold text-stone-900">De Longevity Fit zuivel-hiërarchie</p>
      <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm leading-relaxed text-stone-800">
        {items.map((item) => (
          <li key={item.positie}>{item.tekst}</li>
        ))}
      </ol>
    </div>
  );
}

