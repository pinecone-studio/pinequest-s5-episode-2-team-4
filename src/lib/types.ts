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

export type BossRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** A boss students fight with English answers. All numbers are tunable. */
export type Boss = {
  id: string;
  name: string;
  /** Path under /public, 64×64 pixel art. */
  sprite: string;
  elements: PetElement[];
  rarity: BossRarity;
  /** 1 easiest … 5 hardest; also the order on the boss list. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Short Mongolian description. */
  description: string;
  /** HP in a solo battle. */
  maxHp: number;
  /** Extra HP for each extra player, as a share of maxHp (group and class battles). */
  hpPerExtraPlayer: number;
  /** Question difficulties this boss asks. */
  questionDifficulty: { min: 1 | 2 | 3; max: 1 | 2 | 3 };
  attack: {
    /** Seconds between attacks, picked at random in this range (10–20). */
    minIntervalSec: number;
    maxIntervalSec: number;
    /** Warning shown before each attack. */
    warningSec: number;
    /** Damage to each participating pet. */
    damage: number;
  };
  rewards: {
    exp: number;
    /** Chance of an egg on victory, 0–1. */
    eggChance: number;
    /** Pet lines the egg can hatch into, with relative weights. */
    eggPool: { lineId: string; weight: number }[];
  };
};
