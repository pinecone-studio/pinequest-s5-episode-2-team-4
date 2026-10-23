import type { ExerciseItem, SubtopicCounts, TeacherNotification } from "@/lib/types";

/**
 * Demo classmates every class starts with (32 students, 28 tested), so the
 * dashboard isn't empty in a demo. Real students who join with the class
 * code in this browser are added on top. Counts only, no student data.
 */
export const demoClassSize = 32;
export const demoTestedCount = 28;

export const demoCounts: SubtopicCounts[] = [
  { subtopicId: "same-denominator", weak: 2, learning: 0, good: 26, untested: 4 },
  { subtopicId: "different-denominator", weak: 12, learning: 3, good: 13, untested: 4 },
  { subtopicId: "simplify", weak: 8, learning: 2, good: 18, untested: 4 },
  { subtopicId: "mixed-numbers", weak: 5, learning: 1, good: 22, untested: 4 },
  { subtopicId: "subtract-fractions", weak: 10, learning: 3, good: 15, untested: 4 },
  { subtopicId: "multiply-fractions", weak: 4, learning: 2, good: 22, untested: 4 },
];

/** Suggested exercises when Gemini isn't available. */
export const demoExercises: Record<string, ExerciseItem[]> = {
  "different-denominator": [
    { question: "1/2 + 1/4 = ?", answer: "3/4" },
    { question: "2/3 + 1/6 = ?", answer: "5/6" },
    { question: "1/3 + 1/4 = ?", answer: "7/12" },
    { question: "3/5 + 1/10 = ?", answer: "7/10" },
    {
      question: "Бат номынхоо 1/2-ийг, маргааш нь 1/3-ийг уншсан. Нийт хэд вэ?",
      answer: "5/6",
    },
  ],
  "subtract-fractions": [
    { question: "3/4 − 1/2 = ?", answer: "1/4" },
    { question: "5/6 − 1/3 = ?", answer: "1/2" },
    { question: "7/10 − 1/5 = ?", answer: "1/2" },
    { question: "2/3 − 1/4 = ?", answer: "5/12" },
    {
      question: "Сараа 3/4 литр сүүнээс 1/3 литрийг уусан. Хэдэн литр үлдсэн бэ?",
      answer: "5/12",
    },
  ],
};

/** Anonymous alerts: numbers of students, never who they are. */
export const notifications: TeacherNotification[] = [
  {
    id: "n1",
    kind: "failed",
    title: "3 сурагч 2 удаа тэнцээгүй",
    subtopicId: "different-denominator",
    time: "09:42",
  },
  {
    id: "n2",
    kind: "common-mistake",
    title: "12 сурагч: 1/2 + 1/3 = 2/5",
    subtopicId: "different-denominator",
    time: "Өнөөдөр",
  },
  {
    id: "n3",
    kind: "failed",
    title: "2 сурагч 2 удаа тэнцээгүй",
    subtopicId: "subtract-fractions",
    time: "Өчигдөр",
  },
  {
    id: "n4",
    kind: "mastered",
    title: "4 сурагч эзэмшлээ",
    subtopicId: "mixed-numbers",
    time: "10:15",
  },
];
