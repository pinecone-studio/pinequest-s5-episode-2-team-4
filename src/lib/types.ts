// Shared data types. Mock data in src/lib/mock/ follows these; a real API should too.

import type { PixelIconName } from "@/components/ui/PixelIcon";

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

/** How rare a pet or boss is, from Common to Legendary. */
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** A pet and its evolutions: levels 1–2, 3–5, 6+. */
export type PetLine = {
  id: string;
  element: PetElement;
  /** How rare its egg is from bosses. */
  rarity: Rarity;
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
  /** Teachers: the one subject they teach (subjects.ts id). */
  subject?: string;
  /** A throwaway «Демо нэвтрэх» account, which gets demo shortcuts. */
  demo?: boolean;
};

/** A class a teacher created; its content (assignments, videos, …) is keyed by `code`. */
export type SchoolClass = {
  id: string;
  /** Unique, e.g. "7А-4821"; what accounts.class_code points at */
  code: string;
  /** What the teacher calls it, e.g. "7А" */
  name: string;
  /** subjects.ts id: the teacher's subject */
  subject: string;
  grade: number;
  studentCount?: number;
  /** For students: who teaches it */
  teacherName?: string;
};

/** A class a teacher can publish to: its code, and the name to show. */
export type ClassOption = { code: string; name: string };

