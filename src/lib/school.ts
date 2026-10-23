// Grades and subjects a student can pick. Only grade 7 math has content so
// far; the rest show as "coming soon".

export type Subject = { id: string; label: string; available: boolean };

export const SUBJECTS: Subject[] = [
  { id: "math", label: "Математик", available: true },
  { id: "mongolian", label: "Монгол хэл", available: false },
  { id: "english", label: "Англи хэл", available: false },
  { id: "physics", label: "Физик", available: false },
];

export const GRADES = [5, 6, 7, 8, 9].map((grade) => ({
  grade,
  available: grade === 7,
}));

export const DEFAULT_GRADE = 7;
export const DEFAULT_SUBJECT = "math";

/** Keeps only an available grade and subject, else the defaults. */
export function cleanSchool(grade?: number, subject?: string) {
  return {
    grade: GRADES.some((g) => g.grade === grade && g.available) ? grade! : DEFAULT_GRADE,
    subject: SUBJECTS.some((s) => s.id === subject && s.available) ? subject! : DEFAULT_SUBJECT,
  };
}

export function subjectLabel(id: string | undefined) {
  return SUBJECTS.find((s) => s.id === id)?.label ?? SUBJECTS[0].label;
}
