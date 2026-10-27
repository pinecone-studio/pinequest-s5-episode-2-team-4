// Battle history for students and class English results for teachers
// (server only), read from what battles already record. Pages read them
// through data.ts.

import "server-only";
import { normalClassCode } from "./battle";
import { englishQuestions, englishUnits } from "./mock/english";
import { findPlayer } from "./players";
import { getSupabaseAdmin } from "./supabase";
import type {
  BattleHistory,
  BattleHistoryEntry,
  BattleResult,
  BattleState,
  BattleStatus,
  ClassEnglish,
  EnglishSkill,
  Rarity,
  User,
} from "./types";

const SKILLS: EnglishSkill[] = ["grammar", "pronunciation", "spelling", "translation"];
/** Battles kept in a student's history list. */
const HISTORY_SIZE = 50;
/** A student "could use more practice" in a skill below this accuracy... */
const PRACTICE_BELOW = 0.6;
/** ...once they have answered at least this many questions in it. */
const PRACTICE_MIN_ATTEMPTS = 5;
/** A question counts as hard for the class after this many answers, below this accuracy. */
const HARD_MIN_ATTEMPTS = 3;
const HARD_BELOW = 0.75;
const HARDEST_SHOWN = 5;

function db() {
  return getSupabaseAdmin();
}

type HistoryRow = {
  damage_dealt: number;
  correct_count: number;
  wrong_count: number;
  best_combo: number;
  left_at: string | null;
  reward_exp: number | null;
  reward_pet_exp: number | null;
  reward_egg_rarity: Rarity | null;
  battles: {
    id: string;
    boss_id: string;
    mode: BattleState["mode"];
    status: BattleStatus;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
    battle_participants: { damage_dealt: number }[];
  };
};

function resultOf(row: HistoryRow): BattleResult {
  const b = row.battles;
  if (row.left_at) return "left";
  if (b.status === "won") return "won";
  if (b.status === "lost") return "lost";
  // Ended early: a solo player quit, or a teacher ended the class battle.
  return b.mode === "class" ? "stopped" : "left";
}

