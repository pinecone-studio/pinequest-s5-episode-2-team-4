// Boss battle engine (server only). The database functions in
// supabase/migrations/ apply damage, attacks, fainting and rewards
// atomically; this file picks questions, checks answers, rolls rewards and
// shapes what the browser sees. Pages read through data.ts.

import "server-only";
import { checkEnglishAnswer, toQuestionView } from "./english";
import { bosses } from "./mock/bosses";
import { englishQuestions } from "./mock/english";
import { petLines } from "./mock/pets";
import { getSupabaseAdmin } from "./supabase";
import type {
  BattleAnswerOutcome,
  BattleState,
  Boss,
  ClassBattleSummary,
  EnglishAnswer,
  EnglishQuestion,
  Rarity,
  User,
  UserPet,
} from "./types";

// Tunable balance. Pronunciation gets no extra damage: every skill counts the same.
const BASE_DAMAGE: Record<EnglishQuestion["difficulty"], number> = { 1: 20, 2: 25, 3: 30 };
/** Pet damage for a wrong answer: a nudge, not a punishment. */
const WRONG_ANSWER_PET_DAMAGE = 6;
const TIME_LIMIT_SEC = 8 * 60;
/** A class needs longer: more students, and the teacher can pause. */
const CLASS_TIME_LIMIT_SEC = 10 * 60;
/** Questions not repeated until this many others have been asked. */
const RECENT_QUESTIONS = 8;

// A pet's battle HP is 100 + 10 × level (110 at level 1, 160 at level 6),
// set in the database (game_battle_pet). A pet at 0 HP faints and stays out.

/** The fighting pet gets this share of the boss's EXP. */
const PET_EXP_SHARE = 0.5;

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
/**
 * Starts a solo battle against `bossId` with the player's active pet (their
 * LevelUp pet until they pick another), or returns the unfinished one.
 */
export async function startSoloBattle(user: User, starter: UserPet, bossId: string) {
  const boss = bosses.find((b) => b.id === bossId);
  if (!boss) throw new Error(`Unknown boss ${bossId}`);
  const player = await playerId(user);

  const { data: pet, error: petError } = await db().rpc("game_battle_pet", {
    p_player: player,
    p_starter_line: starter.lineId,
    p_starter_level: starter.level,
  });
  if (petError || !pet) fail("Could not load the battle pet", petError);
  const { id: petId, max_hp: maxHp } = pet as { id: string; max_hp: number };

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
  join_code: string | null;
  host_player_id: string | null;
  mode: BattleState["mode"];
  status: BattleState["status"];
  hp: number;
  max_hp: number;
  attack_count: number;
  attack_damage: number | null;
  next_attack_at: string | null;
  deadline_at: string | null;
  paused_at: string | null;
  started_at: string | null;
  class_code: string | null;
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
  left_at: string | null;
  rewarded_at: string | null;
  reward_exp: number | null;
  reward_pet_exp: number | null;
  reward_egg_rarity: Rarity | null;
};

type PetRow = { line_id: string; level: number };

type TeamRow = {
  username: string;
  line_id: string | null;
  level: number | null;
  pet_hp: number;
  pet_max_hp: number;
  damage: number;
  correct: number;
  left: boolean;
  host: boolean;
  me: boolean;
};

/**
 * What the battle_view() database function returns; battle_class_state()
 * (the teacher's view) has no `me` or `pet`.
 */
type ViewJson = {
  battle: BattleRow;
  me?: ParticipantRow;
  pet?: PetRow | null;
  team: TeamRow[];
  now: string;
} | null;

/** The teacher isn't in the fight: all their own numbers are zero. */
const WATCHER: ParticipantRow = {
  pet_hp: 0,
  pet_max_hp: 0,
  combo: 0,
  best_combo: 0,
  damage_dealt: 0,
  correct_count: 0,
  wrong_count: 0,
  faint_count: 0,
  current_question_id: null,
  left_at: null,
  rewarded_at: null,
  reward_exp: null,
  reward_pet_exp: null,
  reward_egg_rarity: null,
};

