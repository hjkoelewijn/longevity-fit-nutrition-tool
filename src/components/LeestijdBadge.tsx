type LeestijdBadgeProps = {
  minuten: number;
  verdiepingMinuten?: number;
};

export function LeestijdBadge({ minuten, verdiepingMinuten }: LeestijdBadgeProps) {
  const label = verdiepingMinuten
    ? `${minuten} min lezen, ${verdiepingMinuten} min met verdieping`
    : `Leestijd: ${minuten} min`;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/50 bg-[#FAF3E3] px-3 py-1 text-xs font-medium text-[#7E6321]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5 text-[#D4AF37]"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </span>
  );
}
