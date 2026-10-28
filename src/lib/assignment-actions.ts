"use server";

// A student finishing a game played for an assignment: the result is saved
// for the teacher and the first finish gives the pet XP.

import { normalClassCode } from "./battle";
import { getClassAssignment, saveAttempt } from "./content";
import { addXp } from "./pets";
import { readSession, writeSession } from "./session";
import { recordLearningDay } from "./streak";

/** XP for the first finish: a base plus a bonus per star. */
const BASE_XP = 20;
const XP_PER_STAR = 10;

export type AttemptInput = {
  game: string;
  score: number;
  accuracy: number;
  stars: number;
  bestCombo: number;
  missedIds: string[];
};

/**
 * Saves the result. It only counts as done with at least one right answer;
 * then the first finish gives XP. Undefined if it isn't this student's assignment.
 */
export async function submitAssignmentAttempt(
  assignmentId: string,
  result: AttemptInput,
): Promise<{ xp: number; done: boolean } | undefined> {
  const session = await readSession();
  if (!session?.classCode || session.role !== "student") return undefined;
  const found = await getClassAssignment(normalClassCode(session.classCode), assignmentId);
  if (!found) return undefined;

  const ids = new Set(found.questions.map((q) => q.id));
  const int = (v: unknown, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));
  const stars = int(result.stars, 1, 3);
  const accuracy = int(result.accuracy, 0, 100);
  const done = accuracy > 0;
  const firstFinish = done && !(session.assignmentsRewarded ?? []).includes(assignmentId);
  const xp = firstFinish ? BASE_XP + XP_PER_STAR * stars : 0;

  await saveAttempt({
    assignmentId,
    studentId: session.id,
    game: String(result.game).slice(0, 20),
    score: int(result.score, 0, 100000),
    accuracy,
    stars,
    bestCombo: int(result.bestCombo, 0, 1000),
    missedQuestionIds: [...new Set((result.missedIds ?? []).filter((id) => ids.has(id)))],
    xpAwarded: xp,
  });
  await writeSession({
    ...session,
    streak: recordLearningDay(session.streak),
    assignmentsRewarded: firstFinish ? [...(session.assignmentsRewarded ?? []), assignmentId] : session.assignmentsRewarded,
    pet: session.pet && xp ? addXp(session.pet, xp) : session.pet,
  });
  return { xp, done };
}
