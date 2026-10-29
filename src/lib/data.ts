// Data access layer. Pages and components read data only through these
// functions, never by importing src/lib/mock directly, so a real API can
// replace the mock later without touching the UI.
//
// The functions are async like a real API. Call them in Server Components
// (pages, layouts) and pass the result to Client Components as props.

import { io } from "next/cache";
import { cache } from "react";
import {
  activeGroupBattleId,
  activeSoloBattleId,
  battleState,
  classBattleState,
  normalClassCode,
  openClassBattle,
  teacherClassBattle,
} from "./battle";
import { petCollection, unhatchedEggs } from "./collection";
import { battleHistory, classBattleLog, classEnglish } from "./history";
import { checkEnglishAnswer, toQuestionView } from "./english";
import { findResetAccount } from "./password-reset";
import { englishProgress } from "./progress";
import { listGroups, listQuestions, questionsStored } from "./questions";
import { XP_PER_LEVEL, nextEvolutionLevel, petStage } from "./pets";
import {
  countClassStudents,
  finishedAssignmentIds,
  getClassAssignment,
  getClassVideo as getClassVideoRow,
  getMaterial as getMaterialRow,
  getTeacherAssignment as getTeacherAssignmentRow,
  getTeacherVideo as getTeacherVideoRow,
  listAttempts,
  listClassAssignments,
  listClassVideos,
  listTeacherAssignments,
  listTeacherVideos,
} from "./content";
import { isAssignmentGame } from "./gamefit";
import { grade7MathCurriculum } from "./mock/curriculum";
import { DEMO_CLASS_CODE } from "./accounts";
import {
  classPetXp,
  classesStored,
  countClassMembers,
  findInviteClass,
  listClassMembers,
  listClassTestAnswers,
  listStudentClasses,
  listTeacherClasses,
} from "./classes";
import { questsWithProgress } from "./quests";
import { readSession } from "./session";
import { classOverviewFrom, heatmapFrom, progressFrom, scoreTest, type ClassProgress } from "./scoring";
import { findSignal, listDaySignals, listSignalsBetween, signalsStored, summarizeSignals } from "./signals";
import { getLessonDays, listPlans } from "./schedule";
import {
  curriculumTopics,
  isCustomTopic,
  isoWeekday,
  recentWeeks,
  topicTitle,
  upcomingLessonDays,
} from "./lesson-topics";
import { learningDay, shiftDay, streakSummary } from "./streak";
import type {
  DailyQuest,
  Assignment,
  AssignmentDraft,
  ClassSchedule,
  LessonDaySignals,
  LessonTopic,
  TodayLesson,
  WeekSignals,
  AssignmentReport,
  ClassOverview,
  HeatmapRow,
  TeacherNotification,
  CurriculumChapter,
  LessonVideo,
  Material,
  BattleHistory,
  BattleLog,
  BattleState,
  Boss,
  ClassBattleSummary,
  ClassEnglish,
  ClassGoal,
  AnonQuestion,
  EnglishAnswer,
  EnglishAnswerResult,
  EnglishProgress,
  Egg,
  OwnedPet,
  EnglishQuestionView,
  EnglishSkill,
  EnglishUnit,
  GameQuestion,
  GameSubject,
  Lesson,
  MasteryResult,
  PetLine,
  Question,
  QuestionGroup,
  SignalLevel,
  SignalSummary,
  Subtopic,
  SubtopicProgress,
  TestResult,
  Topic,
  User,
  SchoolClass,
  ClassMember,
  ClassOption,
} from "./types";
import {
  helperConversation,
  helperFallbackReply,
  helperReplies,
  helperSuggestions,
  lessons,
} from "./mock/lessons";
import { sampleTestAnswers, testQuestions } from "./mock/questions";
import {
  assignmentDraft,
  classGoal,
  classOverview,
  heatmap,
  notifications,
} from "./mock/teacher";
import { bosses } from "./mock/bosses";
import { gameSubjects } from "./mock/games";
import { anonQuestions, questionGroups } from "./mock/anonQuestions";
import { BATTLE_SUBJECTS } from "./battle-questions";
import { teacherSubject } from "./subjects";
import { englishQuestions, englishUnits } from "./mock/english";
import { petLines } from "./mock/pets";
import { signals } from "./mock/signals";
import { subtopics, topics } from "./mock/topics";

// Student

