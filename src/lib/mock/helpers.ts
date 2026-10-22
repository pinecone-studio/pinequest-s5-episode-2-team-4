import type { ExpressionToken, FractionValue } from "@/lib/types";

/** f(1, 2) → 1/2, f(1, 3, 2) → 2 1/3 */
export function f(num: number, den: number, whole?: number): FractionValue {
  return whole === undefined ? { num, den } : { whole, num, den };
}

export const frac = (num: number, den: number, whole?: number): ExpressionToken => ({
  kind: "fraction",
  value: f(num, den, whole),
});

export const plus: ExpressionToken = { kind: "op", op: "+" };
export const equals: ExpressionToken = { kind: "op", op: "=" };
export const blank: ExpressionToken = { kind: "blank" };
