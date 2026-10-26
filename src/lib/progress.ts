// English learning progress (server only), built from the english_progress
// rows that every battle answer updates. Pages read it through data.ts.

import "server-only";
import { vocabularyWord } from "./english";
import { englishQuestions, englishUnits } from "./mock/english";
import { getSupabaseAdmin } from "./supabase";
import type { EnglishProgress, EnglishQuestion, EnglishSkill, User } from "./types";

const SKILLS: EnglishSkill[] = ["grammar", "pronunciation", "spelling", "translation"];
const MISTAKES_SHOWN = 5;

type ProgressRow = {
  question_id: string;
  unit_id: string;
  skill: EnglishSkill;
  attempts: number;
  correct: number;
  last_correct: boolean | null;
  last_answered_at: string;
};

/** Same matching as the login: usernames ignore case. LIKE wildcards are escaped. */
const exactName = (name: string) => name.replace(/[\\%_]/g, (c) => `\\${c}`);

const expectedText = (q: EnglishQuestion) =>
  q.kind === "choice" ? q.options[q.correctIndex] : q.acceptedAnswers[0];

const vocabulary = englishQuestions.map(vocabularyWord).filter((w): w is string => Boolean(w));
const vocabularyTotal = new Set(vocabulary.map((w) => w.toLowerCase())).size;

/** The empty summary for a student who hasn't answered anything yet. */
function empty(): EnglishProgress {
  return {
    attempts: 0,
    correct: 0,
    bySkill: SKILLS.map((skill) => ({ skill, attempts: 0, correct: 0 })),
    byUnit: englishUnits.map((u) => ({ unitId: u.id, title: u.title, attempts: 0, correct: 0 })),
    vocabulary: { learned: [], total: vocabularyTotal },
    mistakes: [],
  };
}

export async function englishProgress(user: User): Promise<EnglishProgress> {
  const db = getSupabaseAdmin();
  // Read-only: a student who never battled has no player row yet.
  const { data: player, error: playerError } = await db
    .from("players")
    .select("id")
    .ilike("username", exactName(user.username))
    .maybeSingle<{ id: string }>();
  if (playerError) throw new Error(`Could not load player: ${playerError.message}`);
  if (!player) return empty();

  const { data, error } = await db
    .from("english_progress")
    .select("question_id, unit_id, skill, attempts, correct, last_correct, last_answered_at")
    .eq("player_id", player.id)
    .order("last_answered_at", { ascending: false });
  if (error) throw new Error(`Could not load progress: ${error.message}`);
  const rows = (data ?? []) as ProgressRow[];

  const summary = empty();
  for (const row of rows) {
    summary.attempts += row.attempts;
    summary.correct += row.correct;
    const skill = summary.bySkill.find((s) => s.skill === row.skill);
    if (skill) {
      skill.attempts += row.attempts;
      skill.correct += row.correct;
    }
    const unit = summary.byUnit.find((u) => u.unitId === row.unit_id);
    if (unit) {
      unit.attempts += row.attempts;
      unit.correct += row.correct;
    }
  }

  const accuracy = (s: { attempts: number; correct: number }) => s.correct / s.attempts;
  const practised = summary.bySkill.filter((s) => s.attempts > 0);
  summary.weakestSkill = practised.sort((a, b) => accuracy(a) - accuracy(b))[0]?.skill;

  const byId = new Map(englishQuestions.map((q) => [q.id, q]));
  const learned = new Set<string>();
  for (const row of rows) {
    const q = byId.get(row.question_id);
    const word = q && vocabularyWord(q);
    if (word && row.last_correct) learned.add(word.toLowerCase());
  }
  summary.vocabulary.learned = [...learned].sort();

  // Rows are newest first; a mistake counts until the question is answered right.
  summary.mistakes = rows
    .filter((row) => row.last_correct === false)
    .slice(0, MISTAKES_SHOWN)
    .flatMap((row) => {
      const q = byId.get(row.question_id);
      if (!q) return [];
      return [
        {
          questionId: q.id,
          skill: q.skill,
          unitTitle: englishUnits.find((u) => u.id === q.unitId)?.title ?? q.unitId,
          prompt: q.prompt,
          display: q.display,
          expected: expectedText(q),
          explanation: q.explanation,
        },
      ];
    });

  return summary;
}
