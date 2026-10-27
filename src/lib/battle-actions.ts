"use server";

// Server Functions for boss battles. Every call checks who is logged in;
// the browser never decides damage, attacks or rewards.

import { redirect } from "next/navigation";
import {
  answerBattleQuestion,
  battleState,
  classBattleState,
  controlClassBattle,
  createClassBattle,
  createGroupBattle,
  joinClassBattle,
  joinGroupBattle,
  leaveBattle,
  startGroupBattle,
  startSoloBattle,
  type ClassControl,
} from "./battle";
import { bosses } from "./mock/bosses";
import { hatchEgg, setActivePet } from "./collection";
import { getCurrentUser } from "./data";
import { readSession, writeSession } from "./session";
import { recordLearningDay } from "./streak";
import type { BattleAnswerOutcome, BattleState, EnglishAnswer, HatchResult } from "./types";

async function student() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/teacher");
  return user;
}

async function teacher() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "teacher") redirect("/");
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

/**
 * Joins a group or class battle by its 6-character code, or the class
 * battle by the class code ("7А"); on success goes to it, otherwise says why
 * not. A class code that worked is remembered, so the banner shows next time.
 */
export async function joinGroupBossBattle(
  _previous: { error?: string } | undefined,
  form: FormData,
): Promise<{ error?: string }> {
  const user = await student();
  if (!user.pet) redirect("/pets");
  const code = String(form.get("code") ?? "").trim();
  if (!code || code.length > 10) return { error: "format" };
  if (/^[A-Za-z0-9]{6}$/.test(code)) {
    const { battleId, error } = await joinGroupBattle(user, user.pet, code);
    if (battleId) redirect(`/pets/battle/${battleId}`);
    if (error !== "no_code") return { error };
  }
  const { battleId, error } = await joinClassBattle(user, user.pet, code);
  if (!battleId) return { error: error ?? "no_code" };
  const session = await readSession();
  if (session && !session.classCode) await writeSession({ ...session, classCode: code });
  redirect(`/pets/battle/${battleId}`);
}

/** The host starts the lobby. */
export async function startGroupBossBattle(battleId: string): Promise<{ error?: string }> {
  const r = await startGroupBattle(await student(), battleId);
  return r.ok ? {} : { error: r.error ?? "unknown" };
}

/** Joins (or rejoins) the student's class battle and opens it. */
export async function joinMyClassBattle() {
  const user = await student();
  if (!user.pet) redirect("/pets");
  const { battleId } = await joinClassBattle(user, user.pet);
  redirect(battleId ? `/pets/battle/${battleId}` : "/pets/battle");
}

/** The teacher opens a class battle (or their open one) and goes to it. */
export async function createClassBossBattle(form: FormData) {
  const user = await teacher();
  const bossId = String(form.get("boss") ?? "");
  const classCode = String(form.get("classCode") ?? "").trim();
  if (!bosses.some((b) => b.id === bossId) || !classCode || classCode.length > 10) redirect("/teacher");
  const battleId = await createClassBattle(user, classCode, bossId);
  redirect(`/teacher/battle/${battleId}`);
}

/** The latest state of the teacher's class battle; their screen polls this. */
export async function refreshClassBattle(battleId: string): Promise<BattleState | undefined> {
  return classBattleState(await teacher(), battleId);
}

const CONTROLS: ClassControl[] = ["start", "pause", "resume", "end"];

/** The teacher starts, pauses, resumes or ends their class battle. */
export async function controlClassBossBattle(battleId: string, action: ClassControl): Promise<{ error?: string }> {
  if (!CONTROLS.includes(action)) return { error: "invalid" };
  const r = await controlClassBattle(await teacher(), battleId, action);
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
  const result = await answerBattleQuestion(await student(), battleId, bossId, questionId, attemptId, answer);
  if (result.outcome && !result.error) {
    const session = await readSession();
    if (session) {
      const streak = recordLearningDay(session.streak);
      if (streak !== session.streak) await writeSession({ ...session, streak });
    }
  }
  return result;
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
