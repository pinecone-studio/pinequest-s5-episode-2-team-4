// Boss battle engine (server only). The database functions in
// supabase/migrations/0002_solo_battles.sql apply damage, attacks and
// knock-outs atomically; this file picks questions, checks answers and
// shapes what the browser sees. Pages read through data.ts.

import "server-only";
import { checkEnglishAnswer, toQuestionView } from "./english";
import { bosses } from "./mock/bosses";
import { englishQuestions } from "./mock/english";
import { getSupabaseAdmin } from "./supabase";
import type {
  BattleAnswerOutcome,
  BattleState,
  Boss,
  EnglishAnswer,
  EnglishQuestion,
  User,
  UserPet,
} from "./types";

// Tunable balance. Pronunciation gets no extra damage: every skill counts the same.
const BASE_DAMAGE: Record<EnglishQuestion["difficulty"], number> = { 1: 20, 2: 25, 3: 30 };
/** Pet damage for a wrong answer: a nudge, not a punishment. */
const WRONG_ANSWER_PET_DAMAGE = 6;
const TIME_LIMIT_SEC = 8 * 60;
/** Questions not repeated until this many others have been asked. */
const RECENT_QUESTIONS = 8;

/**
 * A pet's HP in battle grows with its level: 110 at level 1, 160 at level 6.
 * A pet at 0 HP faints and stays out, so this is the whole battle's budget.
 */
export const petMaxHp = (level: number) => 100 + level * 10;

function db() {
  return getSupabaseAdmin();
}

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`${what}: ${error?.message ?? "unknown error"}`);
}

/** The player row for this LevelUp account (created on first use). */
async function playerId(user: User): Promise<string> {
  const { data, error } = await db().rpc("game_player_id", {
    p_username: user.username,
    p_role: user.role,
    p_class_code: user.classCode ?? null,
  });
  if (error || !data) fail("Could not load player", error);
  return data as string;
}

/** A question for this boss that wasn't asked recently in the battle. */
function pickQuestion(boss: Boss, recentIds: string[]): EnglishQuestion {
  const { min, max } = boss.questionDifficulty;
  const pool = englishQuestions.filter((q) => q.difficulty >= min && q.difficulty <= max);
  const fresh = pool.filter((q) => !recentIds.includes(q.id));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}

/** Starts a solo battle against `bossId`, or returns the unfinished one. */
export async function startSoloBattle(user: User, pet: UserPet, bossId: string) {
  const boss = bosses.find((b) => b.id === bossId);
  if (!boss) throw new Error(`Unknown boss ${bossId}`);
  const player = await playerId(user);
  const maxHp = petMaxHp(pet.level);

  const { data: petId, error: petError } = await db().rpc("game_active_pet", {
    p_player: player,
    p_line: pet.lineId,
    p_level: pet.level,
    p_max_hp: maxHp,
  });
  if (petError || !petId) fail("Could not set active pet", petError);

  const { data, error } = await db().rpc("battle_start_solo", {
    p_player: player,
    p_pet: petId,
    p_pet_max_hp: maxHp,
    p_boss: boss.id,
    p_max_hp: boss.maxHp,
    p_attack_min_sec: boss.attack.minIntervalSec,
    p_attack_max_sec: boss.attack.maxIntervalSec,
    p_attack_damage: boss.attack.damage,
    p_time_limit_sec: TIME_LIMIT_SEC,
    p_first_question: pickQuestion(boss, []).id,
  });
  if (error || !data) fail("Could not start battle", error);
  return data as string;
}

/** The player's unfinished solo battle, if any. */
export async function activeSoloBattleId(user: User): Promise<string | undefined> {
  const player = await playerId(user);
  const { data, error } = await db()
    .from("battle_participants")
    .select("battle_id, battles!inner(status, mode, created_at)")
    .eq("player_id", player)
    .eq("battles.mode", "solo")
    .in("battles.status", ["active", "paused"])
    .order("joined_at", { ascending: false })
    .limit(1);
  if (error) fail("Could not load battles", error);
  return data?.[0]?.battle_id as string | undefined;
}

type BattleRow = {
  id: string;
  boss_id: string;
  mode: BattleState["mode"];
  status: BattleState["status"];
  hp: number;
  max_hp: number;
  attack_count: number;
  attack_damage: number | null;
  next_attack_at: string | null;
  deadline_at: string | null;
};

type ParticipantRow = {
  pet_hp: number;
  pet_max_hp: number;
  combo: number;
  best_combo: number;
  damage_dealt: number;
  correct_count: number;
  wrong_count: number;
  faint_count: number;
  current_question_id: string | null;
};