/** Turns the database view into what the browser sees (no answers in it). */
function toState(view: ViewJson): BattleState | undefined {
  if (!view) return undefined;
  const { battle: b, me: p = WATCHER } = view;
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
    startedAt: b.started_at,
    nextAttackAt: b.next_attack_at,
    deadlineAt: b.deadline_at,
    pausedAt: b.paused_at,
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
      left: p.left_at !== null,
    },
    question: question ? toQuestionView(question) : null,
    endReason:
      b.status === "won"
        ? "won"
        : b.status === "ended"
          ? b.mode === "class"
            ? "stopped"
            : "left"
          : b.status === "lost"
            ? p.pet_hp === 0
              ? "fainted"
              : "timeout"
            : null,
    pet: view.pet ? { lineId: view.pet.line_id, level: view.pet.level } : null,
    rewards: p.rewarded_at
      ? {
          exp: p.reward_exp ?? 0,
          petExp: p.reward_pet_exp ?? 0,
          egg: p.reward_egg_rarity ? { rarity: p.reward_egg_rarity } : null,
        }
      : null,
    joinCode: b.join_code,
    classCode: b.class_code,
    isHost: view.team.some((t) => t.me && t.host),
    team: view.team.map((t) => ({
      username: t.username,
      lineId: t.line_id,
      level: t.level,
      petHp: t.pet_hp,
      petMaxHp: t.pet_max_hp,
      damage: t.damage,
      correct: t.correct,
      left: t.left,
      host: t.host,
      me: t.me,
    })),
  };
}

/**
 * Tells everyone watching this battle that it changed, over Supabase
 * Realtime. The message carries no data: each screen then refreshes its
 * own view through a checked Server Function. Best effort: screens also
 * refresh on their own, so a lost message only delays an update.
 */
async function notifyBattle(battleId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic: `battle:${battleId}`, event: "changed", payload: {} }] }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Screens poll as a fallback.
  }
}

/** Picks a pet line from the boss's egg pool by weight. */
function rollEgg(boss: Boss) {
  if (Math.random() >= boss.rewards.eggChance) return undefined;
  const pool = boss.rewards.eggPool;
  let ticket = Math.random() * pool.reduce((sum, e) => sum + e.weight, 0);
  const lineId = (pool.find((e) => (ticket -= e.weight) < 0) ?? pool[pool.length - 1]).lineId;
  const line = petLines.find((l) => l.id === lineId);
  return line && { lineId: line.id, rarity: line.rarity };
}

/**
 * Grants a won battle's rewards (EXP, pet EXP, maybe an egg). The database
 * grants them only once, so calling again after a refresh is safe.
 */
async function claimRewards(user: User, state: BattleState) {
  const boss = bosses.find((b) => b.id === state.bossId);
  if (!boss || state.status !== "won" || state.rewards) return;
  const egg = rollEgg(boss);
  const { error } = await db().rpc("battle_claim_rewards", {
    p_battle: state.id,
    p_username: user.username,
    p_exp: boss.rewards.exp,
    p_pet_exp: Math.round(boss.rewards.exp * PET_EXP_SHARE),
    p_egg_line: egg?.lineId ?? null,
    p_egg_rarity: egg?.rarity ?? null,
  });
  if (error) fail("Could not grant rewards", error);
}

/**
 * Leaves a battle. Solo: it ends without a victory. Group lobby: the host
 * closes it, others leave. Active group battle: the player's pet is out.
 */
export async function leaveBattle(user: User, battleId: string) {
  const { error } = await db().rpc("battle_leave", {
    p_battle: battleId,
    p_player: await playerId(user),
  });
  if (error) fail("Could not leave battle", error);
  await notifyBattle(battleId);
}

/** The player's battle pet (their LevelUp pet until they pick another). */
async function battlePet(player: string, starter: UserPet) {
  const { data, error } = await db().rpc("game_battle_pet", {
    p_player: player,
    p_starter_line: starter.lineId,
    p_starter_level: starter.level,
  });
  if (error || !data) fail("Could not load the battle pet", error);
  return data as { id: string; max_hp: number };
}

