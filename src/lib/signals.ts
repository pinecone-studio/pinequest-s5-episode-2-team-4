// Understanding signals in Supabase (see
// supabase/migrations/0016_understanding_signals.sql). No student id is
// stored: each student's signal is keyed by a one-way hash, so they can change
// it during the day without anyone seeing who sent it.

import "server-only";
import { secretHash } from "./session";
import { getSupabaseAdmin } from "./supabase";
import type { SignalLevel, SignalSummary, UnderstandingSignal } from "./types";

const db = () => getSupabaseAdmin();

/** True when the server has Supabase keys; without them the mock data is used. */
export const signalsStored = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Per student, subtopic and day, so signals can't be linked across lessons. */
const voterKey = (studentId: string, subtopicId: string, day: string) =>
  secretHash(`signal:${studentId}:${subtopicId}:${day}`);

/** "09:45" in Mongolian time. */
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" });

type SignalKey = { classCode: string; subtopicId: string; day: string; studentId: string };

/** Saves the student's signal for the day, replacing one they sent before. */
export async function saveSignal(key: SignalKey, level: SignalLevel) {
  const { error } = await db()
    .from("understanding_signals")
    .upsert(
      {
        class_code: key.classCode,
        subtopic_id: key.subtopicId,
        day: key.day,
        voter: voterKey(key.studentId, key.subtopicId, key.day),
        level,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "class_code,subtopic_id,day,voter" },
    );
  if (error) throw new Error(`Could not save signal: ${error.message}`);
}

/** The signal the student already sent for this lesson today, if any. */
export async function findSignal(key: SignalKey): Promise<SignalLevel | undefined> {
  const { data, error } = await db()
    .from("understanding_signals")
    .select("level")
    .eq("class_code", key.classCode)
    .eq("subtopic_id", key.subtopicId)
    .eq("day", key.day)
    .eq("voter", voterKey(key.studentId, key.subtopicId, key.day))
    .maybeSingle<{ level: SignalLevel }>();
  if (error) throw new Error(`Could not load signal: ${error.message}`);
  return data?.level;
}

/** Counts per subtopic, ordered by when the first signal came in. */
export function summarizeSignals(
  signals: Pick<UnderstandingSignal, "subtopicId" | "level" | "time">[],
): SignalSummary[] {
  const bySubtopic = new Map<string, SignalSummary>();
  for (const s of [...signals].sort((a, b) => a.time.localeCompare(b.time))) {
    const row = bySubtopic.get(s.subtopicId) ?? {
      subtopicId: s.subtopicId,
      counts: { got: 0, unsure: 0, lost: 0 },
      time: s.time,
    };
    row.counts[s.level]++;
    bySubtopic.set(s.subtopicId, row);
  }
  return [...bySubtopic.values()];
}

/** A class's signals from `fromDay` to `toDay` (both included), per day and topic. */
export async function listSignalsBetween(
  classCode: string,
  fromDay: string,
  toDay: string,
): Promise<{ day: string; summary: SignalSummary[] }[]> {
  const { data, error } = await db()
    .from("understanding_signals")
    .select("day, subtopic_id, level, created_at")
    .eq("class_code", classCode)
    .gte("day", fromDay)
    .lte("day", toDay)
    .returns<{ day: string; subtopic_id: string; level: SignalLevel; created_at: string }[]>();
  if (error) throw new Error(`Could not load signals: ${error.message}`);
  const byDay = new Map<string, Pick<UnderstandingSignal, "subtopicId" | "level" | "time">[]>();
  for (const r of data) {
    byDay.set(r.day, [...(byDay.get(r.day) ?? []), { subtopicId: r.subtopic_id, level: r.level, time: clock(r.created_at) }]);
  }
  return [...byDay].map(([day, signals]) => ({ day, summary: summarizeSignals(signals) })).sort((a, b) => b.day.localeCompare(a.day));
}

/** A class's signals for one day, summed per subtopic. */
export async function listDaySignals(classCode: string, day: string): Promise<SignalSummary[]> {
  const { data, error } = await db()
    .from("understanding_signals")
    .select("subtopic_id, level, created_at")
    .eq("class_code", classCode)
    .eq("day", day)
    .returns<{ subtopic_id: string; level: SignalLevel; created_at: string }[]>();
  if (error) throw new Error(`Could not load signals: ${error.message}`);
  return summarizeSignals(
    data.map((r) => ({ subtopicId: r.subtopic_id, level: r.level, time: clock(r.created_at) })),
  );
}
