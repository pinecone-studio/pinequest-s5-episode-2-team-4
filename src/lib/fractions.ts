// Plain-text fractions: for AI prompts, teacher exercises, and checking
// typed answers like "3/4", "6/8" or "1 1/2".

import type { ExpressionToken, FractionValue } from "./types";

export function fractionToText({ whole, num, den }: FractionValue) {
  return whole ? `${whole} ${num}/${den}` : `${num}/${den}`;
}

/** e.g. "1/2 + 1/3 = ?" */
export function expressionToText(tokens: ExpressionToken[]) {
  return tokens
    .map((t) => {
      if (t.kind === "op") return t.op;
      if (t.kind === "blank") return "?";
      return fractionToText(t.value);
    })
    .join(" ");
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/**
 * Parses "3/4", "1 1/2", "2" or "0.5"-free integers into a reduced [num, den],
 * or undefined if it isn't a number we understand.
 */
function parse(text: string): [number, number] | undefined {
  const t = text.trim().replace(/\s+/g, " ").replace(",", ".");
  let m = t.match(/^(-?\d+) (\d+)\/(\d+)$/);
  if (m) {
    const [whole, num, den] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return den ? reduce(whole * den + Math.sign(whole || 1) * num, den) : undefined;
  }
  m = t.match(/^(-?\d+)\/(\d+)$/);
  if (m) return Number(m[2]) ? reduce(Number(m[1]), Number(m[2])) : undefined;
  m = t.match(/^-?\d+$/);
  if (m) return [Number(t), 1];
  return undefined;
}

function reduce(num: number, den: number): [number, number] {
  const g = gcd(Math.abs(num), den) || 1;
  return [num / g, den / g];
}

/** True when two answers are the same number, e.g. "6/8" and "3/4". */
export function sameAnswer(a: string, b: string) {
  const x = parse(a);
  const y = parse(b);
  if (!x || !y) return a.trim().toLowerCase() === b.trim().toLowerCase();
  return x[0] === y[0] && x[1] === y[1];
}
