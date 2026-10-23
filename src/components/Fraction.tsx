import { cn } from "@/lib/cn";
import type { ExpressionToken, FractionValue } from "@/lib/types";

// Sizes are in em, so a fraction scales with the parent's font size:
// <div className="text-[56px] font-bold"><Fraction value={...} /></div>

/** Spoken form for screen readers, e.g. "2 бүхэл 3-ийн 1". */
export function sayFraction({ whole, num, den }: FractionValue) {
  return `${whole ? `${whole} бүхэл ` : ""}${den}-ийн ${num}`;
}

/** Spoken form of an expression, e.g. "2-ийн 1 нэмэх 3-ийн 1 тэнцүү хэд вэ". */
export function sayExpression(tokens: ExpressionToken[]) {
  return tokens
    .map((t) => {
      if (t.kind === "fraction") return sayFraction(t.value);
      if (t.kind === "blank") return "хэд вэ";
      return { "+": "нэмэх", "−": "хасах", "×": "үржих", "=": "тэнцүү" }[t.op];
    })
    .join(" ");
}

type FractionProps = {
  value: FractionValue;
  className?: string;
};

/** Numerator over denominator; the bar uses the current text color. */
export function Fraction({ value, className }: FractionProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-[0.14em] leading-none", className)}
    >
      {value.whole ? <span className="text-[1.15em]">{value.whole}</span> : null}
      <span className="inline-flex flex-col items-center">
        <span className="px-[0.1em]">{value.num}</span>
        <span className="my-[0.14em] h-[0.09em] min-h-0.5 self-stretch rounded-full bg-current" />
        <span className="px-[0.1em]">{value.den}</span>
      </span>
    </span>
  );
}

type ExpressionProps = {
  tokens: ExpressionToken[];
  className?: string;
};

/** A math expression like 1/2 + 1/3 = ?, read out as one image by screen readers. */
export function Expression({ tokens, className }: ExpressionProps) {
  return (
    <div
      role="img"
      aria-label={sayExpression(tokens)}
      className={cn("inline-flex items-center gap-[0.36em] leading-none", className)}
    >
      {tokens.map((t, i) => {
        if (t.kind === "fraction") return <Fraction key={i} value={t.value} />;
        if (t.kind === "op")
          return (
            <span key={i} className="text-primary">
              {t.op}
            </span>
          );
        return (
          <span
            key={i}
            className="inline-flex h-[1.86em] w-[1.43em] items-center justify-center rounded-card border-3 border-dashed border-primary bg-surface text-[0.8em] text-primary"
          >
            ?
          </span>
        );
      })}
    </div>
  );
}
