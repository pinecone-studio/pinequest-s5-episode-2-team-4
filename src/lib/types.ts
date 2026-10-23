// Shared data types. Mock data in src/lib/mock/ follows these; a real API should too.

/** A fraction, optionally with a whole part: 2 1/3 → { whole: 2, num: 1, den: 3 }. */
export type FractionValue = {
  whole?: number;
  num: number;
  den: number;
};

/** One piece of a math expression, e.g. 1/2 + 1/3 = ? */
export type ExpressionToken =
  | { kind: "fraction"; value: FractionValue }
  | { kind: "op"; op: "+" | "−" | "×" | "=" }
  | { kind: "blank" };

export type SubtopicStatus = "weak" | "learning" | "good" | "mastered" | "new";

export type Topic = {
  id: string;
  title: string;
  subtopicIds: string[];
};

export type Subtopic = {
  id: string;
  topicId: string;
  /** 1-based position on the topic map */
  order: number;
  title: string;
  /** Longer name used as the lesson title */
  lessonTitle: string;
};

/** A textbook chapter on the year's roadmap. */
export type Chapter = {
  id: string;
  /** 1-based; shown as a Roman numeral */
  order: number;
  title: string;
  /** Textbook lesson titles, in order */
  lessons: string[];
  /** The topic whose subtopics are playable in this chapter, if any */
  topicId?: string;
  /** Playable subtopic ids per textbook lesson; other lessons are "coming soon" */
  lessonSubtopics?: Record<string, string[]>;
  /** Counts as done without playing (studied before LevelUp) */
  assumedDone?: boolean;
};

/** done: finished; current: being learned; locked: under the clouds. */
export type ChapterStatus = "done" | "current" | "locked";

export type SubtopicProgress = {
  subtopicId: string;
  status: SubtopicStatus;
};

export type Question = {
  id: string;
  subtopicId: string;
  prompt: string;
  expression: ExpressionToken[];
  options: FractionValue[];
  correctIndex: number;
};

export type SubtopicScore = SubtopicProgress & {
  correct: number;
  total: number;
};

export type TestResult = {
  topicId: string;
  correct: number;
  total: number;
  /** Weakest first, as shown on the results page. */
  subtopics: SubtopicScore[];
};

/** Result of the retest that mastered a subtopic (mastered page). */
export type MasteryResult = {
  subtopicId: string;
  score: { correct: number; total: number };
  /** Topic progress after mastering; the mastered subtopic is "new". */
  progress: SubtopicProgress[];
  pet: PetLevelUp;
};

export type Lesson = {
  subtopicId: string;
  title: string;
  approvedByTeacher: boolean;
  /** The typical wrong answer, e.g. 1/2 + 1/3 = 2/5 */
  mistake: { expression: ExpressionToken[]; explanation: string };
  steps: string[];
  practice: Question[];
};

export type ChatMessage = {
  from: "student" | "helper";
  text: string;
};

export type PetElement =
  | "water"
  | "fire"
  | "wood"
  | "ice"
  | "sky"
  | "metal"
  | "earth"
  | "shadow";

export type PetStage = {
  name: string;
  /** Path under /public, e.g. /pets/wrougon.png */
  sprite: string;
};

/** A pet and its evolutions: levels 1–2, 3–5, 6+. */
export type PetLine = {
  id: string;
  element: PetElement;
  stages: [PetStage, PetStage, PetStage];
};

/** A pet gaining a level after a mastery. */
export type PetLevelUp = {
  lineId: string;
  from: { stage: PetStage; level: number };
  to: { stage: PetStage; level: number };
  mood: string;
  /** XP towards the next level after the level-up, 0–100 */
  xp: number;
  xpGained: number;
  /** Level of the next evolution, or undefined at the last stage */
  nextEvolutionLevel?: number;
};

export type UserPet = {
  /** Pet line id, e.g. "wrougon" (see pet data) */
  lineId: string;
  level: number;
  /** XP towards the next level, 0–100 */
  xp: number;
};

export type User = {
  id: string;
  username: string;
  role: "student" | "teacher";
  classCode?: string;
  grade: number;
  /** Subject id, e.g. "math" (see src/lib/school.ts) */
  subject: string;
  pet?: UserPet;
};

/** A student's status in a subtopic, as counted in the class report. */
export type HeatmapStatus = "weak" | "learning" | "good" | "untested";

/** A class a teacher created; students join with its code. */
export type SchoolClass = {
  code: string;
  name: string;
  grade: number;
  subject: string;
  topicId: string;
};

/**
 * How many students in a class are at each status for one subtopic. Counts
 * only: the teacher never sees which student is which.
 */
export type SubtopicCounts = {
  subtopicId: string;
  weak: number;
  learning: number;
  good: number;
  untested: number;
};

export type ClassReport = {
  schoolClass: SchoolClass;
  studentCount: number;
  testedCount: number;
  /** Students who joined with the code in this browser (the rest is demo data) */
  joinedCount: number;
  /** Weakest first */
  subtopics: SubtopicCounts[];
};

export type ExerciseItem = { question: string; answer: string };

/** Exercises a teacher sent to "the students weak in this subtopic" of a class. */
export type Assignment = {
  id: string;
  classCode: string;
  subtopicId: string;
  items: ExerciseItem[];
  /** yyyy-mm-dd */
  due?: string;
};

export type TeacherNotification = {
  id: string;
  kind: "failed" | "common-mistake" | "mastered";
  title: string;
  subtopicId: string;
  time: string;
};
