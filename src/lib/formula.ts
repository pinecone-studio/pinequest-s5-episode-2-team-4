// Checks math in teacher content with exact fractions: AI-written formulas
// ("1/2 + 1/3 = 5/6") and game answers ("3/4" is right for "1/2 + 1/4 = ?").
// Pure functions, so they run on the server and in tests.

/** An exact fraction num/den, den > 0, in lowest terms. */
export type Rational = { num: bigint; den: bigint };

const abs = (n: bigint) => (n < BigInt(0) ? -n : n);
function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function make(num: bigint, den: bigint): Rational {
  if (den === BigInt(0)) throw new FormulaError("division by zero");
  if (den < BigInt(0)) [num, den] = [-num, -den];
  const g = gcd(num, den) || BigInt(1);
  return { num: num / g, den: den / g };
}

class FormulaError extends Error {}

const add = (a: Rational, b: Rational) => make(a.num * b.den + b.num * a.den, a.den * b.den);
const sub = (a: Rational, b: Rational) => make(a.num * b.den - b.num * a.den, a.den * b.den);
const mul = (a: Rational, b: Rational) => make(a.num * b.num, a.den * b.den);
const div = (a: Rational, b: Rational) => make(a.num * b.den, a.den * b.num);
function pow(a: Rational, b: Rational): Rational {
  if (b.den !== BigInt(1) || abs(b.num) > BigInt(12)) throw new FormulaError("unsupported power");
  let out = make(BigInt(1), BigInt(1));
  for (let i = BigInt(0); i < abs(b.num); i++) out = mul(out, a);
  return b.num < BigInt(0) ? div(make(BigInt(1), BigInt(1)), out) : out;
}

export const equal = (a: Rational, b: Rational) => a.num === b.num && a.den === b.den;

/** "3/4", "-2", or "1 1/2" for an improper fraction shown as a mixed number. */
export function formatRational(r: Rational, mixed = false): string {
  if (r.den === BigInt(1)) return String(r.num);
  if (mixed && abs(r.num) > r.den) {
    const whole = r.num / r.den;
    return `${whole} ${abs(r.num % r.den)}/${r.den}`;
  }
  return `${r.num}/${r.den}`;
}

/** Normalises the many ways people type math symbols. */
function normalise(text: string): string {
  return (
    text
      .replace(/[−–—]/g, "-")
      .replace(/[×·⋅]/g, "*")
      .replace(/,/g, ".")
      // A mixed number "2 1/3" is 2 + 1/3.
      .replace(/(^|[^\d.])(\d+)\s+(\d+)\s*\/\s*(\d+)/g, "$1($2+$3/$4)")
      // A written fraction is one number: "1/2 ÷ 1/4" is (1/2) ÷ (1/4), not ((1/2) ÷ 1) / 4.
      .replace(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g, "($1/$2)")
      // Only now do ÷ and : become division, so they don't bind like a fraction bar.
      .replace(/[÷:]/g, "/")
      .trim()
  );
}

type Token = { t: "num"; v: Rational } | { t: "op"; v: string };

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[\d.]/.test(c)) {
      const m = /^\d*\.?\d+|^\d+\.?/.exec(text.slice(i));
      if (!m) throw new FormulaError("bad number");
      const [whole, frac = ""] = m[0].split(".");
      const den = BigInt(10) ** BigInt(frac.length);
      out.push({ t: "num", v: make(BigInt((whole || "0") + frac), den) });
      i += m[0].length;
    } else if ("+-*/^()".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
    } else {
      throw new FormulaError(`unknown symbol ${c}`);
    }
  }
  return out;
}

/** Recursive-descent parser: expr = term (+|- term)*, term = factor (*|/ factor)*, factor = unary (^ factor)? */
function evaluate(tokens: Token[]): Rational {
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (v: string) => peek()?.t === "op" && peek()!.v === v;

  function primary(): Rational {
    const tok = tokens[pos++];
    if (!tok) throw new FormulaError("unexpected end");
    if (tok.t === "num") return tok.v;
    if (tok.v === "(") {
      const v = expr();
      if (!isOp(")")) throw new FormulaError("missing )");
      pos++;
      return v;
    }
    throw new FormulaError(`unexpected ${tok.v}`);
  }
  function unary(): Rational {
    if (isOp("-")) {
      pos++;
      return sub(make(BigInt(0), BigInt(1)), unary());
    }
    if (isOp("+")) {
      pos++;
      return unary();
    }
    return primary();
  }
  function factor(): Rational {
    const base = unary();
    if (isOp("^")) {
      pos++;
      return pow(base, factor());
    }
    return base;
  }
  function term(): Rational {
    let v = factor();
    while (isOp("*") || isOp("/")) {
      const op = tokens[pos++].v;
      v = op === "*" ? mul(v, factor()) : div(v, factor());
    }
    return v;
  }
  function expr(): Rational {
    let v = term();
    while (isOp("+") || isOp("-")) {
      const op = tokens[pos++].v;
      v = op === "+" ? add(v, term()) : sub(v, term());
    }
    return v;
  }

  const value = expr();
  if (pos !== tokens.length) throw new FormulaError("trailing input");
  return value;
}

/** The exact value of an expression like "1/2 + 1/3", or undefined if it can't be computed. */
export function evaluateExpression(text: string): Rational | undefined {
  try {
    return evaluate(tokenize(normalise(text)));
  } catch {
    return undefined;
  }
}

export type FormulaCheck =
  /** Every side has the same value */
  | { status: "ok" }
  /** Computable, but the sides differ: e.g. "1/2 + 1/3 = 2/5" */
  | { status: "wrong"; expected: string }
  /** Has letters, words or "?": a teacher has to check it */
  | { status: "unknown" };

/** Checks "a = b (= c …)"; text without "=" is only checked for being computable. */
export function checkFormula(text: string): FormulaCheck {
  const sides = text.split(/=/).map((s) => s.trim()).filter(Boolean);
  const values = sides.map(evaluateExpression);
  if (sides.length < 2 || values.some((v) => v === undefined)) return { status: "unknown" };
  const [first, ...rest] = values as Rational[];
  return rest.every((v) => equal(v, first))
    ? { status: "ok" }
    : { status: "wrong", expected: formatRational(first, sides[0].includes(" ")) };
}

/** True when two typed answers are the same number ("6/8" and "3/4"); else compares text. */
export function sameAnswer(a: string, b: string): boolean {
  const x = evaluateExpression(a);
  const y = evaluateExpression(b);
  if (x && y) return equal(x, y);
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * The value a prompt asks for when it is pure arithmetic ending in "= ?",
 * e.g. "1/2 + 1/4 = ?" → 3/4. Undefined for word problems.
 */
export function promptValue(prompt: string): Rational | undefined {
  const m = /^(.*?)=\s*\?\s*$/.exec(prompt.trim());
  return m ? evaluateExpression(m[1]) : undefined;
}
