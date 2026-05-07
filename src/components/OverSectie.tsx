import type { OverContentBlock } from "@/src/data/overContent";

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return <span key={idx}>{part}</span>;
  });
}

function renderBlock(block: OverContentBlock, index: number) {
  if (block.type === "heading") {
    return (
      <h3 key={index} className="mt-8 text-xl font-semibold text-[#2A2520] first:mt-0">
        {block.text}
      </h3>
    );
  }
  if (block.type === "paragraph") {
    return (
      <p key={index} className="mt-4 text-base leading-[1.7] text-[#2A2520]">
        {renderInlineBold(block.text)}
      </p>
    );
  }
  if (block.type === "bullet_list") {
    return (
      <ul key={index} className="mt-4 list-disc space-y-2 pl-5 text-base leading-[1.7] text-[#2A2520]">
        {block.items.map((item, i) => (
          <li key={i}>{renderInlineBold(item)}</li>
        ))}
      </ul>
    );
  }
  return (
    <p key={index} className="mt-6 text-center font-serif text-lg italic text-[#2A2520]">
      {block.text}
    </p>
  );
}

export function OverSectie(props: {
  id: string;
  titel: string;
  subtitel?: string;
  blocks: OverContentBlock[];
}) {
  return (
    <section id={props.id} className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-8 shadow-[0_8px_24px_rgba(42,37,32,0.08)] sm:p-10">
      <h2 className="text-4xl italic text-[#2A2520]">{props.titel}</h2>
      {props.subtitel ? (
        <p className="mt-3 text-lg italic text-stone-600">{props.subtitel}</p>
      ) : null}
      <div className="mt-6 border-t border-[#E8DCC8] pt-6">
        {props.blocks.map((block, i) => renderBlock(block, i))}
      </div>
    </section>
  );
}

