"use server";

// Server Functions for boss battles. Every call checks who is logged in;
// the browser never decides damage, attacks or rewards.

import { redirect } from "next/navigation";
import {
  answerBattleQuestion,
  battleState,
  createGroupBattle,
  joinGroupBattle,
  leaveBattle,
  startGroupBattle,
  startSoloBattle,
} from "./battle";
import { hatchEgg, setActivePet } from "./collection";
import { getCurrentUser } from "./data";
import type { BattleAnswerOutcome, BattleState, EnglishAnswer, HatchResult } from "./types";

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

/** Leaves the battle and goes back to the bosses (solo: it ends without a victory). */
export async function leaveBossBattle(battleId: string) {
  await leaveBattle(await student(), battleId);
  redirect("/pets/battle");
}

/** Opens a group lobby for friends to join, and goes to it. */
export async function createGroupBossBattle(bossId: string) {
  const user = await student();
  if (!user.pet) redirect("/pets");
  const battleId = await createGroupBattle(user, user.pet, bossId);
  redirect(`/pets/battle/${battleId}`);
}

/** Joins a group by code; on success goes to its lobby, otherwise says why not. */
export async function joinGroupBossBattle(
  _previous: { error?: string } | undefined,
  form: FormData,
): Promise<{ error?: string }> {
  const user = await student();
  if (!user.pet) redirect("/pets");
  const code = String(form.get("code") ?? "").trim();
  if (!/^[A-Za-z0-9]{6}$/.test(code)) return { error: "format" };
  const { battleId, error } = await joinGroupBattle(user, user.pet, code);
  if (!battleId) return { error: error ?? "no_code" };
  redirect(`/pets/battle/${battleId}`);
}

/** The host starts the lobby. */
export async function startGroupBossBattle(battleId: string): Promise<{ error?: string }> {
  const r = await startGroupBattle(await student(), battleId);
  return r.ok ? {} : { error: r.error ?? "unknown" };
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

/** Hatches one of the student's eggs. */
export async function hatchMyEgg(eggId: string): Promise<HatchResult | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(eggId)) return undefined;
  return hatchEgg(await student(), eggId);
}

/** Picks the pet the student fights with. */
export async function chooseBattlePet(lineId: string): Promise<boolean> {
  if (lineId.length > 40) return false;
  return setActivePet(await student(), lineId);
}
