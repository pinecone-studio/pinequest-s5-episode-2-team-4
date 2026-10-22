import type { Question, TestResult } from "@/lib/types";
import { blank, equals, f, frac, plus } from "./helpers";

/** Diagnostic test for the fractions topic: 2 questions per subtopic. */
export const testQuestions: Question[] = [
  {
    id: "q1",
    subtopicId: "same-denominator",
    prompt: "Нийлбэрийг ол",
    expression: [frac(2, 7), plus, frac(3, 7), equals, blank],
    options: [f(5, 14), f(5, 7), f(6, 7), f(1, 7)],
    correctIndex: 1,
  },
  {
    id: "q2",
    subtopicId: "same-denominator",
    prompt: "Нийлбэрийг ол",
    expression: [frac(5, 9), plus, frac(2, 9), equals, blank],
    options: [f(7, 18), f(3, 9), f(7, 9), f(10, 9)],
    correctIndex: 2,
  },
  {
    id: "q3",
    subtopicId: "different-denominator",
    prompt: "Нийлбэрийг ол",
    expression: [frac(1, 2), plus, frac(1, 3), equals, blank],
    options: [f(2, 5), f(2, 6), f(5, 6), f(1, 6)],
    correctIndex: 2,
  },
  {
    id: "q4",
    subtopicId: "different-denominator",
    prompt: "Нийлбэрийг ол",
    expression: [frac(1, 4), plus, frac(2, 3), equals, blank],
    options: [f(11, 12), f(3, 7), f(3, 12), f(8, 12)],
    correctIndex: 0,
  },
  {
    id: "q5",
    subtopicId: "simplify",
    prompt: "Хураа",
    expression: [frac(6, 8), equals, blank],
    options: [f(6, 4), f(3, 8), f(2, 3), f(3, 4)],
    correctIndex: 3,
  },
  {
    id: "q6",
    subtopicId: "simplify",
    prompt: "Хураа",
    expression: [frac(10, 15), equals, blank],
    options: [f(1, 3), f(2, 5), f(2, 3), f(5, 3)],
    correctIndex: 2,
  },
  {
    id: "q7",
    subtopicId: "mixed-numbers",
    prompt: "Зөв биш бутархай болго",
    expression: [frac(1, 3, 2), equals, blank],
    options: [f(5, 3), f(7, 3), f(6, 3), f(2, 3)],
    correctIndex: 1,
  },
  {
    id: "q8",
    subtopicId: "mixed-numbers",
    prompt: "Холимог тоо болго",
    expression: [frac(11, 4), equals, blank],
    options: [f(1, 4, 3), f(3, 4, 1), f(1, 4, 2), f(3, 4, 2)],
    correctIndex: 3,
  },
];

/** Result shown on the lesson page after the demo test. */
export const testResult: TestResult = {
  topicId: "fractions",
  correct: 5,
  total: 8,
  progress: [
    { subtopicId: "different-denominator", status: "weak" },
    { subtopicId: "simplify", status: "weak" },
    { subtopicId: "same-denominator", status: "good" },
    { subtopicId: "mixed-numbers", status: "good" },
  ],
};
