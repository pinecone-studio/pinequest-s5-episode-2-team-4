/** Learning days use one stable timezone, independent of the server/browser. */
export const STREAK_TIME_ZONE = "Asia/Ulaanbaatar";

export type LearningStreak = {
  current: number;
  longest: number;
  lastDate: string;
  recentDays: string[];
  /** Earliest date with retained daily history (up to one year). */
  historyStart?: string;
};

export function learningDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STREAK_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function shiftDay(day: string, offset: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function recordLearningDay(previous?: LearningStreak, today = learningDay()): LearningStreak {
  if (previous && previous.lastDate >= today) return previous;
  const current = previous?.lastDate === shiftDay(today, -1) ? previous.current + 1 : 1;
  return {
    current,
    longest: Math.max(previous?.longest ?? 0, current),
    lastDate: today,
    recentDays: [...(previous?.recentDays ?? []).filter((day) => day >= shiftDay(today, -365)), today],
    historyStart: [previous?.historyStart ?? previous?.recentDays[0] ?? today, shiftDay(today, -365)].sort()[1],
  };
}

export function streakSummary(streak?: LearningStreak, today = learningDay()) {
  const current = streak && streak.lastDate >= shiftDay(today, -1) ? streak.current : 0;
  return {
    current,
    longest: streak?.longest ?? 0,
    activeToday: streak?.lastDate === today,
    calendar: {
      today,
      activeDates: (streak?.recentDays ?? []).filter((day) => day >= shiftDay(today, -365) && day <= today),
      availableFrom: [streak?.historyStart ?? streak?.recentDays[0] ?? today, shiftDay(today, -365)].sort()[1],
    },
    days: Array.from({ length: 7 }, (_, i) => {
      const date = shiftDay(today, i - 6);
      return { date, active: streak?.recentDays.includes(date) ?? false };
    }),
  };
}
