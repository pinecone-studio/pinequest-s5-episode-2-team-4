// Daily quests: three a day from a pool, the same for everyone on a day
// (Ulaanbaatar time), counted from what the student does that day.

import { learningDay } from "./streak";
import type { DailyQuest, Quest, QuestEvent, QuestLog } from "./types";

/** Every quest a day can have. */
export const QUEST_POOL: Quest[] = [
  { id: "game-1", event: "game", goal: 1, title: "Нэг тоглоом тогло", xp: 10, coins: 10 },
  { id: "game-3", event: "game", goal: 3, title: "3 тоглоом тогло", xp: 20, coins: 20 },
  { id: "practice-5", event: "practice", goal: 5, title: "5 дасгал бод", xp: 15, coins: 15 },
  { id: "practice-10", event: "practice", goal: 10, title: "10 дасгал бод", xp: 25, coins: 25 },
  { id: "battle-5", event: "battle", goal: 5, title: "Боссын тулаанд 5 асуултад хариул", xp: 20, coins: 20 },
  { id: "video-1", event: "video", goal: 1, title: "Хичээлийн видео үз", xp: 10, coins: 10 },
  { id: "assignment-1", event: "assignment", goal: 1, title: "Багшийн даалгавар биелүүл", xp: 25, coins: 25 },
];

/** Only students in a class have a teacher's videos and assignments. */
export const CLASS_ONLY_EVENTS: QuestEvent[] = ["video", "assignment"];

const PER_DAY = 3;

/** The day's quests: a shuffle seeded by the date, keeping one quest per activity. */
export function dailyQuests(day: string, inClass: boolean): Quest[] {
  const pool = QUEST_POOL.filter((q) => inClass || !CLASS_ONLY_EVENTS.includes(q.event));
  let seed = [...day].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
  const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked: Quest[] = [];
  for (const q of pool) {
    if (picked.length < PER_DAY && !picked.some((p) => p.event === q.event)) picked.push(q);
  }
  return picked;
}

/** Counts one `event` for today, starting a fresh log on a new day. */
export function recordQuestEvent(log: QuestLog | undefined, event: QuestEvent, today = learningDay()): QuestLog {
  const current = log?.day === today ? log : { day: today, counts: {}, claimed: [] };
  return { ...current, counts: { ...current.counts, [event]: (current.counts[event] ?? 0) + 1 } };
}

/** Today's quests with the student's progress (capped at each goal) and what's already claimed. */
export function questsWithProgress(log: QuestLog | undefined, inClass: boolean, today = learningDay()): DailyQuest[] {
  const current = log?.day === today ? log : undefined;
  return dailyQuests(today, inClass).map((q) => {
    const progress = Math.min(q.goal, current?.counts[q.event] ?? 0);
    return { ...q, progress, done: progress >= q.goal, claimed: current?.claimed.includes(q.id) ?? false };
  });
}

/** The log with a quest marked as claimed (once). */
export function markQuestClaimed(log: QuestLog, questId: string): QuestLog {
  return log.claimed.includes(questId) ? log : { ...log, claimed: [...log.claimed, questId] };
}