/** What the battle_view() database function returns. */
type ViewJson = { battle: BattleRow; me: ParticipantRow; now: string } | null;

/** Turns the database view into what the browser sees (no answers in it). */
function toState(view: ViewJson): BattleState | undefined {
  if (!view) return undefined;
  const { battle: b, me: p } = view;
  const question =
    b.status === "active"
      ? englishQuestions.find((q) => q.id === p.current_question_id)
      : undefined;

  return {
    id: b.id,
    bossId: b.boss_id,
    mode: b.mode,
    status: b.status,
    hp: b.hp,
    maxHp: b.max_hp,
    attackCount: b.attack_count,
    attackDamage: b.attack_damage ?? 0,
    nextAttackAt: b.next_attack_at,
    deadlineAt: b.deadline_at,
    // The database clock, the same one the attack times come from.
    serverNow: view.now,
    me: {
      petHp: p.pet_hp,
      petMaxHp: p.pet_max_hp,
      combo: p.combo,
      bestCombo: p.best_combo,
      damageDealt: p.damage_dealt,
      correct: p.correct_count,
      wrong: p.wrong_count,
      faints: p.faint_count,
    },
    question: question ? toQuestionView(question) : null,
    endReason:
      b.status === "won"
        ? "won"
        : b.status === "ended"
          ? "left"
          : b.status === "lost"
            ? p.pet_hp === 0
              ? "fainted"
              : "timeout"
            : null,
  };
}

/** Leaves a solo battle; it ends without a victory. */
export async function forfeitBattle(user: User, battleId: string) {
  const { error } = await db().rpc("battle_forfeit", {
    p_battle: battleId,
    p_player: await playerId(user),
  });
  if (error) fail("Could not leave battle", error);
}

/**
 * Catches the battle up (attacks, time limit) and returns this player's
 * view in one database round trip, or undefined if they aren't in it.
 */
export async function battleState(user: User, battleId: string) {
  const { data, error } = await db().rpc("battle_state", {
    p_battle: battleId,
    p_username: user.username,
  });
  if (error) fail("Could not load battle", error);
  return toState(data as ViewJson);
}

/**
 * Random questions for this boss, for the database to pick the next one
 * from (it weights them by the player's weaker skills).
 */
function nextCandidates(boss: Boss) {
  const { min, max } = boss.questionDifficulty;
  const pool = englishQuestions.filter((q) => q.difficulty >= min && q.difficulty <= max);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Enough of every skill that weighting has a real choice.
  return pool.slice(0, RECENT_QUESTIONS + 12);
}

/**
 * Checks the answer and applies it in one database round trip. The answer
 * is checked here (the bank lives in the code); the database only accepts
 * it if `questionId` is the question it asked and `bossId` is this battle's
 * boss. `attemptId` is made by the browser per submit, so a retry applies
 * once.
 */
export async function answerBattleQuestion(
  user: User,
  battleId: string,
  bossId: string,
  questionId: string,
  attemptId: string,
  answer: EnglishAnswer,
): Promise<{ outcome?: BattleAnswerOutcome; state?: BattleState; error?: string }> {
  const boss = bosses.find((b) => b.id === bossId);
  const question = englishQuestions.find((q) => q.id === questionId);
  if (!boss || !question) return { error: "invalid" };
  const result = checkEnglishAnswer(question, answer);
  const candidates = nextCandidates(boss);

  const { data, error } = await db().rpc("battle_answer", {
    p_battle: battleId,
    p_boss: boss.id,
    p_username: user.username,
    p_attempt: attemptId,
    p_question: question.id,
    p_correct: result.correct,
    p_damage: BASE_DAMAGE[question.difficulty],
    p_pet_damage: WRONG_ANSWER_PET_DAMAGE,
    p_next_candidates: candidates.map((q) => q.id),
    p_unit: question.unitId,
    p_skill: question.skill,
    p_candidate_skills: candidates.map((q) => q.skill),
  });
  if (error) fail("Could not save answer", error);

  const applied = data as {
    error?: string;
    damage?: number;
    pet_damage?: number;
    combo?: number;
    view?: ViewJson;
  };
  const state = toState(applied.view ?? null);
  if (applied.error) return { state, error: applied.error };
  return {
    state,
    outcome: {
      ...result,
      damage: applied.damage ?? 0,
      petDamage: applied.pet_damage ?? 0,
      combo: applied.combo ?? 0,
    },
  };
}
