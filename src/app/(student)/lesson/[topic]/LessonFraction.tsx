import type { FractionValue } from "@/lib/types";

const barSizes = {
  lg: "h-[3px] my-[5px] md:h-1 md:my-1.5",
  sm: "h-0.5 my-[3px] md:h-[2.5px]",
};

type LessonFractionProps = {
  value: FractionValue;
  size: keyof typeof barSizes;
};

/** "1/2" for aria labels. */
export function fractionLabel({ whole, num, den }: FractionValue) {
  return `${whole ? `${whole} ` : ""}${num}/${den}`;
}

// TODO(#9): replace with the shared Fraction component.
/** Numerator over denominator; font size comes from the parent. */
export function LessonFraction({ value, size }: LessonFractionProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {value.whole ? <span>{value.whole}</span> : null}
      <span className="inline-flex flex-col items-center">
        <span>{value.num}</span>
        <span
          className={`self-stretch rounded-full bg-current ${barSizes[size]}`}
        />
        <span>{value.den}</span>
      </span>
    </span>
  );
}
