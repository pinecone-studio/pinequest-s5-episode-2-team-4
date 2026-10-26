// Data access layer. Pages and components read data only through these
// functions, never by importing src/lib/mock directly, so a real API can
// replace the mock later without touching the UI.
//
// The functions are async like a real API. Call them in Server Components
// (pages, layouts) and pass the result to Client Components as props.

import { activeSoloBattleId, battleState } from "./battle";
import { petCollection, unhatchedEggs } from "./collection";
import { checkEnglishAnswer, toQuestionView } from "./english";
import { englishProgress } from "./progress";
import { XP_PER_LEVEL, nextEvolutionLevel, petStage } from "./pets";
import { readSession } from "./session";
import type {
  BattleState,
  Boss,
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
  SignalSummary,
  Subtopic,
  SubtopicProgress,
  TestResult,
  Topic,
  User,
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
import { englishQuestions, englishUnits } from "./mock/english";
import { petLines } from "./mock/pets";
import { signals } from "./mock/signals";
import { subtopics, topics } from "./mock/topics";

// Student

/** The logged-in user from the mock session, or undefined when logged out. */
export async function getCurrentUser(): Promise<User | undefined> {
  const session = await readSession();
  if (!session) return undefined;
  return {
    id: `user-${session.username}`,
    username: session.username,
    role: session.role,
    classCode: session.classCode,
    pet: session.pet,
  };
}

// Pets

export async function getPetLines(): Promise<PetLine[]> {
  return petLines;
}

export async function getPetLine(id: string): Promise<PetLine | undefined> {
  return petLines.find((l) => l.id === id);
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
  const mastered = new Set(session?.mastered);
  return (
    result?.subtopics.map(({ subtopicId, status }) => ({
      subtopicId,
      status: mastered.has(subtopicId) ? "mastered" : status,
    })) ?? []
  );
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
  const answers = (await readSession())?.testAnswers;
  const answered = testQuestions.filter((q) => answers?.[q.id] !== undefined);
  if (!answers || answered.length === 0) return undefined;

  const topicId =
    topics.find((t) => t.subtopicIds.includes(answered[0].subtopicId))?.id ?? "";
  const scores = subtopics
    .filter((s) => s.topicId === topicId)
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const questions = testQuestions.filter((q) => q.subtopicId === s.id);
      const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
      return {
        subtopicId: s.id,
        status: correct === questions.length ? ("good" as const) : ("weak" as const),
        correct,
        total: questions.length,
      };
    })
    .filter((s) => s.total > 0)
    // Stable sort keeps the topic order for equal scores.
    .sort((a, b) => a.correct / a.total - b.correct / b.total);

  return {
    topicId,
    correct: scores.reduce((sum, s) => sum + s.correct, 0),
    total: scores.reduce((sum, s) => sum + s.total, 0),
    subtopics: scores,
  };
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

/** Demo answers that fill the diagnostic test (5/8). */
export async function getSampleTestAnswers(): Promise<Record<string, number>> {
  return sampleTestAnswers;
}

/** Demo answers that pass a subtopic's retest: all correct. */
export async function getSampleRetestAnswers(
  subtopicId: string,
): Promise<Record<string, number>> {
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

/** The current student's unfinished solo battle, if any. */
export async function getActiveSoloBattleId(): Promise<string | undefined> {
  const user = await getCurrentUser();
  return user ? activeSoloBattleId(user) : undefined;
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

export async function getClassOverview() {
  return classOverview;
}

export async function getHeatmap() {
  return heatmap;
}

export async function getAssignmentDraft() {
  return assignmentDraft;
}

export async function getNotifications() {
  return notifications;
}

export async function getClassGoal(): Promise<ClassGoal> {
  return classGoal;
}

// Anonymous questions (answered by the teacher or classmates, not the AI)

export async function getAnonQuestions(subtopicId?: string): Promise<AnonQuestion[]> {
  return subtopicId
    ? anonQuestions.filter((q) => q.subtopicId === subtopicId)
    : anonQuestions;
}

export async function getQuestionGroups(): Promise<QuestionGroup[]> {
  return questionGroups;
}

/** Open questions a classmate can answer: no answer yet. */
export async function getPeerQuestions(): Promise<AnonQuestion[]> {
  return anonQuestions.filter((q) => !q.answer);
}

// Understanding signals (🟢🟡🔴 sent by students during a lesson)

export async function getSignals(subtopicId: string) {
  return signals.filter((s) => s.subtopicId === subtopicId);
}

/** 🟢/🟡/🔴 counts per subtopic, in topic order. */
export async function getSignalSummary(): Promise<SignalSummary[]> {
  return subtopics.map((sub) => {
    const counts = { got: 0, unsure: 0, lost: 0 };
    for (const s of signals) if (s.subtopicId === sub.id) counts[s.level]++;
    return { subtopicId: sub.id, counts };
  });
}

/** Subjects that have game questions, without the questions themselves. */
export async function getGameSubjects(): Promise<
  Pick<GameSubject, "id" | "title">[]
> {
  return gameSubjects.map(({ id, title }) => ({ id, title }));
}

/** All questions of one game subject, or undefined for an unknown id. */
export async function getGameQuestions(
  subjectId: string,
): Promise<GameQuestion[] | undefined> {
  return gameSubjects.find((s) => s.id === subjectId)?.questions;
}
