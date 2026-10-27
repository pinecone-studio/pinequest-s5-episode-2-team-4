export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const MAX_MISTAKES = 6;
export type HangmanState = { word: string; guesses: string[] };

export function gameStatus({ word, guesses }: HangmanState) {
  const mistakes = guesses.filter((letter) => !word.includes(letter)).length;
  const won = [...word].every((letter) => guesses.includes(letter));
  return { mistakes, won, lost: mistakes >= MAX_MISTAKES, finished: won || mistakes >= MAX_MISTAKES };
}

export function guessLetter(state: HangmanState, letter: string): HangmanState {
  const normalized = letter.toUpperCase();
  if (!/^[A-Z]$/.test(normalized) || state.guesses.includes(normalized) || gameStatus(state).finished) return state;
  return { ...state, guesses: [...state.guesses, normalized] };
}

/** Pick any entry except the previous one, including both ends of the list. */
export function nextWordIndex(previous: number, count: number, random = Math.random()): number {
  if (count < 2) return 0;
  const index = Math.floor(random * (count - 1));
  return index >= previous ? index + 1 : index;
}
