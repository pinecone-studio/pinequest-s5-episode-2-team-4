import { Fraction } from "@/components/Fraction";
import { cn } from "@/lib/cn";

// A mixed number "2 1/3" or a fraction "3/4".
const FRACTION = /(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)/g;

/**
 * A formula written as text ("1/2 + 1/3 = 5/6") with the fractions drawn
 * stacked. Scales with the parent font size, like `Fraction`.
 */
export function FormulaText({ text, className }: { text: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FRACTION)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <Fraction
        key={m.index}
        value={{ whole: m[1] ? Number(m[1]) : undefined, num: Number(m[2]), den: Number(m[3]) }}
      />,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <span role="img" aria-label={text} className={cn("inline-flex flex-wrap items-center gap-x-[0.3em] leading-none", className)}>
      {parts}
    </span>
  );
}