/** The student's finished battles (newest first) and their totals. */
export async function battleHistory(user: User): Promise<BattleHistory> {
  const empty: BattleHistory = { battles: 0, victories: 0, damage: 0, eggs: 0, bestCombo: 0, entries: [] };
  const player = await findPlayer(user.username);
  if (!player) return empty;

  const { data, error } = await db()
    .from("battle_participants")
    .select(
      "damage_dealt, correct_count, wrong_count, best_combo, left_at, reward_exp, reward_pet_exp, reward_egg_rarity, " +
        "battles!inner(id, boss_id, mode, status, started_at, ended_at, created_at, battle_participants(damage_dealt))",
    )
    .eq("player_id", player.id)
    .in("battles.status", ["won", "lost", "ended"])
    .not("battles.started_at", "is", null);
  if (error) throw new Error(`Could not load battle history: ${error.message}`);

  const entries: BattleHistoryEntry[] = ((data ?? []) as unknown as HistoryRow[])
    .map((row) => ({
      battleId: row.battles.id,
      bossId: row.battles.boss_id,
      mode: row.battles.mode,
      result: resultOf(row),
      date: row.battles.ended_at ?? row.battles.created_at,
      damage: row.damage_dealt,
      correct: row.correct_count,
      wrong: row.wrong_count,
      bestCombo: row.best_combo,
      teamDamage: row.battles.battle_participants.reduce((sum, p) => sum + p.damage_dealt, 0),
      teamSize: row.battles.battle_participants.length,
      rewards:
        row.reward_exp !== null
          ? { exp: row.reward_exp, petExp: row.reward_pet_exp ?? 0, egg: row.reward_egg_rarity }
          : null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    battles: entries.length,
    victories: entries.filter((e) => e.result === "won").length,
    damage: entries.reduce((sum, e) => sum + e.damage, 0),
    eggs: entries.filter((e) => e.rewards?.egg).length,
    bestCombo: Math.max(0, ...entries.map((e) => e.bestCombo)),
    entries: entries.slice(0, HISTORY_SIZE),
  };
}

type ClassBattleRow = {
  id: string;
  boss_id: string;
  status: BattleStatus;
  class_code: string | null;
  created_at: string;
  ended_at: string | null;
  battle_participants: { player_id: string; damage_dealt: number }[];
};

type ProgressRow = {
  player_id: string;
  question_id: string;
  unit_id: string;
  skill: EnglishSkill;
  attempts: number;
  correct: number;
};

/**
 * The class's English results, added up: everyone whose class code matches,
 * plus everyone who fought in this teacher's battles with the class.
 */
export async function classEnglish(teacher: User, classCode: string): Promise<ClassEnglish> {
  const code = normalClassCode(classCode);
  const [teacherPlayer, studentsRes] = await Promise.all([
    findPlayer(teacher.username),
    db().from("players").select("id, class_code").eq("role", "student").not("class_code", "is", null),
  ]);
  if (studentsRes.error) throw new Error(`Could not load students: ${studentsRes.error.message}`);

  let battles: ClassBattleRow[] = [];
  if (teacherPlayer) {
    const { data, error } = await db()
      .from("battles")
      .select("id, boss_id, status, class_code, created_at, ended_at, battle_participants(player_id, damage_dealt)")
      .eq("host_player_id", teacherPlayer.id)
      .eq("mode", "class")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(`Could not load class battles: ${error.message}`);
    battles = ((data ?? []) as ClassBattleRow[]).filter((b) => b.class_code === code);
  }

  const members = new Set<string>();
  for (const p of (studentsRes.data ?? []) as { id: string; class_code: string }[]) {
    if (normalClassCode(p.class_code) === code) members.add(p.id);
  }
  for (const b of battles) for (const p of b.battle_participants) members.add(p.player_id);

  let rows: ProgressRow[] = [];
  if (members.size > 0) {
    const { data, error } = await db()
      .from("english_progress")
      .select("player_id, question_id, unit_id, skill, attempts, correct")
      .in("player_id", [...members]);
    if (error) throw new Error(`Could not load class progress: ${error.message}`);
    rows = (data ?? []) as ProgressRow[];
  }

  const bySkill = SKILLS.map((skill) => ({ skill, attempts: 0, correct: 0, needPractice: 0 }));
  const byUnit = englishUnits.map((u) => ({ unitId: u.id, title: u.title, attempts: 0, correct: 0 }));
  const perStudentSkill = new Map<string, { attempts: number; correct: number }>();
  const perQuestion = new Map<string, { attempts: number; correct: number }>();
  for (const r of rows) {
    const skill = bySkill.find((s) => s.skill === r.skill);
    if (skill) {
      skill.attempts += r.attempts;
      skill.correct += r.correct;
    }
    const unit = byUnit.find((u) => u.unitId === r.unit_id);
    if (unit) {
      unit.attempts += r.attempts;
      unit.correct += r.correct;
    }
    const key = `${r.player_id}:${r.skill}`;
    const mine = perStudentSkill.get(key) ?? { attempts: 0, correct: 0 };
    perStudentSkill.set(key, { attempts: mine.attempts + r.attempts, correct: mine.correct + r.correct });
    const q = perQuestion.get(r.question_id) ?? { attempts: 0, correct: 0 };
    perQuestion.set(r.question_id, { attempts: q.attempts + r.attempts, correct: q.correct + r.correct });
  }
  // Only counts per skill leave this function, never who.
  for (const [key, s] of perStudentSkill) {
    const skill = bySkill.find((x) => key.endsWith(`:${x.skill}`));
    if (skill && s.attempts >= PRACTICE_MIN_ATTEMPTS && s.correct / s.attempts < PRACTICE_BELOW) skill.needPractice++;
  }

  const byId = new Map(englishQuestions.map((q) => [q.id, q]));
  const hardest = [...perQuestion]
    .filter(([id, s]) => byId.has(id) && s.attempts >= HARD_MIN_ATTEMPTS && s.correct / s.attempts < HARD_BELOW)
    .sort(([, a], [, b]) => a.correct / a.attempts - b.correct / b.attempts || b.attempts - a.attempts)
    .slice(0, HARDEST_SHOWN)
    .map(([id, s]) => {
      const q = byId.get(id)!;
      return { questionId: id, prompt: q.prompt, display: q.display, skill: q.skill, ...s };
    });

  return {
    classCode: code,
    students: members.size,
    active: new Set(rows.map((r) => r.player_id)).size,
    attempts: bySkill.reduce((sum, s) => sum + s.attempts, 0),
    correct: bySkill.reduce((sum, s) => sum + s.correct, 0),
    bySkill,
    byUnit,
    hardest,
    battles: battles.slice(0, 10).map((b) => ({
      id: b.id,
      bossId: b.boss_id,
      status: b.status,
      date: b.ended_at ?? b.created_at,
      students: b.battle_participants.length,
      damage: b.battle_participants.reduce((sum, p) => sum + p.damage_dealt, 0),
    })),
  };
}
