"use client";

import { useEffect, useRef, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import type { ExplainCardState } from "../_components/ExplainCard";
import { saveBest } from "../_lib/best";
import type { ScoreSummary } from "../_lib/score";
import { ROUNDS, starsFor, type SessionResult } from "../_lib/session";
import { answerLabel } from "../_lib/shapes";
import { createSound, type GameSound } from "../_lib/sound";
import { FlightEngine } from "./engine/FlightEngine";
import { WORLD } from "./engine/types";

export type FlightHud = { round: number; prompt: string; marks: (boolean | undefined)[]; score: number; combo: number };
export type FlightFinish = SessionResult & { best: number; record: boolean };

/** Runs a FlightEngine on the canvas and turns its events into React state for the screens around it. */
export function useFlightGame(questions: GameQuestion[], subjectId: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FlightEngine | null>(null);
  const soundRef = useRef<GameSound | null>(null);
  const [hud, setHud] = useState<FlightHud>({ round: 0, prompt: "", marks: [], score: 0, combo: 0 });
  const [card, setCard] = useState<ExplainCardState | null>(null);
  const [finish, setFinish] = useState<FlightFinish | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sound = (soundRef.current ??= createSound());
    let cardTimer: ReturnType<typeof setTimeout> | undefined;
    const engine = new FlightEngine(canvas, {
      onTask: (round, q) => setHud((h) => ({ ...h, round, prompt: q.prompt })),
      onMarks: (marks) => setHud((h) => ({ ...h, marks })),
      onScore: (score, combo) => {
        if (combo > 0) sound.good(combo);
        setHud((h) => ({ ...h, score, combo }));
      },
      onFlap: () => sound.blip(),
      onBump: () => sound.tone(140, 0.08, "square", 0.03),
      onWrong: (picked, right, q) => {
        sound.bad();
        setCard({ kind: "bad", title: `«${answerLabel(picked)}» биш, «${answerLabel(right)}» байсан`, text: q.explanation });
      },
      onClean: (q) => {
        sound.round();
        setCard({ kind: "good", title: "Алдаагүй! · +25", text: q.prompt, chips: q.correct.map(answerLabel), seconds: 2 });
        clearTimeout(cardTimer);
        cardTimer = setTimeout(() => setCard(null), 2000);
      },
      onFinish: (summary) => setFinish(toResult(summary, subjectId)),
    });
    engineRef.current = engine;
    // The banner is clamped to two lines, so the flying area's top only changes with the size.
    const fit = () => {
      engine.resize();
      const banner = bannerRef.current?.getBoundingClientRect(), field = canvas.getBoundingClientRect();
      if (banner && field.width) engine.setTop((banner.bottom - field.top) / (field.width / WORLD.w) + 10);
    };
    fit();
    engine.reset(questions);
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    return () => {
      clearTimeout(cardTimer);
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, [questions, subjectId]);

  return {
    canvasRef, bannerRef, hud, card, finish, soundOn,
    start: () => engineRef.current?.start(),
    tick: () => soundRef.current?.tick(),
    resume: () => {
      setCard(null);
      engineRef.current?.resume();
    },
    again: () => {
      setFinish(null);
      setCard(null);
      engineRef.current?.reset(questions);
    },
    toggleSound: () => {
      const sound = soundRef.current;
      if (!sound) return;
      sound.enabled = !sound.enabled;
      setSoundOn(sound.enabled);
      if (sound.enabled) sound.good();
    },
  };
}

/** Every gate counts as one answer: 3 per task. */
function toResult({ score, mistakes, bestCombo, missed }: ScoreSummary, subjectId: string): FlightFinish {
  const answers = ROUNDS * 3;
  return {
    score, bestCombo,
    stars: starsFor(mistakes),
    accuracy: Math.max(0, Math.round((100 * (answers - mistakes)) / answers)),
    review: missed[0]?.explanation,
    ...saveBest("flight", subjectId, score),
  };
}