/** A student in a teacher's class, as the teacher sees them. */
export type ClassMember = {
  id: string;
  username: string;
  /** Email or phone, whichever the student signed up with */
  contact?: string;
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

export type BossRarity = Rarity;

/** The battle scene drawn behind a boss. */
export type BossArena = "beach" | "reef" | "volcano" | "desert" | "bamboo" | "city";

/** A boss students fight with English answers. All numbers are tunable. */
export type Boss = {
  id: string;
  name: string;
  /** Path under /public, 64×64 pixel art. */
  sprite: string;
  elements: PetElement[];
  rarity: BossRarity;
  arena: BossArena;
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

/** Shared class XP goal; every student's XP counts towards it. */
export type ClassGoal = {
  classCode: string;
  /** The class's name to show, e.g. "7А" */
  name: string;
  targetXp: number;
  currentXp: number;
  reward: string;
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
  /** Something to read or practise, added by the teacher. */
  material?: AnswerMaterial;
};

/** A teacher adds one to a group answer: a part of a lesson in the app, or an outside link. */
export type AnswerMaterial =
  | { kind: "lesson"; subtopicId: string; part: "explanation" | "practice" }
  | { kind: "link"; url: string; title: string };

export type AnonQuestion = {
  id: string;
  subtopicId: string;
  text: string;
  /** How many students tapped «Би ч бас» */
  meToo: number;
  groupId?: string;
  time: string;
  answer?: QuestionAnswer;
  /** The AI thinks the teacher should look first (off-topic, unclear or rude). */
  needsReview?: boolean;
  /** The wrong idea the AI sees behind the question, for the teacher. */
  misconception?: string;
};

/** Similar questions grouped (as if by AI) so the teacher answers once. */
export type QuestionGroup = {
  id: string;
  subtopicId: string;
  title: string;
  questionIds: string[];
  /** answered once the teacher sent one answer to the whole class. */
  status?: "pending" | "answered";
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
  /** When the first signal came in, "09:40" (Mongolian time) */
  time: string;
};

// English boss battles (Grade 7, units from ECONTENT)

/** "subject": a battle question from another subject (math, history, ...). */
export type EnglishSkill = "grammar" | "pronunciation" | "spelling" | "translation" | "subject";

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
  /** For a question from another subject: its name, shown instead of the skill. */
  subjectTitle?: string;
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

export type BattleStatus = "lobby" | "active" | "paused" | "won" | "lost" | "ended";

/** One player's view of a battle, sent to the browser (no answers in it). */
export type BattleState = {
  id: string;
  bossId: string;
  mode: "solo" | "group" | "class";
  status: BattleStatus;
  hp: number;
  maxHp: number;
  /** Boss attacks so far; when it goes up, the browser plays the attack. */
  attackCount: number;
  attackDamage: number;
  /** When the fight began; null for a group lobby that never started. */
  startedAt: string | null;
  /** ISO times from the server; compare with serverNow, not the device clock. */
  nextAttackAt: string | null;
  deadlineAt: string | null;
  /** Class battles: when the teacher paused it (timers stand still meanwhile). */
  pausedAt: string | null;
  serverNow: string;
  /** My numbers; all zero for the teacher watching a class battle. */
  me: {
    petHp: number;
    petMaxHp: number;
    combo: number;
    bestCombo: number;
    damageDealt: number;
    correct: number;
    wrong: number;
    faints: number;
    /** Left a group battle: out, and no rewards. */
    left: boolean;
  };
  /** The question to answer now; null when the battle is over. */
  question: EnglishQuestionView | null;
  /** Why it ended: boss defeated, my pet fainted, time ran out, I left, or the teacher ended it. */
  endReason: "won" | "fainted" | "timeout" | "left" | "stopped" | null;
  /** The pet fighting for me. */
  pet: { lineId: string; level: number } | null;
  /** What I got for winning, once granted. */
  rewards: { exp: number; petExp: number; egg: { rarity: Rarity } | null } | null;
  /** Group and class battles: the code to join with, and everyone in it. */
  joinCode: string | null;
  /** Class battles: the class it is for. */
  classCode: string | null;
  isHost: boolean;
  team: TeamMember[];
};

/** How a past battle ended for this student. */
export type BattleResult = "won" | "lost" | "left" | "stopped";

/** One finished battle in a student's history. */
export type BattleHistoryEntry = {
  battleId: string;
  bossId: string;
  mode: BattleState["mode"];
  result: BattleResult;
  /** When it ended (ISO). */
  date: string;
  damage: number;
  correct: number;
  wrong: number;
  bestCombo: number;
  /** Everyone's damage together, and how many fought (1 in solo). */
  teamDamage: number;
  teamSize: number;
  rewards: { exp: number; petExp: number; egg: Rarity | null } | null;
};

/** A student's battle record: totals and the latest battles. */
export type BattleHistory = {
  battles: number;
  victories: number;
  damage: number;
  eggs: number;
  bestCombo: number;
  entries: BattleHistoryEntry[];
};

/**
 * A class's English results for the teacher, all added up: no student is
 * named or ranked anywhere in it.
 */
export type ClassEnglish = {
  classCode: string;
  students: number;
  /** Students who have answered at least one question. */
  active: number;
  attempts: number;
  correct: number;
  /** Per skill, with how many students could use more practice in it. */
  bySkill: { skill: EnglishSkill; attempts: number; correct: number; needPractice: number }[];
  byUnit: { unitId: string; title: string; attempts: number; correct: number }[];
  /** The questions the class misses most. */
  hardest: { questionId: string; prompt: string; display?: string; skill: EnglishSkill; attempts: number; correct: number }[];
  /** The teacher's recent battles with this class. */
  battles: { id: string; bossId: string; status: BattleStatus; date: string; students: number; damage: number }[];
};

/** An unfinished class battle: for the student banner and the teacher's card. */
export type ClassBattleSummary = {
  id: string;
  bossId: string;
  status: "lobby" | "active" | "paused";
  classCode: string;
  /** What the questions are about, e.g. "Математик". */
  subjectTitle: string;
  /** Students in it right now. */
  students: number;
  /** The current student is in it (students only). */
  joined: boolean;
};

/** Someone in a group battle, as everyone in it sees them. */
export type TeamMember = {
  username: string;
  lineId: string | null;
  level: number | null;
  petHp: number;
  petMaxHp: number;
  damage: number;
  correct: number;
  /** Left the battle: out, and no rewards. */
  left: boolean;
  host: boolean;
  me: boolean;
};

/** A pet in the student's collection. */
export type OwnedPet = { lineId: string; level: number; exp: number; active: boolean };

/** An egg waiting to hatch; its pet stays a surprise until then. */
export type Egg = { id: string; bossId: string; rarity: Rarity; obtainedAt: string };

/** What hatching an egg gave. */
export type HatchResult = { lineId: string; rarity: Rarity; duplicate: boolean; bonusExp: number };

/** What one answer did, shown as feedback. */
export type BattleAnswerOutcome = EnglishAnswerResult & {
  damage: number;
  petDamage: number;
  combo: number;
};

/** A student's English learning summary, built from their battle answers. */
export type EnglishProgress = {
  attempts: number;
  correct: number;
  bySkill: { skill: EnglishSkill; attempts: number; correct: number }[];
  byUnit: { unitId: string; title: string; attempts: number; correct: number }[];
  /** The skill to practise next: lowest accuracy among practised skills. */
  weakestSkill?: EnglishSkill;
  vocabulary: { learned: string[]; total: number };
  /** Latest questions whose last answer was wrong, newest first. */
  mistakes: {
    questionId: string;
    skill: EnglishSkill;
    unitTitle: string;
    prompt: string;
    display?: string;
    expected: string;
    explanation: string;
  }[];
};

/** A geometry answer drawn as a small picture instead of text. */
export type GameShape =
  | { shape: "angle"; deg: number; name: string }
  | {
      shape: "poly";
      /** Corner points around (0, 0), about −1.2…1.2; or `n` for a regular polygon. */
      pts?: [number, number][];
      n?: number;
      /** Index of the corner marked as a right angle. */
      right?: number;
      name: string;
    }
  | { shape: "rect"; w: number; h: number; name: string }
  | { shape: "tri"; b: number; h: number; name: string };

/** One answer a player can pick in a game: plain text or a shape. */
export type GameAnswer = string | GameShape;

/**
 * One game round, shared by every game: the 3 `correct` answers fit the
 * prompt, the 3 `wrong` ones are common mistakes. A game decides how many of
 * each it shows.
 */
export type GameQuestion = {
  id: string;
  prompt: string;
  correct: GameAnswer[];
  wrong: GameAnswer[];
  /** Shown after a wrong pick. */
  explanation: string;
};

export type GameSubject = {
  id: string;
  title: string;
  questions: GameQuestion[];
};

// Teacher content: lesson materials, lesson videos and game assignments
// (supabase/migrations/0013_teacher_content.sql).

/** A file a teacher uploaded with a material, in the materials bucket. */
export type MaterialFile = {
  path: string;
  mime: string;
  size: number;
  name: string;
};

/** What the AI recognised in a material; the teacher edits it before use. */
export type Recognition = {
  topic: string;
  concepts: { title: string; explanation: string }[];
  examples: { problem: string; solution: string; answer: string }[];
  mistakes: { wrong: string; why: string }[];
  formulas: string[];
};

export type Material = {
  id: string;
  topicTitle: string;
  classCode?: string;
  grade?: number;
  subject: string;
  text?: string;
  files: MaterialFile[];
  recognition?: Recognition;
  createdAt: string;
};

export type ReelSectionKind = "hook" | "step" | "example" | "question";

/** One part of a lesson reel: what the narrator says and what the screen shows. */
export type ReelSection = {
  kind: ReelSectionKind;
  /** Spoken narration */
  say: string;
  /** Short on-screen title */
  caption: string;
  /** Optional formula shown big, e.g. "1/2 + 1/3 = 5/6" */
  formula?: string;
};

export type ReelScript = {
  title: string;
  sections: ReelSection[];
};

/** Textbook-style explanation students can read instead of watching. */
export type BookText = {
  blocks: { heading: string; body: string; formula?: string }[];
};

/** When each word and section is spoken, in ms from the start. */
export type ReelTimings = {
  words: { text: string; start: number; end: number }[];
  sections: { start: number; end: number }[];
  duration: number;
};

export type LessonVideoStatus = "draft" | "approved" | "published";

export type LessonVideo = {
  id: string;
  title: string;
  classCode: string;
  status: LessonVideoStatus;
  script: ReelScript;
  book?: BookText;
  /** Signed URL of the narration, when there is audio */
  audioUrl?: string;
  timings?: ReelTimings;
  materialId?: string;
  updatedAt: string;
  publishedAt?: string;
};

export type AssignmentGameMode = "fixed" | "interest";
export type AssignmentTarget = "class" | "weak";

export type Assignment = {
  id: string;
  title: string;
  classCode: string;
  subject: string;
  games: string[];
  gameMode: AssignmentGameMode;
  target: AssignmentTarget;
  targetSubtopicId?: string;
  dueAt?: string;
  status: "draft" | "published";
  createdAt: string;
};

/** How a class did on an assignment: counts only, no student names. */
export type AssignmentReport = {
  assignment: Assignment;
  questions: GameQuestion[];
  /** Students who finished it at least once */
  doneCount: number;
  attemptCount: number;
  averageAccuracy: number;
  /** Most-missed first */
  missed: { questionId: string; count: number }[];
};

/** A textbook chapter, for suggesting lesson topics to teachers. */
export type CurriculumChapter = {
  order: number;
  title: string;
  /** Textbook lesson titles, in order */
  lessons: string[];
};

/** One of the teacher's class battles, in the history list. */
export type BattleLogEntry = {
  id: string;
  bossId: string;
  subjectTitle: string;
  classCode: string;
  status: BattleStatus;
  date: string;
  students: number;
  answers: number;
  correct: number;
};

/** How a class answered one battle question; nobody is named. */
export type BattleQuestionResult = {
  questionId: string;
  prompt: string;
  display?: string;
  expected: string;
  answers: number;
  correct: number;
  /** Students who got it at least once */
  students: number;
};

/** The teacher's class battles and, for the chosen one, every answer added up. */
export type BattleLog = {
  battles: BattleLogEntry[];
  selected?: BattleLogEntry & {
    questions: BattleQuestionResult[];
    /** Per student in the order they joined, numbered instead of named. */
    perStudent: { correct: number; wrong: number; damage: number }[];
  };
};

// Lesson schedule (supabase/migrations/0018_lesson_schedule.sql)

/** A topic a lesson can be about; `key` is what «Ойлгосон уу?» signals use. */
export type LessonTopic = {
  key: string;
  title: string;
  /** e.g. the curriculum chapter, to group a long list */
  group?: string;
};

/** The topic a teacher planned for one lesson day. */
export type LessonPlan = {
  /** "YYYY-MM-DD" */
  day: string;
  topicKey: string;
  topicTitle: string;
};

/** Today's lesson for a student: asked «Ойлгосон уу?» on lesson days. */
export type TodayLesson = {
  day: string;
  /** The planned topic; without one the student picks from `options`. */
  topic?: LessonTopic;
  options: LessonTopic[];
  /** What the student already answered today */
  answered?: { topicKey: string; level: SignalLevel };
};

/** The teacher's open class: lesson weekdays and the next lesson days. */
export type ClassSchedule = {
  className: string;
  /** ISO weekdays, Monday = 1 */
  lessonDays: number[];
  upcoming: { day: string; plan?: LessonPlan }[];
  /** What a day can be about: the curriculum plus topics the teacher typed before */
  topics: LessonTopic[];
  /** False for demo teachers: changes aren't saved */
  editable: boolean;
};

/** One lesson day's signals for the teacher, per topic. */
export type LessonDaySignals = {
  day: string;
  rows: (SignalSummary & { title: string })[];
};

/** A school week (Monday to Sunday, "YYYY-MM-DD"); the current one ends today. */
export type SignalWeek = { from: string; to: string };

/** The lesson days of one week, and the weeks a teacher can pick from (newest first). */
export type WeekSignals = {
  week: SignalWeek;
  days: LessonDaySignals[];
  weeks: SignalWeek[];
};

/** What a student does that daily quests count. */
export type QuestEvent = "game" | "practice" | "video" | "battle" | "assignment";

/** A daily quest: do `goal` of `event` today for a bonus. */
export type Quest = {
  id: string;
  event: QuestEvent;
  goal: number;
  title: string;
  /** The bonus when it's claimed. */
  xp: number;
  coins: number;
};

/** Today's quest with how far the student got. */
export type DailyQuest = Quest & { progress: number; done: boolean; claimed: boolean };

/** What counts toward the day's quests, saved with the account and reset each day. */
export type QuestLog = {
  /** The learning day (Ulaanbaatar) the counts are for. */
  day: string;
  counts: Partial<Record<QuestEvent, number>>;
  /** Quest ids already claimed today. */
  claimed: string[];
};

/** What an achievement counts. */
export type AchievementStat =
  | "testTaken"
  | "longestStreak"
  | "practiceSolved"
  | "mastered"
  | "gamesPlayed"
  | "bossWins"
  | "eggsWon"
  | "petsCollected"
  | "petLevel"
  | "videosSeen"
  | "assignmentsDone";

/** A milestone: reach `goal` of `stat` once for its coins. */
export type Achievement = {
  id: string;
  icon: PixelIconName;
  title: string;
  /** What to do, e.g. "10 боссыг ял". */
  description: string;
  stat: AchievementStat;
  goal: number;
  coins: number;
};

/** An achievement with how far the student got. */
export type AchievementProgress = Achievement & {
  progress: number;
  unlocked: boolean;
  /** When it was unlocked (ISO date). */
  unlockedAt?: string;
};

/** What a shop item changes; one item of each is worn at a time. */
export type ShopSlot = "scene" | "ring" | "aura";

/** The pet scene's artwork colours (the same keys PetScene draws with). */
export type ScenePalette = Record<
  "sky" | "haze" | "pink" | "mountain" | "hill" | "ground" | "meadow" | "grass" | "primary" | "bloomPink" | "bloomViolet" | "night" | "white",
  string
>;

type ShopItemBase = { id: string; name: string; description: string; price: number };

/** Something to buy with coins: a habitat scene, an XP ring colour or an aura around the pet. */
export type ShopItem =
  | (ShopItemBase & { slot: "scene"; palette: ScenePalette })
  /** One colour, or several for a gradient. */
  | (ShopItemBase & { slot: "ring"; colors: string[] })
  | (ShopItemBase & { slot: "aura"; shape: "sparkle" | "heart"; colors: string[] });

/** What the student owns and wears, saved with the account. */
export type ShopState = { owned: string[]; equipped: Partial<Record<ShopSlot, string>> };

/** A shop item with whether the student owns and wears it. */
export type ShopEntry = ShopItem & { owned: boolean; equipped: boolean };
