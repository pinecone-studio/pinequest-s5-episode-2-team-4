// School subjects a teacher teaches. Each teacher picks one at sign-up and
// works only in it: boss battles, game assignments and lesson videos. Used
// on the server and in forms.

export type TeacherSubject = {
  id: string;
  title: string;
  /** Boss battle question sets for this subject (battle-questions.ts ids). */
  battleTopics: string[];
};

export const TEACHER_SUBJECTS: TeacherSubject[] = [
  { id: "math", title: "Математик", battleTopics: ["math", "nemhas", "modul", "geom", "hard7"] },
  { id: "mon", title: "Монгол хэл", battleTopics: ["mon"] },
  { id: "eng", title: "Англи хэл", battleTopics: ["eng"] },
  { id: "phys", title: "Физик", battleTopics: ["phys"] },
  { id: "chem", title: "Хими", battleTopics: ["chem"] },
  { id: "bio", title: "Биологи", battleTopics: ["bio"] },
  { id: "hist", title: "Монголын түүх", battleTopics: ["hist"] },
  { id: "geo", title: "Газарзүй", battleTopics: ["geo"] },
];

export const teacherSubject = (id: unknown) => TEACHER_SUBJECTS.find((s) => s.id === id);

export const subjectTitle = (id: string) => teacherSubject(id)?.title ?? id;

/** School grades a student in no class can pick to practise. */
export const GRADES = [6, 7, 8, 9, 10, 11, 12];

/** Grades with content so far; the rest show as coming soon. */
export const OPEN_GRADES = [7];
