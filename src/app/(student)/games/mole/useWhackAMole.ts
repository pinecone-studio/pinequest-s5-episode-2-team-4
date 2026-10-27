"use client";

import { useEffect, useRef, useState } from "react";
import type { GameAnswer, GameQuestion } from "@/lib/types";
import type { ExplainCardState } from "../_components/ExplainCard";
import { pickRounds, pointsFor, shuffle, starsFor, type SessionResult } from "../_lib/session";
import { createSound, type GameSound } from "../_lib/sound";

export const HOLES = 9;
export const HEARTS = 3;
export const SECONDS = 60;
/** Right answers to find per prompt (every question has 3). */
export const TO_FIND = 3;
const TICK_MS = 100;
/** A mole pops up this often and stays this long; both shrink as time runs out. */
const SPAWN_MS = [750, 430];
const UP_MS = [1700, 1000];
/** Share of moles that hold a right answer. */
const RIGHT_SHARE = 0.45;
/** A hit mole stays on screen this long to show it was hit. */
const HIT_MS = 380;
const POOL = 30;

export type Mole = {
  id: number;
  answer: GameAnswer;
  ok: boolean;
  /** Game time (ms) when it goes back down. */
  until: number;
  hit?: "good" | "bad";
};

type Game = {
  rounds: GameQuestion[];
  index: number;
  /** Right answers already hit for this prompt. */
  found: GameAnswer[];
  moles: (Mole | null)[];
  /** Game time in ms. */
  time: number;
  nextSpawn: number;
  nextId: number;
  hearts: number;
  combo: number;
  bestCombo: number;
  score: number;
  right: number;
  wrong: number;
  missed: GameQuestion[];
};

const fresh = (questions: GameQuestion[]): Game => ({
  rounds: pickRounds(questions, POOL),
  index: 0,
  found: [],
  moles: Array.from({ length: HOLES }, () => null),
  time: 0,
  nextSpawn: 400,
  nextId: 1,
  hearts: HEARTS,
  combo: 0,
  bestCombo: 0,
  score: 0,
  right: 0,
  wrong: 0,
  missed: [],
});

/** 0 at the start, 1 at the end of the clock. */
const progress = (g: Game) => Math.min(1, g.time / (SECONDS * 1000));
const lerp = ([a, b]: number[], t: number) => a + (b - a) * t;

/** Moves the clock: expired moles go down and a new one may pop up in a free hole. */
function step(g: Game, dt: number): Game {
  const time = g.time + dt;
  const moles = g.moles.map((m) => (m && time >= m.until ? null : m));
  let { nextSpawn, nextId } = g;
  if (time >= nextSpawn) {
    const free = moles.flatMap((m, i) => (m ? [] : [i]));
    if (free.length) {
      const q = g.rounds[g.index % g.rounds.length];
      const shown = moles.flatMap((m) => (m ? [m.answer] : []));
      const rights = q.correct.filter((a) => !g.found.includes(a) && !shown.includes(a));
      const wrongs = q.wrong.filter((a) => !shown.includes(a));
      const ok = rights.length > 0 && (Math.random() < RIGHT_SHARE || wrongs.length === 0);
      const pool = ok ? rights : wrongs;
      if (pool.length) {
        const hole = shuffle(free)[0];
        moles[hole] = { id: nextId++, answer: shuffle(pool)[0], ok, until: time + lerp(UP_MS, progress(g)) };
      }
    }
    nextSpawn = time + lerp(SPAWN_MS, progress(g)) * (0.8 + Math.random() * 0.4);
  }
  return { ...g, time, moles, nextSpawn, nextId };
}

/**
 * Whack-a-mole state: moles pop up holding answers to the current prompt.
 * Hitting the 3 right ones moves on to the next prompt; a wrong one costs a
 * heart. The game ends when the clock or the hearts run out.
 */
export function useWhackAMole(questions: GameQuestion[]) {
  const soundRef = useRef<GameSound | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [explain, setExplain] = useState<ExplainCardState | null>(null);
  /** Hole of the last swing, so the hammer replays there. */
  const [swing, setSwing] = useState<{ hole: number; n: number } | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    soundRef.current ??= createSound();
    return () => soundRef.current?.stopMusic();
  }, []);

  const finished = game !== null && (game.hearts <= 0 || game.time >= SECONDS * 1000);
  const running = game !== null && !finished;
  const question = game ? game.rounds[game.index % game.rounds.length] : null;
  const result: SessionResult | null =
    game && finished
      ? {
          score: game.score,
          accuracy: Math.round((100 * game.right) / Math.max(1, game.right + game.wrong)),
          bestCombo: game.bestCombo,
          stars: starsFor(game.wrong),
          review: game.missed[0]?.explanation,
        }
      : null;

  // The clock: moles go up and down.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setGame((g) => g && step(g, TICK_MS)), TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!finished) return;
    soundRef.current?.stopMusic();
    soundRef.current?.round();
  }, [finished]);

  useEffect(() => {
    if (!explain?.seconds) return;
    const id = setTimeout(() => setExplain(null), explain.seconds * 1000);
    return () => clearTimeout(id);
  }, [explain]);

  function start() {
    soundRef.current?.startMusic("mole");
    setGame(fresh(questions));
    setExplain(null);
    setSwing(null);
  }

  function hit(hole: number) {
    if (!game || !running) return;
    setSwing((s) => ({ hole, n: (s?.n ?? 0) + 1 }));
    const mole = game.moles[hole];
    if (!mole || mole.hit) return;
    soundRef.current?.fx("whack");
    const q = game.rounds[game.index % game.rounds.length];
    const combo = mole.ok ? game.combo + 1 : 0;
    const found = mole.ok ? [...game.found, mole.answer] : game.found;
    const done = found.length >= TO_FIND;
    if (mole.ok) soundRef.current?.good(combo);
    else soundRef.current?.bad();
    if (done) soundRef.current?.round();
    setExplain(
      mole.ok
        ? done
          ? { kind: "good", title: "Бүгдийг нь оллоо! Шинэ даалгавар", seconds: 1.4 }
          : null
        : { kind: "bad", title: "Буруу мэнгэ! −1 ❤️", text: q.explanation, seconds: 3 },
    );
    // Functional update: the clock may have ticked since this render.
    setGame((g) => {
      if (!g) return g;
      const moles = g.moles.map((m, i) => (i === hole && m ? { ...m, hit: mole.ok ? ("good" as const) : ("bad" as const), until: g.time + HIT_MS } : m));
      return {
        ...g,
        // A finished prompt clears the field and moves on.
        index: done ? g.index + 1 : g.index,
        found: done ? [] : found,
        moles: done ? moles.map((m, i) => (i === hole ? m : null)) : moles,
        nextSpawn: done ? g.time + 700 : g.nextSpawn,
        hearts: g.hearts - (mole.ok ? 0 : 1),
        combo,
        bestCombo: Math.max(g.bestCombo, combo),
        score: g.score + (mole.ok ? pointsFor(combo) : 0) + (done ? 15 : 0),
        right: g.right + (mole.ok ? 1 : 0),
        wrong: g.wrong + (mole.ok ? 0 : 1),
        missed: mole.ok || g.missed.includes(q) ? g.missed : [...g.missed, q],
      };
    });
  }

  return {
    game,
    question: running ? question : null,
    explain: running ? explain : null,
    swing,
    result,
    soundOn,
    start,
    hit,
    tick: () => soundRef.current?.tick(),
    toggleSound: () => {
      const sound = soundRef.current;
      if (!sound) return;
      sound.enabled = !sound.enabled;
      setSoundOn(sound.enabled);
    },
  };
}