/** Opens a group lobby against `bossId` (or returns the player's open one). */
export async function createGroupBattle(user: User, starter: UserPet, bossId: string) {
  const boss = bosses.find((b) => b.id === bossId);
  if (!boss) throw new Error(`Unknown boss ${bossId}`);
  const player = await playerId(user);
  const pet = await battlePet(player, starter);
  const { data, error } = await db().rpc("battle_create_group", {
    p_player: player,
    p_pet: pet.id,
    p_pet_max_hp: pet.max_hp,
    p_boss: boss.id,
    p_base_hp: boss.maxHp,
    p_hp_per_extra: boss.hpPerExtraPlayer,
    p_attack_min_sec: boss.attack.minIntervalSec,
    p_attack_max_sec: boss.attack.maxIntervalSec,
    p_attack_damage: boss.attack.damage,
    p_time_limit_sec: TIME_LIMIT_SEC,
    p_first_question: pickQuestion(boss, []).id,
  });
  if (error || !data) fail("Could not open the lobby", error);
  return data as string;
}

export type JoinError = "no_code" | "started" | "full";

/**
 * Joins a group lobby or a class battle by its code; reopening an already
 * joined one reconnects, and a class student who left comes back.
 */
export async function joinGroupBattle(
  user: User,
  starter: UserPet,
  code: string,
): Promise<{ battleId?: string; error?: JoinError }> {
  const player = await playerId(user);
  const pet = await battlePet(player, starter);
  // The first question has to suit the boss the code is for.
  const { data: battle } = await db()
    .from("battles")
    .select("boss_id")
    .eq("join_code", code.trim().toUpperCase())
    .maybeSingle<{ boss_id: string }>();
  const boss = bosses.find((b) => b.id === battle?.boss_id);
  const first = boss
    ? pickQuestion(boss, [])
    : englishQuestions[Math.floor(Math.random() * englishQuestions.length)];
  const { data, error } = await db().rpc("battle_join_group", {
    p_code: code,
    p_player: player,
    p_pet: pet.id,
    p_pet_max_hp: pet.max_hp,
    p_first_question: first.id,
  });
  if (error) fail("Could not join", error);
  const r = data as { battle?: string; error?: JoinError };
  if (r.battle) await notifyBattle(r.battle);
  return { battleId: r.battle, error: r.error };
}

/** The host starts their lobby (2+ players). */
export async function startGroupBattle(user: User, battleId: string) {
  const { data, error } = await db().rpc("battle_start_group", {
    p_battle: battleId,
    p_player: await playerId(user),
  });
  if (error) fail("Could not start", error);
  const r = data as { ok?: boolean; error?: string };
  if (r.ok) await notifyBattle(battleId);
  return r;
}

/** The player's unfinished group battle (lobby or fight), if any. */
export async function activeGroupBattleId(user: User): Promise<string | undefined> {
  const player = await playerId(user);
  const { data, error } = await db()
    .from("battle_participants")
    .select("battle_id, battles!inner(status, mode)")
    .eq("player_id", player)
    .is("left_at", null)
    .eq("battles.mode", "group")
    .in("battles.status", ["lobby", "active"])
    .order("joined_at", { ascending: false })
    .limit(1);
  if (error) fail("Could not load battles", error);
  return data?.[0]?.battle_id as string | undefined;
}

// Class letters typed on an English keyboard, as they sound: "7B" is 7Б.
const LATIN_CLASS_LETTERS: Record<string, string> = { A: "А", B: "Б", V: "В", G: "Г", D: "Д", E: "Е" };

/** Class codes are typed by hand ("7а", " 7А", "7A"): compare them like this. */
function normalClassCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/[ABVGDE]/g, (c) => LATIN_CLASS_LETTERS[c]);
}

/** The teacher opens a class battle against `bossId` (or gets back their open one). */
export async function createClassBattle(teacher: User, classCode: string, bossId: string) {
  const boss = bosses.find((b) => b.id === bossId);
  if (!boss) throw new Error(`Unknown boss ${bossId}`);
  const { data, error } = await db().rpc("battle_create_class", {
    p_teacher: await playerId(teacher),
    p_class_code: normalClassCode(classCode),
    p_boss: boss.id,
    p_base_hp: boss.maxHp,
    p_hp_per_extra: boss.hpPerExtraPlayer,
    p_attack_min_sec: boss.attack.minIntervalSec,
    p_attack_max_sec: boss.attack.maxIntervalSec,
    p_attack_damage: boss.attack.damage,
    p_time_limit_sec: CLASS_TIME_LIMIT_SEC,
  });
  if (error || !data) fail("Could not open the class battle", error);
  return data as string;
}