export async function getLearningStreak() {
  // Today's streak must use the request's date, never a prerendered date.
  await io();
  return streakSummary((await readSession())?.streak);
}

/** The logged-in user, or undefined when logged out. */
export async function getCurrentUser(): Promise<User | undefined> {
  const session = await readSession();
  if (!session) return undefined;
  return {
    id: session.id,
    username: session.username,
    role: session.role,
    classCode: session.classCode,
    pet: session.pet,
    subject: session.subject,
    demo: session.demo,
  };
}

/** Whose password a reset link is for, or undefined once it's used or expired. */
export async function getPasswordResetUsername(token: string): Promise<string | undefined> {
  return (await findResetAccount(token))?.username;
}

// Pets

export async function getPetLines(): Promise<PetLine[]> {
  return petLines;
}

export async function getPetLine(id: string): Promise<PetLine | undefined> {
  return petLines.find((l) => l.id === id);
}

/** Today's daily quests with the student's progress (none for teachers). */
export async function getDailyQuests(): Promise<DailyQuest[]> {
  const session = await readSession();
  if (session?.role !== "student") return [];
  return questsWithProgress(session.quests, Boolean(session.classCode));
}

/** The current user's pet with its line and the stage for its level. */
export async function getCurrentPet() {
  const pet = (await readSession())?.pet;
  const line = pet && petLines.find((l) => l.id === pet.lineId);
  if (!pet || !line) return undefined;
  return { ...pet, line, stage: petStage(line, pet.level) };
}

// Topics and progress

export async function getTopics(): Promise<Topic[]> {
  return topics;
}

export async function getTopic(topicId: string): Promise<Topic | undefined> {
  return topics.find((t) => t.id === topicId);
}

export async function getSubtopics(topicId: string): Promise<Subtopic[]> {
  return subtopics
    .filter((s) => s.topicId === topicId)
    .sort((a, b) => a.order - b.order);
}

export async function getSubtopic(id: string): Promise<Subtopic | undefined> {
  return subtopics.find((s) => s.id === id);
}

/**
 * The test result per subtopic, with retest-passed subtopics "mastered".
 * Empty until the diagnostic test is taken ("new" means just mastered).
 */
export async function getProgress(): Promise<SubtopicProgress[]> {
  const [result, session] = await Promise.all([getTestResult(), readSession()]);
  return progressFrom(result, session?.mastered);
}

export async function getTestQuestions(topicId: string) {
  return testQuestions.filter((q) =>
    topics.find((t) => t.id === topicId)?.subtopicIds.includes(q.subtopicId),
  );
}

/**
 * Scores the current user's saved test answers per subtopic, weakest first.
 * Undefined until the test is taken.
 */
export async function getTestResult(): Promise<TestResult | undefined> {
  return scoreTest((await readSession())?.testAnswers);
}

/**
 * The retest that just mastered `subtopicId`: its score and the pet's level
 * before and after; the subtopic is "new" in the progress. Undefined unless
 * the user's latest retest passed for this subtopic.
 */
export async function getMasteryResult(
  subtopicId: string,
): Promise<MasteryResult | undefined> {
  const [session, pet, progress] = await Promise.all([
    readSession(),
    getCurrentPet(),
    getProgress(),
  ]);
  const retest = session?.lastRetest;
  if (!pet || !retest?.passed || retest.subtopicId !== subtopicId) return undefined;

  return {
    subtopicId,
    score: { correct: retest.correct, total: retest.total },
    progress: progress.map((p) =>
      p.subtopicId === subtopicId ? { ...p, status: "new" } : p,
    ),
    pet: {
      lineId: pet.lineId,
      from: { stage: petStage(pet.line, retest.fromLevel), level: retest.fromLevel },
      to: { stage: pet.stage, level: pet.level },
      mood: "Баяртай",
      xp: pet.xp,
      xpGained: (retest.toLevel - retest.fromLevel) * XP_PER_LEVEL,
      nextEvolutionLevel: nextEvolutionLevel(pet.level),
    },
  };
}

/**
 * The retest that masters a subtopic: its 2 diagnostic test questions and
 * its lesson's practice questions.
 */
export async function getRetestQuestions(subtopicId: string): Promise<Question[]> {
  const lesson = lessons.find((l) => l.subtopicId === subtopicId);
  return [
    ...testQuestions.filter((q) => q.subtopicId === subtopicId),
    ...(lesson?.practice ?? []),
  ];
}

