import type { Status } from "@/components/ui";

// TODO(#8): replace with getTestResult() from src/lib/data.ts. Its TestResult
// has no per-subtopic score yet, so the bars need one added there.

export type SubtopicResult = {
  subtopicId: string;
  title: string;
  correct: number;
  total: number;
  status: Status;
};

export type LessonResult = {
  topicId: string;
  correct: number;
  total: number;
  /** Weakest first, as shown on the page. */
  subtopics: SubtopicResult[];
};

const RESULTS: LessonResult[] = [
  {
    topicId: "fractions",
    correct: 5,
    total: 8,
    subtopics: [
      {
        subtopicId: "different-denominator",
        title: "Ялгаатай хуваарь",
        correct: 0,
        total: 2,
        status: "weak",
      },
      {
        subtopicId: "simplify",
        title: "Хураах",
        correct: 1,
        total: 2,
        status: "weak",
      },
      {
        subtopicId: "same-denominator",
        title: "Ижил хуваарь",
        correct: 2,
        total: 2,
        status: "good",
      },
      {
        subtopicId: "mixed-numbers",
        title: "Холимог тоо",
        correct: 2,
        total: 2,
        status: "good",
      },
    ],
  },
];

export async function getLessonResult(
  topicId: string,
): Promise<LessonResult | undefined> {
  return RESULTS.find((r) => r.topicId === topicId);
}

export function getLessonTopicIds() {
  return RESULTS.map((r) => r.topicId);
}
