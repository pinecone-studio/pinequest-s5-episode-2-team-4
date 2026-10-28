// Fallback classifier with no AI: a question joins the group whose example
// questions share most of its words. Used when there is no API key, or the AI
// times out or replies with something invalid.

import { normalizeQuestion } from "../question-text";
import { MAX_TITLE_LENGTH, type Classification, type ClassifyInput, type QuestionClassifier } from "./classifier";

/** Share of words two questions must have in common to count as the same. */
const SAME_QUESTION = 0.5;

const words = (text: string) => new Set(normalizeQuestion(text).split(" ").filter((w) => w.length > 1));

/** Jaccard similarity of the two questions' words, 0 to 1. */
export function similarity(a: string, b: string) {
  const left = words(a);
  const right = words(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const w of left) if (right.has(w)) shared++;
  return shared / (left.size + right.size - shared);
}

/** "Хураах: <question>" cut to fit, used when the question starts a group. */
function titleFor({ text, lessonTitle }: ClassifyInput) {
  const title = `${lessonTitle}: ${text}`;
  return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1)}…` : title;
}

export const rulesClassifier: QuestionClassifier = {
  async classify(input): Promise<Classification> {
    let best: { id: string; score: number } | null = null;
    for (const group of input.groups) {
      const score = Math.max(0, ...[group.title, ...group.examples].map((t) => similarity(input.text, t)));
      if (score >= SAME_QUESTION && (!best || score > best.score)) best = { id: group.id, score };
    }
    return {
      groupId: best?.id ?? null,
      title: titleFor(input),
      intent: "other",
      misconception: null,
      needsReview: false,
      source: "rules",
    };
  },
};
