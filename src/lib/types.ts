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
  | { kind: "op"; op: "+" | "−" | "=" }
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
  pet?: UserPet;
};

/** Teacher heatmap cell; "untested" = has not taken the test. */
export type HeatmapStatus = "weak" | "learning" | "good" | "untested";

export type ClassOverview = {
  code: string;
  topicId: string;
  studentCount: number;
  testedCount: number;
  weakestSubtopicId: string;
  weakestCount: number;
};

export type HeatmapRow = {
  subtopicId: string;
  /** One status per student, in student number order (№01, №02, …) */
  cells: HeatmapStatus[];
};

export type AssignmentDraft = {
  id: string;
  subtopicId: string;
  status: "draft" | "published";
  items: { question: string; answer: string }[];
  /** Student numbers the assignment goes to */
  assignedTo: number[];
};

export type TeacherNotification = {
  id: string;
  kind: "failed" | "common-mistake" | "mastered";
  title: string;
  subtopicId: string;
  time: string;
};

// Anonymous questions: the teacher or a classmate answers, not the AI.

export type QuestionAnswer = {
  by: "teacher" | "peer";
  /** Student number of the classmate who answered, for peer answers */
  studentNo?: number;
  text: string;
  /** Peer answers reach other students only after the teacher approves them */
  approved: boolean;
  /** «Чи сайн тайлбарласан» count */
  kudos: number;
};

export type AnonQuestion = {
  id: string;
  subtopicId: string;
  text: string;
  /** How many students tapped «Би ч бас» */
  meToo: number;
  groupId?: string;
  time: string;
  answer?: QuestionAnswer;
};

/** Similar questions grouped (as if by AI) so the teacher answers once. */
export type QuestionGroup = {
  id: string;
  subtopicId: string;
  title: string;
  questionIds: string[];
};

/** Understanding signal a student sends during a lesson: 🟢 got it, 🟡 unsure, 🔴 lost. */
export type SignalLevel = "got" | "unsure" | "lost";

export type UnderstandingSignal = {
  /** Student number (№01, №02, …); the teacher sees counts, not names */
  studentNo: number;
  subtopicId: string;
  level: SignalLevel;
  time: string;
};

export type SignalSummary = {
  subtopicId: string;
  counts: Record<SignalLevel, number>;
};

// English boss battles (Grade 7, units from ECONTENT)

export type EnglishSkill = "grammar" | "pronunciation" | "spelling" | "translation";

/** A Grade 7 English unit; titles are the ones listed on ECONTENT. */
export type EnglishUnit = {
  id: string;
  order: number;
  title: string;
  /** Where the unit is listed, for teachers to check questions against. */
  sourceUrl: string;
};

type EnglishQuestionBase = {
  id: string;
  unitId: string;
  skill: EnglishSkill;
  /** 1 easy … 3 hard; harder questions deal more damage. */
  difficulty: 1 | 2 | 3;
  prompt: string;
  /** Shown under the prompt, e.g. "h _ b b y" or a sentence to fix. */
  display?: string;
  hint?: string;
  /** English text the browser reads aloud (listening questions). */
  speak?: string;
  /** Why the answer is right; shown after every answer. */
  explanation: string;
  /**
   * Original practice questions written from the unit title. False until a
   * teacher has checked them against the textbook.
   */
  verified: boolean;
};

export type EnglishQuestion =
  | (EnglishQuestionBase & { kind: "choice"; options: string[]; correctIndex: number })
  | (EnglishQuestionBase & { kind: "text"; acceptedAnswers: string[] })
  | (EnglishQuestionBase & {
      kind: "order";
      /** The words in scrambled order. */
      words: string[];
      acceptedAnswers: string[];
    });

/** What the browser gets: everything except the answers. */
export type EnglishQuestionView =
  | (EnglishQuestionBase & { kind: "choice"; options: string[] })
  | (EnglishQuestionBase & { kind: "text" })
  | (EnglishQuestionBase & { kind: "order"; words: string[] });

/** A choice index, or typed / ordered text. */
export type EnglishAnswer = number | string;

export type EnglishAnswerResult = {
  correct: boolean;
  /** The right answer as text, to show after a wrong one. */
  expected: string;
  explanation: string;
};