/** Demo answers that fill the diagnostic test (5/8); demo accounts only. */
export async function getSampleTestAnswers(): Promise<Record<string, number> | undefined> {
  return (await getCurrentUser())?.demo ? sampleTestAnswers : undefined;
}

/** Demo answers that pass a subtopic's retest: all correct; demo accounts only. */
export async function getSampleRetestAnswers(
  subtopicId: string,
): Promise<Record<string, number> | undefined> {
  if (!(await getCurrentUser())?.demo) return undefined;
  const questions = await getRetestQuestions(subtopicId);
  return Object.fromEntries(questions.map((q) => [q.id, q.correctIndex]));
}

/** The current user's latest subtopic retest, passed or not. */
export async function getLastRetest() {
  return (await readSession())?.lastRetest;
}

/** Practice question ids the current user has solved. */
export async function getSolvedPractice(): Promise<string[]> {
  return (await readSession())?.practiceSolved ?? [];
}

export async function getLesson(subtopicId: string): Promise<Lesson | undefined> {
  return lessons.find((l) => l.subtopicId === subtopicId);
}

// AI helper (canned replies until a real AI API is connected)

export async function getHelperConversation() {
  return { messages: helperConversation, suggestions: helperSuggestions };
}

export async function askHelper(question: string): Promise<string> {
  return helperReplies[question] ?? helperFallbackReply;
}

// Bosses

/** All bosses, easiest first. */
export async function getBosses(): Promise<Boss[]> {
  return [...bosses].sort((a, b) => a.difficulty - b.difficulty);
}

export async function getBoss(id: string): Promise<Boss | undefined> {
  return bosses.find((b) => b.id === id);
}

/** The current student's view of a battle, or undefined if they aren't in it. */
export async function getBattle(battleId: string): Promise<BattleState | undefined> {
  const user = await getCurrentUser();
  return user ? battleState(user, battleId) : undefined;
}

/** The current student's pets (active one marked) and player level. */
export async function getPetCollection(): Promise<
  { pets: OwnedPet[]; player: { level: number; exp: number } } | undefined
> {
  const user = await getCurrentUser();
  return user ? petCollection(user) : undefined;
}

/** The current student's eggs waiting to hatch. */
export async function getEggs(): Promise<Egg[]> {
  const user = await getCurrentUser();
  return user ? unhatchedEggs(user) : [];
}

/** The current student's English learning summary from their battle answers. */
export async function getEnglishProgress(): Promise<EnglishProgress | undefined> {
  const user = await getCurrentUser();
  return user ? englishProgress(user) : undefined;
}

/** The current student's unfinished group battle (lobby or fight), if any. */
export async function getActiveGroupBattleId(): Promise<string | undefined> {
  const user = await getCurrentUser();
  return user ? activeGroupBattleId(user) : undefined;
}

/** The current student's unfinished solo battle, if any. */
export async function getActiveSoloBattleId(): Promise<string | undefined> {
  const user = await getCurrentUser();
  return user ? activeSoloBattleId(user) : undefined;
}

/** The unfinished battle for the current student's class, if any. */
export async function getOpenClassBattle(): Promise<ClassBattleSummary | undefined> {
  const user = await getCurrentUser();
  return user?.role === "student" ? openClassBattle(user) : undefined;
}

/** The current teacher's unfinished class battle, if any. */
export async function getTeacherClassBattle(): Promise<ClassBattleSummary | undefined> {
  const user = await getCurrentUser();
  return user?.role === "teacher" ? teacherClassBattle(user) : undefined;
}

/** The current student's finished battles and totals. */
export async function getBattleHistory(): Promise<BattleHistory | undefined> {
  const user = await getCurrentUser();
  return user?.role === "student" ? battleHistory(user) : undefined;
}

/** A class's English results for the current teacher; no student is named in it. */
export async function getClassEnglish(classCode: string): Promise<ClassEnglish | undefined> {
  const user = await getCurrentUser();
  return user?.role === "teacher" ? classEnglish(user, classCode) : undefined;
}

/** The current teacher's view of their class battle, or undefined if it isn't theirs. */
export async function getClassBattle(battleId: string): Promise<BattleState | undefined> {
  const user = await getCurrentUser();
  return user?.role === "teacher" ? classBattleState(user, battleId) : undefined;
}

// English question bank (boss battles)

export async function getEnglishUnits(): Promise<EnglishUnit[]> {
  return [...englishUnits].sort((a, b) => a.order - b.order);
}

