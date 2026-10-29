// The class's diagnostic test results per subtopic, as counts and shares, so
// the teacher sees which subtopic the class finds hard and what to do next.
// Only totals: no student numbers or names leave this module.

import type { HeatmapStatus } from "./types";

export type TestedStatus = Exclude<HeatmapStatus, "untested">;

/** Weakest first, the order the dashboard lists them in. */
export const TESTED_STATUSES: TestedStatus[] = ["weak", "learning", "good"];

/** Whole percent of `total`, 0 for an empty class instead of NaN. */
export const share = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;
