export function LeestijdBadge({ minuten }: { minuten: number }) {
  return (
    <span className="inline-flex rounded-full border border-[#D4AF37]/50 bg-[#FAF3E3] px-3 py-1 text-xs font-medium text-[#7E6321]">
      Leestijd: {minuten} min
    </span>
  );
}

