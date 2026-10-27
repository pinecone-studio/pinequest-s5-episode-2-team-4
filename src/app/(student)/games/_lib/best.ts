// Best score per game and subject, kept in this browser only (no backend yet).

const key = (game: string, subject: string) => `levelup.best.${game}.${subject}`;

export function readBest(game: string, subject: string): number {
  try {
    return Number(localStorage.getItem(key(game, subject))) || 0;
  } catch {
    return 0;
  }
}

/** Saves `score` if it beats the stored best; `best` is the best before this game. */
export function saveBest(game: string, subject: string, score: number) {
  const best = readBest(game, subject), record = score > best;
  if (record) {
    try {
      localStorage.setItem(key(game, subject), String(score));
    } catch {
      // Private mode or blocked storage: the record just isn't remembered.
    }
  }
  return { best, record };
}
