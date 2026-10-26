"use server";

// Server Functions for boss battles. Every call checks who is logged in;
// the browser never decides damage, attacks or rewards.

import { redirect } from "next/navigation";
import { answerBattleQuestion, battleState, forfeitBattle, startSoloBattle } from "./battle";
import { getCurrentUser } from "./data";
import type { BattleAnswerOutcome, BattleState, EnglishAnswer } from "./types";

async function student() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/teacher");
  return user;
}

/** Starts (or resumes) a solo battle and opens it. */
export async function startBossBattle(bossId: string) {
  const user = await student();
  if (!user.pet) redirect("/pets");
  const battleId = await startSoloBattle(user, user.pet, bossId);
  redirect(`/pets/battle/${battleId}`);
}

/** Leaves the battle (it ends without a victory) and goes back to the bosses. */
export async function leaveBossBattle(battleId: string) {
  await forfeitBattle(await student(), battleId);
  redirect("/pets/battle");
}

/** The latest battle state; the battle screen polls this. */
export async function refreshBattle(battleId: string): Promise<BattleState | undefined> {
  return battleState(await student(), battleId);
}

export async function submitBattleAnswer(
  battleId: string,
  bossId: string,
  questionId: string,
  attemptId: string,
  answer: EnglishAnswer,
): Promise<{ outcome?: BattleAnswerOutcome; state?: BattleState; error?: string }> {
  const valid =
    (typeof answer === "number" ? Number.isInteger(answer) : answer.length <= 300) &&
    /^[0-9a-f-]{36}$/i.test(attemptId) &&
    questionId.length <= 40 &&
    bossId.length <= 40;
  if (!valid) return { error: "invalid" };
  return answerBattleQuestion(await student(), battleId, bossId, questionId, attemptId, answer);
}
