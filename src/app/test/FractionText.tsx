import type { FractionValue } from "./questions";

type FractionTextProps = {
  value: FractionValue;
  size: "expression" | "option";
};

const sizes = {
  expression: {
    whole: "text-[46px] md:text-[64px]",
    part: "px-1 md:px-1.5",
    bar: "h-1 my-1.5 md:h-[5px] md:my-2",
  },
  option: {
    whole: "text-[36px] md:text-[46px]",
    part: "px-1",
    bar: "h-[3px] my-[5px] md:h-1 md:my-1.5",
  },
};

/** Spoken form for screen readers, e.g. "2 бүхэл 3-ийн 1". */
export function sayFraction({ numerator, denominator, whole }: FractionValue) {
  return `${whole ? `${whole} бүхэл ` : ""}${denominator}-ийн ${numerator}`;
}

// TODO(#9): replace with the shared Fraction component.
/** Numerator over denominator; the bar uses the current text color. */
export function FractionText({ value, size }: FractionTextProps) {
  const s = sizes[size];
  return (
    <span className="inline-flex items-center gap-1.5 md:gap-2">
      {value.whole ? <span className={s.whole}>{value.whole}</span> : null}
      <span className="inline-flex flex-col items-center">
        <span className={s.part}>{value.numerator}</span>
        <span className={`self-stretch rounded-full bg-current ${s.bar}`} />
        <span className={s.part}>{value.denominator}</span>
      </span>
    </span>
  );
}
