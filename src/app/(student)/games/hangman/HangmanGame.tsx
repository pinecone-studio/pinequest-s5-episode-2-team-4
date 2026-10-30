"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ALPHABET, MAX_MISTAKES, gameStatus, guessLetter } from "./game";
import { HANGMAN_WORDS, wordsForLevel } from "./words";
import { HangmanScene } from "./HangmanScene";
import { useGamePlayed } from "../_lib/played";
import "./hangman.css";

const DIFFICULTIES = [
  { id: "easy", title: "Easy", description: "4–6 үсэгтэй өдөр тутмын үгс", startLevel: 1, levels: 3 },
  { id: "hard", title: "Hard", description: "7–9 үсэгтэй, илүү урт үгс", startLevel: 4, levels: 3 },
  { id: "expert", title: "Expert", description: "10–11 үсэгтэй хамгийн хэцүү үгс", startLevel: 7, levels: 2 },
] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

export function HangmanGame() {
  const [selection, setSelection] = useState<{ difficulty: Difficulty; initialIndex: number } | null>(null);

  function handleStart(event: React.MouseEvent<HTMLButtonElement>) {
    const difficulty = DIFFICULTIES.find((item) => item.id === event.currentTarget.dataset.difficulty);
    if (!difficulty) return;
    const words = wordsForLevel(difficulty.startLevel);
    const initialIndex = words[Math.floor(Math.random() * words.length)].index;
    setSelection({ difficulty, initialIndex });
  }

  if (selection) {
    return <HangmanRound difficulty={selection.difficulty} initialIndex={selection.initialIndex} onBack={() => setSelection(null)} />;
  }

  return (
    <div className="hangman mx-auto w-full max-w-4xl px-4 pt-2 pb-12 md:px-8">
      <Link href="/games" className="inline-flex min-h-12 items-center text-sm font-semibold">← Тоглоом руу буцах</Link>
      <section aria-labelledby="difficulty-title" className="hangman-board hangman-start mt-2 p-5 sm:p-8">
        <h1 id="difficulty-title" className="mt-3 text-3xl font-bold md:text-4xl">HANGMAN</h1>
        <p className="mt-3 text-sm text-ink-muted">Түвшнээ сонгоод тоглоорой.</p>
        <div className="hangman-start-layout"><div className="hangman-mode-list">
          {DIFFICULTIES.map((difficulty) => (
            <button key={difficulty.id} type="button" data-difficulty={difficulty.id} onClick={handleStart} className="hangman-mode-choice">
              <span className="hangman-mode-name">{difficulty.title.toUpperCase()} <span aria-hidden="true">→</span></span>
              
              <span className="hangman-mode-description">{difficulty.description} · {difficulty.levels} level</span>
              
            </button>
          ))}
        </div><div className="hangman-start-scene" aria-hidden="true"><HangmanScene mistakes={0} won={false} lost={false} /></div></div>
      </section>
    </div>
  );
}

function HangmanRound({ initialIndex, difficulty, onBack }: { initialIndex: number; difficulty: Difficulty; onBack: () => void }) {
  const maxLevel = difficulty.levels;
  const [round, setRound] = useState({ index: initialIndex, level: 1, guesses: [] as string[] });
  const entry = HANGMAN_WORDS[round.index];
  const status = gameStatus({ word: entry.word, guesses: round.guesses });
  const completed = status.won && round.level === maxLevel;
  // A game ends on a loss or after the last level: then it counts for today's quests.
  useGamePlayed(status.lost || completed);

  function guess(letter: string) {
    setRound((previous) => {
      const state = { word: HANGMAN_WORDS[previous.index].word, guesses: previous.guesses };
      const next = guessLetter(state, letter);
      if (next === state) return previous;
      return {
        ...previous,
        guesses: next.guesses,
      };
    });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat ||
        (event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)))) return;
      if (/^[a-z]$/i.test(event.key)) {
        event.preventDefault();
        guess(event.key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function nextLevel() {
    if (!status.finished || completed) return;
    const level = round.level + (status.won ? 1 : 0);
    const candidates = wordsForLevel(difficulty.startLevel + level - 1).filter((word) => word.index !== round.index);
    const index = candidates[Math.floor(Math.random() * candidates.length)].index;
    setRound((previous) => ({ ...previous, level, index, guesses: [] }));
  }

  return (
    <div className="hangman mx-auto w-full max-w-4xl px-4 py-4 md:px-8">
      <section aria-labelledby="hangman-title" className="hangman-board">
        <header className="hangman-board-header">
          <Link href="/games" aria-label="Тоглоом руу буцах" className="hangman-back">←</Link>
          <h1 id="hangman-title">HANGMAN</h1>
          <span className="hangman-level">{difficulty.title} · {round.level}/{maxLevel}</span>
          <button type="button" onClick={onBack} className="hangman-change-mode">Төрөл солих</button>
        </header>

        <div className="hangman-word-area">
          <p className="hangman-translation">{entry.translation}</p>
          <div aria-label="Тааж буй үг" className="hangman-word-slots">
            {[...entry.word].map((letter, index) => {
              const shown = round.guesses.includes(letter);
              return (
                <span key={`${round.index}-${index}-${shown}-${status.finished}`} className={`hangman-letter ${shown ? "is-revealed" : ""} ${status.lost && !shown ? "is-missing" : ""}`}>
                  {shown || status.finished ? letter : "_"}
                </span>
              );
            })}
          </div>
        </div>

        <div className="hangman-play-layout">
          <div role="group" aria-label="Англи үсэг сонгох" className="hangman-keyboard">
            {[...ALPHABET].map((letter) => {
              const used = round.guesses.includes(letter);
              return (
                <button key={letter} type="button" onClick={() => guess(letter)} disabled={used || status.finished} aria-label={`${letter}${used ? entry.word.includes(letter) ? ": зөв" : ": буруу" : ""}`} className={`hangman-key ${used ? entry.word.includes(letter) ? "is-correct" : "is-incorrect" : ""}`}>
                  {letter}
                </button>
              );
            })}
          </div>
          <HangmanScene key={round.index} mistakes={status.mistakes} won={status.won} lost={status.lost} />
        </div>

        <footer className="hangman-board-footer">
          <div role="status" aria-live="polite" aria-atomic="true" className="hangman-result">
            {status.finished ? (
              <><p className="hangman-result-title">{completed ? "Бүх level-ийг давлаа!" : status.won ? "Яллаа!" : "Хожигдлоо. Дахиад оролдоорой!"}</p><p>Зөв хариу: <strong lang="en">{entry.word}</strong> — {entry.translation}</p></>
            ) : <p>{MAX_MISTAKES - status.mistakes} / {MAX_MISTAKES} бөмбөлөг</p>}
          </div>
          {status.finished && (completed
            ? <Button onClick={onBack} size="sm">Төрөл сонгох</Button>
            : <Button onClick={nextLevel} size="sm">Next →</Button>)}
        </footer>
      </section>
    </div>
  );
}
