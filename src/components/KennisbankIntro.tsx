export function KennisbankIntro({ paragraphs }: { paragraphs: string[] }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      {paragraphs.map((text, idx) => (
        <p key={idx} className={`text-base leading-8 text-[#2A2520] ${idx > 0 ? "mt-5" : ""}`}>
          {text}
        </p>
      ))}
    </section>
  );
}