type OpenClassRow = {
  id: string;
  boss_id: string;
  status: ClassBattleSummary["status"];
  class_code: string;
  battle_participants: { player_id: string; left_at: string | null }[];
};

function toSummary(row: OpenClassRow, player?: string): ClassBattleSummary {
  const present = row.battle_participants.filter((p) => p.left_at === null);
  return {
    id: row.id,
    bossId: row.boss_id,
    status: row.status,
    classCode: row.class_code,
    students: present.length,
    joined: player !== undefined && present.some((p) => p.player_id === player),
  };
}

const OPEN_CLASS_SELECT = "id, boss_id, status, class_code, battle_participants(player_id, left_at)";

/** The teacher's unfinished class battle, if any. */
export async function teacherClassBattle(teacher: User): Promise<ClassBattleSummary | undefined> {
  const { data, error } = await db()
    .from("battles")
    .select(OPEN_CLASS_SELECT)
    .eq("host_player_id", await playerId(teacher))
    .eq("mode", "class")
    .in("status", ["lobby", "active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) fail("Could not load class battles", error);
  const row = data?.[0] as OpenClassRow | undefined;
  return row && toSummary(row);
}

/** The unfinished battle for the student's class (or `classCode`), if any. */
export async function openClassBattle(
  user: User,
  classCode = user.classCode,
): Promise<ClassBattleSummary | undefined> {
  if (!classCode?.trim()) return undefined;
  const player = await playerId(user);
  const { data, error } = await db()
    .from("battles")
    .select(OPEN_CLASS_SELECT)
    .eq("class_code", normalClassCode(classCode))
    .eq("mode", "class")
    .in("status", ["lobby", "active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) fail("Could not load class battles", error);
  const row = data?.[0] as OpenClassRow | undefined;
  return row && toSummary(row, player);
}

/**
 * Joins (or rejoins) the battle for the student's class (or `classCode`);
 * same rules as joining by its code.
 */
export async function joinClassBattle(user: User, starter: UserPet, classCode = user.classCode) {
  const open = await openClassBattle(user, classCode);
  if (!open) return { error: "no_code" as const };
  const { data, error } = await db().from("battles").select("join_code").eq("id", open.id).single<{ join_code: string }>();
  if (error) fail("Could not load the class battle", error);
  return joinGroupBattle(user, starter, data.join_code);
}

/** What the teacher sees of their class battle, caught up to now. */
export async function classBattleState(teacher: User, battleId: string): Promise<BattleState | undefined> {
  const { data, error } = await db().rpc("battle_class_state", {
    p_battle: battleId,
    p_teacher: await playerId(teacher),
  });
  if (error) fail("Could not load the class battle", error);
  return toState(data as ViewJson);
}

export type ClassControl = "start" | "pause" | "resume" | "end";

/** The teacher starts, pauses, resumes or ends their class battle. */
export async function controlClassBattle(teacher: User, battleId: string, action: ClassControl) {
  const player = await playerId(teacher);
  const { data, error } =
    action === "start"
      ? await db().rpc("battle_start_class", { p_battle: battleId, p_teacher: player })
      : await db().rpc("battle_control_class", { p_battle: battleId, p_teacher: player, p_action: action });
  if (error) fail("Could not change the class battle", error);
  const r = data as { ok?: boolean; error?: string };
  if (r.ok) await notifyBattle(battleId);
  return r;
}

/**
 * Catches the battle up (attacks, time limit) and returns this player's
 * view in one database round trip, or undefined if they aren't in it.
 */
export async function battleState(
  user: User,
  battleId: string,
  claim = true,
): Promise<BattleState | undefined> {
  const { data, error } = await db().rpc("battle_state", {
    p_battle: battleId,
    p_username: user.username,
  });
  if (error) fail("Could not load battle", error);
  const state = toState(data as ViewJson);
  // Won but not rewarded yet (e.g. the winning answer's claim was cut off).
  // Someone who left gets nothing; reload once, never claim in a loop.
  if (claim && state?.status === "won" && !state.rewards && !state.me.left) {
    await claimRewards(user, state);
    return battleState(user, battleId, false);
  }
  return state;
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
  let state = toState(applied.view ?? null);
  if (applied.error) return { state, error: applied.error };
  if (state?.mode !== "solo") await notifyBattle(battleId);
  if (state?.status === "won") state = await battleState(user, battleId);
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