/** Questions without their answers, optionally for one unit and/or skill. */
export async function getEnglishQuestions(
  filter: { unitId?: string; skill?: EnglishSkill } = {},
): Promise<EnglishQuestionView[]> {
  return englishQuestions
    .filter(
      (q) =>
        (!filter.unitId || q.unitId === filter.unitId) &&
        (!filter.skill || q.skill === filter.skill),
    )
    .map(toQuestionView);
}

/**
 * Checks an answer on the server. Undefined for an unknown question id.
 * Only call from server code (Server Functions, pages): it reads the answers.
 */
export async function checkEnglishQuestion(
  questionId: string,
  answer: EnglishAnswer,
): Promise<EnglishAnswerResult | undefined> {
  const question = englishQuestions.find((q) => q.id === questionId);
  return question && checkEnglishAnswer(question, answer);
}

// Teacher

/** The topic the teacher dashboard shows results for. */
const DASHBOARD_TOPIC = "fractions";

/**
 * A real teacher's open class and each student's test progress (undefined
 * until they take the test), in student number order. Undefined for demo
 * accounts and servers without Supabase, which show the sample class.
 */
const realClassResults = cache(
  async (): Promise<{ code: string; students: ClassProgress } | undefined> => {
    const user = await getCurrentUser();
    if (user?.role !== "teacher" || user.demo || !classesStored()) return undefined;
    const active = await getActiveClass();
    if (!active) return { code: "", students: [] };
    try {
      const rows = await listClassTestAnswers(active.id);
      return {
        code: active.code,
        students: rows.map((r) => {
          const result = scoreTest(r.testAnswers);
          return result && progressFrom(result, r.mastered);
        }),
      };
    } catch (error) {
      console.error(error);
      return { code: active.code, students: [] };
    }
  },
);

/** The class's test results in numbers; the sample class for demo accounts. */
export async function getClassOverview(): Promise<ClassOverview> {
  const real = await realClassResults();
  return real ? classOverviewFrom(real.code, DASHBOARD_TOPIC, real.students) : classOverview;
}

/** Per subtopic, each student's status (numbered, never named); the sample class for demo accounts. */
export async function getHeatmap(): Promise<HeatmapRow[]> {
  const real = await realClassResults();
  return real ? heatmapFrom(DASHBOARD_TOPIC, real.students) : heatmap;
}

/** The sample draft assignment, for demo accounts only. */
export async function getAssignmentDraft(): Promise<AssignmentDraft | undefined> {
  return (await realClassResults()) ? undefined : assignmentDraft;
}

/** Sample notifications for demo accounts; real classes have none yet. */
export async function getNotifications(): Promise<TeacherNotification[]> {
  return (await realClassResults()) ? [] : notifications;
}

/** Per student, the XP the class goal asks for: two pet levels each. */
const GOAL_XP_PER_STUDENT = 2 * XP_PER_LEVEL;

/**
 * The current class's shared XP goal: its students' pet XP added up, for the
 * teacher's open class or the student's chosen one. Demo accounts (and
 * servers without Supabase) see the sample class; no class means no goal.
 */
