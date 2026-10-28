// What every question classifier gets and returns, so the Claude provider and
// the rules fallback can stand in for each other.

/** A group the question could join, with a few of its questions as examples. */
export type ExistingGroup = { id: string; title: string; examples: string[] };

export type ClassifyInput = {
  /** Exactly what the student typed. Never a student id or name. */
  text: string;
  /** Lesson name the student asked beside, e.g. "Хураах". */
  lessonTitle: string;
  /** Groups already made for this class and lesson. */
  groups: ExistingGroup[];
};

/** how: steps; why: the idea behind it; check: is my answer right; other. */
export const INTENTS = ["how", "why", "check", "other"] as const;
export type Intent = (typeof INTENTS)[number];

export type Classification = {
  /** Group to join, or null to start a new one titled `title`. */
  groupId: string | null;
  /** Short Mongolian title for a new group. */
  title: string;
  intent: Intent;
  /** The wrong idea behind the question, when there is one. */
  misconception: string | null;
  /** Off-topic, unclear or rude: the teacher should look first. */
  needsReview: boolean;
  source: "ai" | "rules";
};

export interface QuestionClassifier {
  classify(input: ClassifyInput): Promise<Classification>;
}

export const MAX_TITLE_LENGTH = 120;
