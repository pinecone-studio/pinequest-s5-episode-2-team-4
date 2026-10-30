// Turns untrusted model JSON into typed, trimmed and length-limited values.
// Each function returns undefined when the shape is wrong.

import { toReelFrame } from "@/lib/reel-frame";
import type { BookText, GameQuestion, Recognition, ReelScript, ReelSection, ReelSectionKind } from "@/lib/types";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** A trimmed string cut to `max` characters, or "" if it isn't a string. */
export const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const list = <T>(v: unknown, max: number, item: (x: unknown) => T | undefined): T[] =>
  (Array.isArray(v) ? v : []).slice(0, max).flatMap((x) => {
    const out = item(x);
    return out === undefined ? [] : [out];
  });

export function toRecognition(v: unknown): Recognition | undefined {
  if (!isObj(v)) return undefined;
  const topic = str(v.topic, 120);
  if (!topic) return undefined;
  return {
    topic,
    concepts: list(v.concepts, 12, (c) => {
      if (!isObj(c) || !str(c.title, 120)) return undefined;
      return { title: str(c.title, 120), explanation: str(c.explanation, 600) };
    }),
    examples: list(v.examples, 10, (e) => {
      if (!isObj(e) || !str(e.problem, 300)) return undefined;
      return { problem: str(e.problem, 300), solution: str(e.solution, 800), answer: str(e.answer, 60) };
    }),
    mistakes: list(v.mistakes, 10, (m) => {
      if (!isObj(m) || !str(m.wrong, 200)) return undefined;
      return { wrong: str(m.wrong, 200), why: str(m.why, 400) };
    }),
    formulas: list(v.formulas, 12, (f) => str(f, 120) || undefined),
  };
}

const KINDS: ReelSectionKind[] = ["hook", "step", "example", "question"];

export function toSection(v: unknown): ReelSection | undefined {
  if (!isObj(v)) return undefined;
  const kind = KINDS.find((k) => k === v.kind) ?? "step";
  const say = str(v.say, 600);
  const caption = str(v.caption, 80);
  if (!say || !caption) return undefined;
  const formula = str(v.formula, 120);
  return formula ? { kind, say, caption, formula } : { kind, say, caption };
}

export function toScript(v: unknown): ReelScript | undefined {
  if (!isObj(v)) return undefined;
  const sections = list(v.sections, 10, toSection);
  const title = str(v.title, 120);
  return title && sections.length >= 3 ? { title, sections, ...toReelFrame(v) } : undefined;
}

export function toBook(v: unknown): BookText | undefined {
  if (!isObj(v)) return undefined;
  const blocks = list(v.blocks, 12, (b) => {
    if (!isObj(b) || !str(b.heading, 120) || !str(b.body, 2000)) return undefined;
    const formula = str(b.formula, 120);
    return { heading: str(b.heading, 120), body: str(b.body, 2000), ...(formula ? { formula } : {}) };
  });
  return blocks.length ? { blocks } : undefined;
}

/** Questions without ids; the caller numbers them. Answers stay strings. */
export function toQuestions(v: unknown): Omit<GameQuestion, "id">[] | undefined {
  if (!isObj(v)) return undefined;
  const questions = list(v.questions, 12, (q) => {
    if (!isObj(q) || !str(q.prompt, 200)) return undefined;
    const answers = (a: unknown) => list(a, 3, (x) => str(x, 28) || undefined);
    const correct = answers(q.correct);
    const wrong = answers(q.wrong);
    if (correct.length !== 3 || wrong.length !== 3) return undefined;
    return { prompt: str(q.prompt, 200), correct, wrong, explanation: str(q.explanation, 400) };
  });
  return questions.length ? questions : undefined;
}