export async function getClassGoal(): Promise<ClassGoal | undefined> {
  const user = await getCurrentUser();
  if (!user || user.demo || !classesStored()) return classGoal;
  const active = user.role === "teacher" ? await getActiveClass() : (await getStudentSubject())?.class;
  if (!active) return undefined;
  try {
    const found = await classPetXp(active.code);
    if (!found) return undefined;
    return {
      classCode: active.code,
      name: active.name,
      targetXp: Math.max(1, found.students) * GOAL_XP_PER_STUDENT,
      currentXp: found.xp,
      reward: classGoal.reward,
    };
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

// Anonymous questions (answered by the teacher or classmates, not the AI)

/** A logged-in account that isn't a demo: it only ever sees real data. */
async function isRealAccount() {
  const user = await getCurrentUser();
  return Boolean(user && !user.demo);
}

/**
 * Class whose questions a user sees: their own; the demo class for demo
 * accounts without one. Undefined for a real account without a class, so
 * its questions never land in the demo class.
 */
export async function questionClass(): Promise<string | undefined> {
  const user = await getCurrentUser();
  return user?.classCode ?? (user && !user.demo ? undefined : classOverview.code);
}

/**
 * Stored questions of the user's class. Demo accounts (and a server without
 * Supabase, or one where loading fails) see the sample questions; a real
 * account never does, and has none without a class.
 */
export async function getAnonQuestions(subtopicId?: string): Promise<AnonQuestion[]> {
  const [real, classCode] = await Promise.all([isRealAccount(), questionClass()]);
  if (questionsStored() && classCode) {
    try {
      return await listQuestions(classCode, subtopicId);
    } catch (error) {
      console.error(error);
    }
  }
  if (real) return [];
  return subtopicId
    ? anonQuestions.filter((q) => q.subtopicId === subtopicId)
    : anonQuestions;
}

export async function getQuestionGroups(): Promise<QuestionGroup[]> {
  const [real, classCode] = await Promise.all([isRealAccount(), questionClass()]);
  if (questionsStored() && classCode) {
    try {
      return await listGroups(classCode);
    } catch (error) {
      console.error(error);
    }
  }
  return real ? [] : questionGroups;
}

// Understanding signals (🟢🟡🔴 sent by students during a lesson)

/**
 * Today's 🟢/🟡/🔴 counts for the teacher's class, one row per subtopic taught
 * today. Demo teachers see the sample lesson, as does a server without
 * Supabase. A real teacher only sees their class's signals: none without a
 * class or when loading fails.
 */
export async function getTodaySignals(): Promise<SignalSummary[]> {
  // "Today" must use the request's date, never a prerendered date.
  await io();
  const user = await getCurrentUser();
  if (user?.classCode && !user.demo && signalsStored()) {
    try {
      return await listDaySignals(user.classCode, learningDay());
    } catch (error) {
      console.error(error);
    }
  }
  return user && !user.demo ? [] : summarizeSignals(signals);
}

/** The signal the logged-in student already sent for this lesson today, if any. */
export async function getMySignal(subtopicId: string): Promise<SignalLevel | undefined> {
  await io();
  const user = await getCurrentUser();
  if (user?.role !== "student" || !user.classCode || user.demo || !signalsStored()) return undefined;
  try {
    return await findSignal({
      classCode: user.classCode,
      subtopicId,
      day: learningDay(),
      studentId: user.id,
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * Subjects that have game questions, without the questions themselves: only
 * those of the student's subject (their class's, or the one they practise)
 * when they have one, all of them otherwise.
 */
export async function getGameSubjects(): Promise<
  Pick<GameSubject, "id" | "title">[]
> {
  const all = gameSubjects.map(({ id, title }) => ({ id, title }));
  const topics = teacherSubject((await getStudentSubject())?.subject)?.battleTopics;
  const mine = topics ? all.filter((s) => topics.includes(s.id)) : [];
  return mine.length ? mine : all;
}

/** All questions of one game subject, or undefined for an unknown id. */
export async function getGameQuestions(
  subjectId: string,
): Promise<GameQuestion[] | undefined> {
  return gameSubjects.find((s) => s.id === subjectId)?.questions;
}

// Teacher content: lesson videos and game assignments (Supabase). Teachers
// only see their own; students only see what's published for their class.

/** Textbook topics to suggest; there is only Grade 7 math so far. */
export async function getCurriculum(): Promise<CurriculumChapter[]> {
  const subject = (await readSession())?.subject;
  return !subject || subject === "math" ? grade7MathCurriculum : [];
}

async function teacherId(): Promise<string | undefined> {
  const session = await readSession();
  return session?.role === "teacher" ? session.id : undefined;
}

export async function getTeacherAssignments(): Promise<Assignment[]> {
  const id = await teacherId();
  return id ? listTeacherAssignments(id) : [];
}

export async function getTeacherAssignment(assignmentId: string) {
  const id = await teacherId();
  return id ? getTeacherAssignmentRow(id, assignmentId) : undefined;
}

/** How the class did: who finished, accuracy and the most-missed questions. */
export async function getAssignmentReport(assignmentId: string): Promise<AssignmentReport | undefined> {
  const found = await getTeacherAssignment(assignmentId);
  if (!found) return undefined;
  const attempts = await listAttempts(assignmentId);
  const missed = new Map<string, number>();
  for (const a of attempts) for (const q of a.missed_question_ids) missed.set(q, (missed.get(q) ?? 0) + 1);
  return {
    ...found,
    // Done needs at least one right answer; every play still counts below.
    doneCount: new Set(attempts.filter((a) => a.accuracy > 0).map((a) => a.student_id)).size,
    attemptCount: attempts.length,
    averageAccuracy: attempts.length
      ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length)
      : 0,
    missed: [...missed]
      .map(([questionId, count]) => ({ questionId, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** How many students are in a class, to show "12 / 30 finished". */
export async function getClassSize(classCode: string): Promise<number> {
  if (!(await teacherId())) return 0;
  // Students can be in several classes, so count members, not accounts pointing at it.
  return (await countClassMembers(classCode).catch(() => undefined)) ?? countClassStudents(classCode);
}

/**
 * The classes a teacher can publish assignments and videos to, the current
 * one first. Codes they published to before classes existed (typed by hand)
 * stay listed, so that old work can still be edited.
 */
export async function getTeacherClassOptions(): Promise<ClassOption[]> {
  const session = await readSession();
  if (session?.role !== "teacher") return [];
  const [classes, assignments, videos] = await Promise.all([
    getTeacherClasses(),
    listTeacherAssignments(session.id),
    listTeacherVideos(session.id),
  ]);
  const options = [...classes]
    .sort((a, b) => Number(b.code === session.classCode) - Number(a.code === session.classCode))
    .map((c) => ({ code: c.code, name: c.name }));
  for (const { classCode } of [...assignments, ...videos]) {
    if (classCode && !options.some((o) => o.code === classCode)) {
      options.push({ code: classCode, name: `${classCode} (хуучин)` });
    }
  }
  return options;
}

export type StudentAssignment = Assignment & {
  done: boolean;
  /** The game the student opens it in */
  playGame: string;
};

/**
 * Published assignments for the student's class, unless one is only for
 * students weak in a subtopic and this student isn't.
 */
export async function getStudentAssignments(): Promise<StudentAssignment[]> {
  const session = await readSession();
  if (!session?.classCode || session.role !== "student") return [];
  const [assignments, progress] = await Promise.all([listClassAssignments(normalClassCode(session.classCode)), getProgress()]);
  const weak = new Set(progress.filter((p) => p.status === "weak" || p.status === "learning").map((p) => p.subtopicId));
  const visible = assignments.filter(
    (a) => a.target === "class" || !a.targetSubtopicId || weak.has(a.targetSubtopicId),
  );
  const done = await finishedAssignmentIds(session.id, visible.map((a) => a.id));
  return visible.map((a) => ({
    ...a,
    done: done.has(a.id),
    playGame: pickGame(a, session.favoriteGames),
  }));
}

/** Assignments the student hasn't finished yet, for the menu badge. */
export async function getOpenAssignmentCount(): Promise<number> {
  return (await getStudentAssignments()).filter((a) => !a.done).length;
}

/** "fixed": the first chosen game; "interest": the student's favourite among them. */
function pickGame(a: Assignment, favorites: string[] = []): string {
  const allowed = a.games.filter(isAssignmentGame);
  const options = allowed.length ? allowed : ["snake"];
  if (a.gameMode === "interest") return favorites.find((g) => options.includes(g as never)) ?? options[0];
  return options[0];
}

/**
 * The assignment a game plays for `?assignment=`: only a published one of
 * the student's own class.
 */
export async function getAssignmentForPlay(
  assignmentId: string,
): Promise<{ id: string; title: string; questions: GameQuestion[] } | undefined> {
  const session = await readSession();
  if (!session?.classCode || !/^[0-9a-f-]{36}$/i.test(assignmentId)) return undefined;
  const found = await getClassAssignment(normalClassCode(session.classCode), assignmentId);
  return found && { id: found.assignment.id, title: found.assignment.title, questions: found.questions };
}

export async function getTeacherVideos(): Promise<LessonVideo[]> {
  const id = await teacherId();
  return id ? listTeacherVideos(id) : [];
}

export async function getTeacherVideo(videoId: string): Promise<LessonVideo | undefined> {
  const id = await teacherId();
  return id ? getTeacherVideoRow(id, videoId) : undefined;
}

export async function getTeacherMaterial(materialId: string): Promise<Material | undefined> {
  const id = await teacherId();
  return id ? getMaterialRow(id, materialId) : undefined;
}

/** Published lesson videos for the student's class. */
export async function getClassVideos(): Promise<LessonVideo[]> {
  const session = await readSession();
  return session?.classCode ? listClassVideos(normalClassCode(session.classCode)) : [];
}

/** Ids of the class videos the student has opened. */
export async function getSeenVideoIds(): Promise<string[]> {
  return (await readSession())?.videosSeen ?? [];
}

/** Published class videos the student hasn't opened yet, for the menu badge. */
export async function getUnseenVideoCount(): Promise<number> {
  const session = await readSession();
  if (session?.role !== "student" || !session.classCode) return 0;
  const seen = new Set(session.videosSeen ?? []);
  return (await getClassVideos()).filter((v) => !seen.has(v.id)).length;
}

export async function getClassVideo(videoId: string): Promise<LessonVideo | undefined> {
  const session = await readSession();
  if (!session?.classCode || !/^[0-9a-f-]{36}$/i.test(videoId)) return undefined;
  return getClassVideoRow(normalClassCode(session.classCode), videoId);
}

/** The assignment demo the visitor is in, if any: which assignment it is about. */
export async function getDemoTour(): Promise<{ assignmentId: string } | undefined> {
  const tour = (await readSession())?.demoTour;
  return tour && { assignmentId: tour.assignmentId };
}

/**
 * Subjects a boss battle can ask about, English first. A teacher only gets
 * the topics of the subject they teach.
 */
export async function getBattleSubjects(): Promise<{ id: string; title: string }[]> {
  const session = await readSession();
  const topics = session?.role === "teacher" ? teacherSubject(session.subject)?.battleTopics : undefined;
  if (!topics) return BATTLE_SUBJECTS;
  return topics.flatMap((id) => BATTLE_SUBJECTS.filter((s) => s.id === id));
}

/** The current teacher's class battles and the answers in one of them; nobody is named. */
export async function getBattleLog(classCode?: string, battleId?: string): Promise<BattleLog> {
  const user = await getCurrentUser();
  return user?.role === "teacher" ? classBattleLog(user, classCode, battleId) : { battles: [] };
}

// Classes (a teacher's own classes and the students in them)

/** The class a demo account is in: not stored, so demos need no class setup. */
function demoClass(user: User): SchoolClass {
  return {
    id: "demo",
    code: user.classCode ?? DEMO_CLASS_CODE,
    name: "7А",
    subject: user.subject ?? "math",
    grade: 7,
    studentCount: classOverview.studentCount,
    teacherName: "Демо багш",
  };
}

/** The logged-in teacher's classes; demo teachers (and servers without Supabase) get the demo class. */
export async function getTeacherClasses(): Promise<SchoolClass[]> {
  const user = await getCurrentUser();
  if (user?.role !== "teacher") return [];
  if (user.demo || !classesStored()) return [demoClass(user)];
  try {
    return await listTeacherClasses(user.id);
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** The class the teacher picked to work in, if it is still one of theirs. */
export async function getActiveClass(): Promise<SchoolClass | undefined> {
  const user = await getCurrentUser();
  return (await getTeacherClasses()).find((c) => c.code === user?.classCode);
}

/** Students in the teacher's current class; none for demo teachers. */
export async function getClassMembers(): Promise<ClassMember[]> {
  const active = await getActiveClass();
  if (!active || active.id === "demo") return [];
  return listClassMembers(active.id);
}

/** The classes the logged-in student is in; demo students are in the demo class. */
export async function getStudentClasses(): Promise<SchoolClass[]> {
  const user = await getCurrentUser();
  if (user?.role !== "student") return [];
  if (user.demo || !classesStored()) return user.classCode ? [demoClass(user)] : [];
  try {
    return await listStudentClasses(user.id);
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * What the student is studying now: their current class's subject, or for a
 * student in no class the subject and grade they picked to practise.
 */
export async function getStudentSubject(): Promise<
  { subject: string; grade: number; class?: SchoolClass } | undefined
> {
  const session = await readSession();
  if (session?.role !== "student") return undefined;
  const active = (await getStudentClasses()).find((c) => c.code === session.classCode);
  if (active) return { subject: active.subject, grade: active.grade, class: active };
  return session.practiceSubject
    ? { subject: session.practiceSubject, grade: session.practiceGrade ?? 7 }
    : undefined;
}

/** The class a QR invite is for, while the teacher is still showing it. */
export async function getInviteClass(token: string): Promise<SchoolClass | undefined> {
  // Whether it's still valid depends on the request's time, never a prerendered one.
  await io();
  if (!classesStored()) return undefined;
  try {
    return await findInviteClass(token);
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

// Lesson schedule: «Ойлгосон уу?» on lesson days, even when the teacher
// doesn't open the app that day.

/** How far ahead a teacher plans topics, and how many weeks back they see signals. */
const PLAN_DAYS = 12;
const SIGNAL_WEEKS = 12;

/** What a lesson day can be about: the curriculum plus topics the teacher typed before. */
async function lessonTopics(cls: SchoolClass, today: string): Promise<LessonTopic[]> {
  const past = cls.id === "demo" ? [] : await listPlans(cls.id, shiftDay(today, -120), today);
  const typed = [...new Map(past.filter((p) => isCustomTopic(p.topicKey)).map((p) => [p.topicKey, p])).values()];
  return [...typed.map((p) => ({ key: p.topicKey, title: p.topicTitle, group: "Өөрийн сэдэв" })), ...curriculumTopics(cls.subject, cls.grade)];
}

/**
 * Today's class lesson for the logged-in student: the planned topic, or the
 * topics to pick from. Undefined unless today is a lesson day of their class
 * (or has a planned topic). Demo students always get one, about fractions.
 */
export async function getTodayLesson(): Promise<TodayLesson | undefined> {
  await io();
  const [user, session] = await Promise.all([getCurrentUser(), readSession()]);
  if (user?.role !== "student") return undefined;
  const day = learningDay();
  const answered = session?.lessonCheck?.day === day ? session.lessonCheck : undefined;
  const cls = (await getStudentClasses()).find((c) => c.code === user.classCode);
  if (!cls) return undefined;
  if (user.demo || cls.id === "demo") {
    return { day, topic: { key: "different-denominator", title: topicTitle("different-denominator")! }, options: [], answered };
  }
  const [lessonDays, plans] = await Promise.all([getLessonDays(cls.id), listPlans(cls.id, day, day)]);
  const plan = plans[0];
  if (!plan && !lessonDays.includes(isoWeekday(day))) return undefined;
  return {
    day,
    topic: plan && { key: plan.topicKey, title: plan.topicTitle },
    options: plan ? [] : await lessonTopics(cls, day),
    answered,
  };
}

/** The teacher's open class: lesson weekdays and the next lesson days with their topics. */
export async function getClassSchedule(): Promise<ClassSchedule | undefined> {
  await io();
  const active = await getActiveClass();
  if (!active) return undefined;
  const today = learningDay();
  const editable = active.id !== "demo";
  const lessonDays = editable ? await getLessonDays(active.id) : [1, 3, 5];
  const plans = editable ? await listPlans(active.id, today, shiftDay(today, PLAN_DAYS * 7)) : [];
  const days = [...new Set([...upcomingLessonDays(today, lessonDays, PLAN_DAYS), ...plans.map((p) => p.day)])].sort();
  return {
    className: active.name,
    lessonDays,
    upcoming: days.map((day) => ({ day, plan: plans.find((p) => p.day === day) })),
    topics: await lessonTopics(active, today),
    editable,
  };
}

/**
 * The open class's signals in one school week (`weeksBack` 0 is this week),
 * newest day first, with the topic titles; `beforeToday` leaves today out.
 * Demo teachers see the sample lesson on Monday, Wednesday and Friday.
 */
export async function getLessonDaySignals({ weeksBack = 0, beforeToday = false } = {}): Promise<WeekSignals> {
  await io();
  const today = learningDay();
  const weeks = recentWeeks(today, SIGNAL_WEEKS);
  const week = weeks[Math.min(Math.max(Math.trunc(weeksBack) || 0, 0), weeks.length - 1)];
  const keep = (days: LessonDaySignals[]) => ({ week, weeks, days: beforeToday ? days.filter((d) => d.day < today) : days });
  const user = await getCurrentUser();
  const active = await getActiveClass();
  const title = (key: string) => topicTitle(key) ?? key;
  if (!active || user?.demo || active.id === "demo" || !signalsStored()) {
    const rows = summarizeSignals(signals).map((s) => ({ ...s, title: title(s.subtopicId) }));
    const days = [4, 2, 0].map((offset) => shiftDay(week.from, offset)).filter((day) => day <= week.to);
    return keep(days.map((day) => ({ day, rows })));
  }
  try {
    const days = await listSignalsBetween(active.code, week.from, week.to);
    return keep(days.map((d) => ({ day: d.day, rows: d.summary.map((s) => ({ ...s, title: title(s.subtopicId) })) })));
  } catch (error) {
    console.error(error);
    return keep([]);
  }
}
