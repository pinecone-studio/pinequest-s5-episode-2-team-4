"use client";

import { useEffect, useRef, useState } from "react";
import type { GameAnswer, GameQuestion } from "@/lib/types";
import type { ExplainCardState } from "../_components/ExplainCard";
import { pickRounds, pointsFor, shuffle, starsFor, type SessionResult } from "../_lib/session";
import { createSound, type GameSound } from "../_lib/sound";
import { HoopsEngine } from "./engine/HoopsEngine";

export const PROMPTS = 5;
export const HEARTS = 3;
/** Right balls per prompt; every question has 3. */
export const TO_SCORE = 3;
/** From this prompt (0-based) the hoop moves. */
const MOVING_FROM = 2;
/** Points for throwing a wrong ball away. */
const DISCARD_POINTS = 5;

type Rack = { answer: GameAnswer; ok: boolean }[];

type Game = {
  rounds: GameQuestion[];
  index: number;
  /** Balls still to play for this prompt; the first one is on the court. */
  rack: Rack;
  scored: number;
  hearts: number;
  combo: number;
  bestCombo: number;
  score: number;
  right: number;
  wrong: number;
  missed: GameQuestion[];
};

/** 3 right and 3 wrong balls for a prompt, shuffled. */
const rackFor = (q: GameQuestion): Rack =>
  shuffle([...q.correct.map((answer) => ({ answer, ok: true })), ...q.wrong.slice(0, 3).map((answer) => ({ answer, ok: false }))]);

/**
 * Swipe basketball state. Each prompt serves its balls one by one: score the
 * right ones, throw the wrong ones away. A missed right ball comes back at the
 * end of the rack. The game ends after the last prompt or the last heart.
 */
export function useHoops(questions: GameQuestion[]) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HoopsEngine | null>(null);
  const soundRef = useRef<GameSound | null>(null);
  // The engine calls back from its frame loop, so the game lives in a ref
  // and a copy is put in state for the screen.
  const gameRef = useRef<Game | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [explain, setExplain] = useState<ExplainCardState | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundRef.current ??= createSound();
    const engine = new HoopsEngine(canvas);
    engineRef.current = engine;
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
      soundRef.current?.stopMusic();
    };
  }, []);

  useEffect(() => {
    if (!explain?.seconds) return;
    const id = setTimeout(() => setExplain(null), explain.seconds * 1000);
    return () => clearTimeout(id);
  }, [explain]);

  const finished = game !== null && (game.hearts <= 0 || game.index >= PROMPTS);
  const result: SessionResult | null =
    game && finished
      ? {
          score: game.score,
          accuracy: Math.round((100 * game.right) / Math.max(1, game.right + game.wrong)),
          bestCombo: game.bestCombo,
          stars: game.hearts > 0 ? starsFor(game.wrong) : 1,
          review: game.missed[0]?.explanation,
          missedIds: game.missed.map((q) => q.id),
        }
      : null;

  /** Puts the game on screen and serves its next ball (or none when it is over). */
  function show(g: Game) {
    gameRef.current = g;
    setGame({ ...g, rack: [...g.rack] });
    const over = g.hearts <= 0 || g.index >= PROMPTS;
    engineRef.current?.setMoving(!over && g.index >= MOVING_FROM);
    engineRef.current?.serve(over ? null : (g.rack[0]?.answer ?? null));
    if (over) {
      soundRef.current?.stopMusic();
      soundRef.current?.round();
    }
  }

  /** The current ball is done: drop it (or send a missed right ball to the back) and move on. */
  function advance(g: Game, again: boolean): Game {
    const [ball, ...rest] = g.rack;
    const rack = again && ball ? [...rest, ball] : rest;
    if (rack.length > 0) return { ...g, rack };
    // Prompt finished: on to the next one.
    const index = g.index + 1;
    if (index < PROMPTS) setExplain({ kind: "good", title: "Даалгавар дууслаа! Дараагийнх нь…", seconds: 1.4 });
    return { ...g, index, scored: 0, rack: index < PROMPTS ? rackFor(g.rounds[index]) : [] };
  }

  function onShot(scored: boolean) {
    const g = gameRef.current;
    if (!g) return;
    const ball = g.rack[0], q = g.rounds[g.index];
    if (!ball) return;
    let next: Game;
    if (scored) soundRef.current?.fx("swish");
    else soundRef.current?.fx("bounce");
    if (scored && ball.ok) {
      const combo = g.combo + 1;
      soundRef.current?.good(combo);
      next = { ...g, combo, bestCombo: Math.max(g.bestCombo, combo), score: g.score + pointsFor(combo), right: g.right + 1, scored: g.scored + 1 };
      next = advance(next, false);
    } else if (scored) {
      soundRef.current?.bad();
      setExplain({ kind: "bad", title: "Буруу бөмбөг сагсанд орлоо! −1", icon: "heart", text: q.explanation, seconds: 3.5 });
      next = advance({ ...g, combo: 0, hearts: g.hearts - 1, wrong: g.wrong + 1, missed: g.missed.includes(q) ? g.missed : [...g.missed, q] }, false);
    } else {
      // A miss: a right ball comes back later, a wrong one is just gone.
      next = advance({ ...g, combo: ball.ok ? 0 : g.combo }, ball.ok);
    }
    show(next);
  }

  function onDiscard() {
    const g = gameRef.current;
    if (!g) return;
    const ball = g.rack[0], q = g.rounds[g.index];
    if (!ball) return;
    if (ball.ok) {
      soundRef.current?.bad();
      setExplain({ kind: "bad", title: "Энэ зөв хариулт байсан!", text: q.explanation, seconds: 3 });
    } else soundRef.current?.blip();
    const next = ball.ok
      ? { ...g, combo: 0, wrong: g.wrong + 1, missed: g.missed.includes(q) ? g.missed : [...g.missed, q] }
      : { ...g, score: g.score + DISCARD_POINTS };
    // Wait for the ball to roll off before serving the next one.
    gameRef.current = next;
    setTimeout(() => show(advance(gameRef.current!, false)), 350);
  }

  function start() {
    const rounds = pickRounds(questions, PROMPTS);
    const g: Game = { rounds, index: 0, rack: rackFor(rounds[0]), scored: 0, hearts: HEARTS, combo: 0, bestCombo: 0, score: 0, right: 0, wrong: 0, missed: [] };
    engineRef.current?.setCallbacks({ onShot, onDiscard });
    soundRef.current?.startMusic("hoops");
    setExplain(null);
    show(g);
  }

  return {
    canvasRef,
    game,
    question: game && !finished ? game.rounds[game.index] : null,
    explain: finished ? null : explain,
    result,
    soundOn,
    start,
    discard: () => engineRef.current?.discard(),
    tick: () => soundRef.current?.tick(),
    toggleSound: () => {
      const sound = soundRef.current;
      if (!sound) return;
      sound.enabled = !sound.enabled;
      setSoundOn(sound.enabled);
    },
  };
}
