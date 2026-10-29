// The class's diagnostic test results per subtopic, as counts and shares, so
// the teacher sees which subtopic the class finds hard and what to do next.
// Only totals: no student numbers or names leave this module.

import type { HeatmapRow, HeatmapStatus } from "./types";

export type TestedStatus = Exclude<HeatmapStatus, "untested">;

/** Weakest first, the order the dashboard lists them in. */
export const TESTED_STATUSES: TestedStatus[] = ["weak", "learning", "good"];

/** With fewer students tested than this, the dashboard gives no verdict. */
export const MIN_TESTED = 5;
/** Share of weak students at which the subtopic should be explained again. */
const REEXPLAIN_SHARE = 0.4;
/** Share of weak students at which a short review helps. */
const REVIEW_WEAK_SHARE = 0.2;
/** Share of weak and still-learning students together at which a short review helps. */
const REVIEW_SHARE = 0.4;

/** few: too few results to say anything yet. */
export type NextStep = "few" | "reexplain" | "review" | "next";

export type SubtopicResult = {
  subtopicId: string;
  /** Students who took the test */
  tested: number;
  counts: Record<TestedStatus, number>;
  /** Whole percent of the tested students; 0 when nobody took the test */
  shares: Record<TestedStatus, number>;
  step: NextStep;
};

/** Whole percent of `total`, 0 for an empty class instead of NaN. */
export const share = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

/** What the teacher could do next, from how many students are weak or still learning. */
export function nextStep(counts: Record<TestedStatus, number>, tested: number): NextStep {
  if (tested < MIN_TESTED) return "few";
  if (counts.weak / tested >= REEXPLAIN_SHARE) return "reexplain";
  if (
    counts.weak / tested >= REVIEW_WEAK_SHARE ||
    (counts.weak + counts.learning) / tested >= REVIEW_SHARE
  ) {
    return "review";
  }
  return "next";
}

/** One subtopic's counts, leaving out students who haven't taken the test. */
export function summarizeRow(row: HeatmapRow): SubtopicResult {
  const counts: Record<TestedStatus, number> = { weak: 0, learning: 0, good: 0 };
  for (const cell of row.cells) if (cell !== "untested") counts[cell]++;
  const tested = counts.weak + counts.learning + counts.good;
  return {
    subtopicId: row.subtopicId,
    tested,
    counts,
    shares: {
      weak: share(counts.weak, tested),
      learning: share(counts.learning, tested),
      good: share(counts.good, tested),
    },
    step: nextStep(counts, tested),
  };
}

/** Every subtopic, weakest first: most weak students, then most still learning. */
export function summarizeResults(rows: HeatmapRow[]): SubtopicResult[] {
  return rows
    .map(summarizeRow)
    .sort((a, b) => b.counts.weak - a.counts.weak || b.counts.learning - a.counts.learning);
}

/**
 * The subtopic to look at first (the top of the weakest-first list), or none
 * when there are too few results or every tested student is good at it.
 */
export function hardestSubtopic(results: SubtopicResult[]): SubtopicResult | undefined {
  const [first] = results;
  if (!first || first.step === "few") return undefined;
  return first.counts.weak + first.counts.learning > 0 ? first : undefined;
}
