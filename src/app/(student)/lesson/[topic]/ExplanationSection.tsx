import type { ExpressionToken, FractionValue, Lesson } from "@/lib/types";
import { LessonFraction, fractionLabel } from "./LessonFraction";

type ExplanationSectionProps = {
  lesson: Lesson;
};

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

/** For a + b in the mistake, both addends over their common denominator. */
function commonDenominator(expression: ExpressionToken[]) {
  const [a, op, b] = expression;
  if (
    a?.kind !== "fraction" ||
    op?.kind !== "op" ||
    op.op !== "+" ||
    b?.kind !== "fraction" ||
    a.value.whole ||
    b.value.whole
  ) {
    return null;
  }
  const den = lcm(a.value.den, b.value.den);
  const scale = (f: FractionValue) => ({ num: (f.num * den) / f.den, den });
  return {
    a: a.value,
    b: b.value,
    aScaled: scale(a.value),
    bScaled: scale(b.value),
    den,
  };
}

function describeMistake(expression: ExpressionToken[]) {
  const words = expression.flatMap((t) => {
    if (t.kind === "fraction") return [fractionLabel(t.value)];
    if (t.kind === "op") {
      return [t.op === "+" ? "нэмэх" : t.op === "=" ? "тэнцүү" : "хасах"];
    }
    return [];
  });
  return `${words.join(" ")} гэж бодсон, зөв биш`;
}

const hatch = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgb(63 7 145 / 0.22) 0 3px, transparent 3px 9px)",
};

/** A bar of `total` cells: `filled` solid, then `hatched` striped, rest empty. */
function FractionBar({
  total,
  filled = 0,
  hatched = 0,
}: {
  total: number;
  filled?: number;
  hatched?: number;
}) {
  return (
    <div aria-hidden="true" className="flex h-9 flex-1 gap-[3px] md:h-12 md:gap-1">
      {Array.from({ length: total }, (_, i) => {
        const base = "flex-1 rounded-lg md:rounded-field";
        if (i < filled) {
          return <span key={i} className={`${base} bg-primary`} />;
        }
        if (i < filled + hatched) {
          return (
            <span
              key={i}
              className={`${base} border-2 border-ink bg-sky`}
              style={hatch}
            />
          );
        }
        return (
          <span key={i} className={`${base} border-2 border-line bg-white`} />
        );
      })}
    </div>
  );
}

function BarRow({
  value,
  highlight,
  children,
}: {
  value: FractionValue;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 md:gap-3.5">
      <span
        role="img"
        aria-label={fractionLabel(value)}
        className={`w-7 shrink-0 text-center text-[17px] leading-none font-bold md:w-9 md:text-xl ${
          highlight ? "text-primary" : ""
        }`}
      >
        <LessonFraction value={value} size="sm" />
      </span>
      {children}
    </div>
  );
}

const ArrowIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="hidden size-7 text-primary md:block"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const conversionRowClass =
  "grid gap-3 md:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] md:items-center md:gap-4";

/** The lesson title, the typical mistake and a step-by-step explanation. */
export function ExplanationSection({ lesson }: ExplanationSectionProps) {
  const { expression, explanation } = lesson.mistake;
  const visual = commonDenominator(expression);

  return (
    <section aria-labelledby="lesson-title" className="mt-6 md:mt-14">
      <div className="flex flex-col items-start gap-2 md:flex-row md:flex-wrap md:items-center md:gap-4">
        <h2
          id="lesson-title"
          className="text-[32px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[40px]"
        >
          {lesson.title}
        </h2>
        {lesson.approvedByTeacher ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-2.5 py-0.75 text-xs font-bold md:px-3 md:py-[5px] md:text-[13px]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-3 md:size-3.5"
            >
              <path d="M12 22c5.5-2.5 8-6.5 8-12V5l-8-3-8 3v5c0 5.5 2.5 9.5 8 12z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Багш баталсан
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-4 md:mt-7 md:gap-6">
        <div className="flex flex-col items-center justify-center gap-3.5 rounded-[25px] bg-pink px-4 py-6 md:flex-row md:flex-wrap md:gap-x-10 md:gap-y-5 md:rounded-panel md:px-8 md:py-7">
          <div
            role="img"
            aria-label={describeMistake(expression)}
            className="flex items-center gap-3 text-[34px] leading-none font-bold md:gap-4 md:text-[44px]"
          >
            {expression.map((token, i) => {
              const isAnswer = i === expression.length - 1;
              if (token.kind === "fraction" && isAnswer) {
                return (
                  <span
                    key={i}
                    className="relative rounded-tile border-3 border-magenta bg-white px-2.5 py-1.5 md:px-3 md:py-2"
                  >
                    <LessonFraction value={token.value} size="lg" />
                    <span
                      aria-hidden="true"
                      className="absolute -top-3 -right-3 flex size-7 items-center justify-center rounded-full bg-magenta text-white md:-top-3.5 md:-right-3.5 md:size-8"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-3.5 md:size-4"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </span>
                  </span>
                );
              }
              if (token.kind === "fraction") {
                return <LessonFraction key={i} value={token.value} size="lg" />;
              }
              if (token.kind === "op") {
                return (
                  <span key={i} className="text-primary">
                    {token.op === "=" ? "≠" : token.op}
                  </span>
                );
              }
              return null;
            })}
          </div>
          <p className="text-center text-base font-bold md:max-w-[280px] md:text-left md:text-lg">
            {explanation}
          </p>
        </div>

        {visual ? (
          <div className="flex flex-col gap-3 rounded-[25px] bg-white p-5 shadow-card md:gap-[18px] md:rounded-panel md:px-8 md:py-7">
            <div className={conversionRowClass}>
              <BarRow value={visual.a}>
                <FractionBar total={visual.a.den} filled={visual.a.num} />
              </BarRow>
              {ArrowIcon}
              <BarRow value={visual.aScaled}>
                <FractionBar total={visual.den} filled={visual.aScaled.num} />
              </BarRow>
            </div>
            <div
              className={`${conversionRowClass} border-t-2 border-dashed border-line pt-3 md:border-0 md:pt-0`}
            >
              <BarRow value={visual.b}>
                <FractionBar total={visual.b.den} hatched={visual.b.num} />
              </BarRow>
              {ArrowIcon}
              <BarRow value={visual.bScaled}>
                <FractionBar total={visual.den} hatched={visual.bScaled.num} />
              </BarRow>
            </div>
            <div
              className={`${conversionRowClass} border-t-2 border-dashed border-line pt-3 md:pt-[18px]`}
            >
              <p className="hidden items-center gap-2.5 justify-self-end text-xl leading-none font-bold md:flex">
                <LessonFraction value={visual.aScaled} size="sm" />
                <span className="text-primary">+</span>
                <LessonFraction value={visual.bScaled} size="sm" />
              </p>
              <span
                aria-hidden="true"
                className="hidden text-center text-[28px] font-bold text-primary md:block"
              >
                =
              </span>
              <BarRow
                value={{
                  num: visual.aScaled.num + visual.bScaled.num,
                  den: visual.den,
                }}
                highlight
              >
                <FractionBar
                  total={visual.den}
                  filled={visual.aScaled.num}
                  hatched={visual.bScaled.num}
                />
              </BarRow>
            </div>
          </div>
        ) : null}

        <ol
          aria-label="Алхмууд"
          className="flex flex-col gap-2 md:grid md:grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] md:gap-3"
        >
          {lesson.steps.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-3 rounded-card bg-surface px-3.5 py-3 font-bold md:p-4"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white md:size-10"
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
