// Diagnostic test scoring for any account: the logged-in student's own
// pages and the teacher's view of each student in a class. Pure functions,
// so they run anywhere and in tests.

import { testQuestions } from "./mock/questions";
import { subtopics, topics } from "./mock/topics";
import type { ClassOverview, HeatmapRow, HeatmapStatus, SubtopicProgress, TestResult } from "./types";

/**
 * Scores saved test answers per subtopic, weakest first. Undefined until
 * the test is taken.
 */
export function scoreTest(answers: Record<string, number> | undefined): TestResult | undefined {
  const answered = testQuestions.filter((q) => answers?.[q.id] !== undefined);
  if (!answers || answered.length === 0) return undefined;

  const topicId =
    topics.find((t) => t.subtopicIds.includes(answered[0].subtopicId))?.id ?? "";
  const scores = subtopics
    .filter((s) => s.topicId === topicId)
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const questions = testQuestions.filter((q) => q.subtopicId === s.id);
      const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
      return {
        subtopicId: s.id,
        status: correct === questions.length ? ("good" as const) : ("weak" as const),
        correct,
        total: questions.length,
      };
    })
    .filter((s) => s.total > 0)
    // Stable sort keeps the topic order for equal scores.
    .sort((a, b) => a.correct / a.total - b.correct / b.total);

  return {
    topicId,
    correct: scores.reduce((sum, s) => sum + s.correct, 0),
    total: scores.reduce((sum, s) => sum + s.total, 0),
    subtopics: scores,
  };
}

/**
 * The test result per subtopic, with retest-passed subtopics "mastered".
 * Empty until the test is taken.
 */
export function progressFrom(result: TestResult | undefined, mastered: string[] = []): SubtopicProgress[] {
  const done = new Set(mastered);
  return (
    result?.subtopics.map(({ subtopicId, status }) => ({
      subtopicId,
      status: done.has(subtopicId) ? "mastered" : status,
    })) ?? []
  );
}

/** Each student's progress in a class, in student number order; undefined = test not taken. */
export type ClassProgress = (SubtopicProgress[] | undefined)[];

const topicSubtopics = (topicId: string) =>
  subtopics.filter((s) => s.topicId === topicId).sort((a, b) => a.order - b.order);

/** How many students took the test, and the subtopic most of them are weak in. */
export function classOverviewFrom(code: string, topicId: string, students: ClassProgress): ClassOverview {
  const tested = students.filter((s): s is SubtopicProgress[] => Boolean(s));
  const weakCounts = topicSubtopics(topicId).map((s) => ({
    id: s.id,
    weak: tested.filter((p) => p.some((x) => x.subtopicId === s.id && x.status === "weak")).length,
  }));
  // Most weak students first; topic order breaks ties.
  const weakest = [...weakCounts].sort((a, b) => b.weak - a.weak)[0];
  return {
    code,
    topicId,
    studentCount: students.length,
    testedCount: tested.length,
    weakestSubtopicId: weakest && weakest.weak > 0 ? weakest.id : "",
    weakestCount: weakest?.weak ?? 0,
  };
}

/** Per subtopic, each student's status by number; "untested" until they take the test. */
export function heatmapFrom(topicId: string, students: ClassProgress): HeatmapRow[] {
  const cell = (progress: SubtopicProgress[] | undefined, subtopicId: string): HeatmapStatus => {
    const status = progress?.find((p) => p.subtopicId === subtopicId)?.status;
    if (!status) return "untested";
    return status === "weak" || status === "learning" ? status : "good";
  };
  return topicSubtopics(topicId).map((s) => ({ subtopicId: s.id, cells: students.map((p) => cell(p, s.id)) }));
}
