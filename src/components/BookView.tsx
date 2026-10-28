import { FormulaText } from "@/components/FormulaText";
import type { BookText } from "@/lib/types";

/** A lesson video's text written like a textbook page, to read instead of watching. */
export function BookView({ book, title }: { book: BookText; title: string }) {
  return (
    <article className="flex flex-col gap-5 rounded-panel border border-line bg-white p-5 shadow-card md:p-8">
      <h2 className="type-section-title">{title}</h2>
      {book.blocks.map((b, i) => (
        <section key={i} className="flex flex-col gap-2">
          <h3 className="text-lg font-bold md:text-xl">{b.heading}</h3>
          <p className="leading-relaxed whitespace-pre-line">{b.body}</p>
          {b.formula && (
            <div className="self-start rounded-card bg-surface px-5 py-4 type-section-title">
              <FormulaText text={b.formula} />
            </div>
          )}
        </section>
      ))}
    </article>
  );
}
