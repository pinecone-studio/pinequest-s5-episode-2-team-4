"use client";

import { useEffect, useRef, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import type { ExplainCardState } from "../_components/ExplainCard";
import { makeChoiceRound, type ChoiceRound } from "../_lib/choices";
import { pickRounds, pointsFor, starsFor, type SessionResult } from "../_lib/session";
import { createSound, type GameSound } from "../_lib/sound";
import { RunnerEngine } from "./engine/RunnerEngine";

/** Gates before the boss. */
export const GATES = 8;
const START_POWER = 10;
/** About 6 right answers out of 8 (with some combo) beat the boss. */
export const BOSS_POWER = 60;
const WRONG_LOSS = 8;
/** Seconds a wrong answer's explanation stays; the run goes on meanwhile. */
const EXPLAIN_SECONDS = 3.5;

/** A right gate gives 10 power, +2 for each answer in a combo, up to +6. */
export const gainFor = (combo: number) => 10 + 2 * Math.min(3, combo - 1);

type Run = {
  rounds: ChoiceRound[];
  power: number;
  combo: number;
  bestCombo: number;
  score: number;
  right: number;
  wrong: number;
  missed: GameQuestion[];
};

/** Lane runner state: the hero's power, the gate being answered, and the boss fight's result. */
export function useLaneRunner(questions: GameQuestion[]) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RunnerEngine | null>(null);
  const soundRef = useRef<GameSound | null>(null);
  // The engine calls back from its frame loop, so the run lives in a ref and
  // a copy is put in state for the screen.
  const runRef = useRef<Run | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [next, setNext] = useState(0);
  const [explain, setExplain] = useState<ExplainCardState | null>(null);
  const [result, setResult] = useState<(SessionResult & { won: boolean }) | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundRef.current ??= createSound();
    const engine = new RunnerEngine(canvas);
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

  // ← → and A/D switch lanes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") engineRef.current?.move(-1);
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") engineRef.current?.move(1);
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A wrong answer's explanation closes by itself.
  useEffect(() => {
    if (!explain?.seconds) return;
    const id = setTimeout(() => setExplain(null), explain.seconds * 1000);
    return () => clearTimeout(id);
  }, [explain]);

  function start() {
    const fresh: Run = {
      rounds: pickRounds(questions, GATES).map((q) => makeChoiceRound(q, 3)),
      power: START_POWER,
      combo: 0,
      bestCombo: 0,
      score: 0,
      right: 0,
      wrong: 0,
      missed: [],
    };
    runRef.current = fresh;
    soundRef.current?.startMusic("runner");
    setRun({ ...fresh });
    setExplain(null);
    setResult(null);
    engineRef.current?.start(fresh.rounds, START_POWER, BOSS_POWER, {
      onGate(index, lane) {
        const r = runRef.current!;
        const round = r.rounds[index];
        const ok = lane === round.answer;
        r.combo = ok ? r.combo + 1 : 0;
        r.bestCombo = Math.max(r.bestCombo, r.combo);
        r.power = ok ? r.power + gainFor(r.combo) : Math.max(1, r.power - WRONG_LOSS);
        r.score += ok ? pointsFor(r.combo) : 0;
        r.right += ok ? 1 : 0;
        r.wrong += ok ? 0 : 1;
        if (!ok && !r.missed.includes(round.question)) r.missed.push(round.question);
        soundRef.current?.fx("jump");
        if (ok) soundRef.current?.good(r.combo);
        else soundRef.current?.bad();
        setRun({ ...r });
        setExplain(ok ? null : { kind: "bad", title: "Буруу хаалга! Хүч чинь буурлаа", text: round.question.explanation, seconds: EXPLAIN_SECONDS });
        return { ok, power: r.power };
      },
      onNext: setNext,
      onFinish(won) {
        const r = runRef.current!;
        soundRef.current?.stopMusic();
        if (won) soundRef.current?.round();
        else {
          soundRef.current?.fx("crash");
          soundRef.current?.bad();
        }
        setExplain(null);
        setResult({
          won,
          score: r.score + (won ? 25 : 0),
          accuracy: Math.round((100 * r.right) / Math.max(1, r.right + r.wrong)),
          bestCombo: r.bestCombo,
          stars: won ? starsFor(r.wrong) : 1,
          review: r.missed[0]?.explanation,
          missedIds: r.missed.map((q) => q.id),
        });
      },
    });
  }

  return {
    canvasRef,
    run,
    /** The gate to answer now, or null before the start and at the boss. */
    round: run && next >= 0 && next < run.rounds.length ? run.rounds[next] : null,
    next,
    explain,
    result,
    soundOn,
    start,
    move: (dir: -1 | 1) => engineRef.current?.move(dir),
    tick: () => soundRef.current?.tick(),
    toggleSound: () => {
      const sound = soundRef.current;
      if (!sound) return;
      sound.enabled = !sound.enabled;
      setSoundOn(sound.enabled);
    },
  };
}
