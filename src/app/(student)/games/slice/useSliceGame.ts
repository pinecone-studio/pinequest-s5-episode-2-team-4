"use client";

import { useEffect, useRef, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import type { ExplainCardState } from "../_components/ExplainCard";
import { saveBest } from "../_lib/best";
import type { RetryStats } from "../_lib/retry";
import { ROUNDS, starsFor, type SessionResult } from "../_lib/session";
import { answerLabel } from "../_lib/shapes";
import { createSound, type GameSound } from "../_lib/sound";
import { SliceEngine } from "./engine/SliceEngine";
import type { Guess, SliceSummary } from "./engine/types";

export type SliceHud = { step: number; prompt: string; retry: boolean; marks: boolean[]; score: number; combo: number };
export type SliceFinish = SessionResult & { best: number; record: boolean; retry: RetryStats; guesses: number };

const GUESS_NOTES: Record<Exclude<Guess, null>, string> = {
  quick: "Уншиж амжаагүй байж зүслээ.",
  second: "Хоёр дахь буруу зүсэлт.",
};

/** Runs a SliceEngine on the canvas and turns its events into React state for the screens around it. */
export function useSliceGame(questions: GameQuestion[], subjectId: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SliceEngine | null>(null);
  const soundRef = useRef<GameSound | null>(null);
  const [hud, setHud] = useState<SliceHud>({ step: 0, prompt: "", retry: false, marks: [], score: 0, combo: 0 });
  const [card, setCard] = useState<ExplainCardState | null>(null);
  const [slow, setSlow] = useState(false);
  const [finish, setFinish] = useState<SliceFinish | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sound = (soundRef.current ??= createSound());
    let cardTimer: ReturnType<typeof setTimeout> | undefined, lastCombo = 0;
    const showFor = (next: ExplainCardState, ms: number) => {
      setCard(next);
      clearTimeout(cardTimer);
      cardTimer = setTimeout(() => setCard(null), ms);
    };
    const engine = new SliceEngine(canvas, {
      onRound: (round, step) => setHud((h) => ({ ...h, step, prompt: round.question.prompt, retry: round.retry })),
      onMarks: (marks) => setHud((h) => ({ ...h, marks })),
      onScore: (score, combo) => {
        // Only a growing streak means a right slice; the task bonus keeps it.
        if (combo > lastCombo) sound.good(combo);
        lastCombo = combo;
        setHud((h) => ({ ...h, score, combo }));
      },
      onToss: () => sound.tone(200, 0.12, "sine", 0.03, 0, 1.6),
      onSwipe: () => sound.fx("swish"),
      onMiss: () => sound.tone(300, 0.15, "sine", 0.04, 0, 0.6),
      onWrong: (answer, q, guess) => {
        sound.bad();
        clearTimeout(cardTimer);
        const note = guess ? `${GUESS_NOTES[guess]} Таамаглах биш, бодож зүсээрэй: одоо удаан горим.` : undefined;
        setCard({ kind: "bad", title: `«${answerLabel(answer)}» таарахгүй`, text: q.explanation, note });
      },
      onTaskDone: (q, retry, clean) => {
        const chips = q.correct.map(answerLabel);
        if (clean) {
          sound.round();
          showFor({ kind: "good", title: `${retry ? "Давталт амжилттай!" : "Алдаагүй!"} · +25`, chips, seconds: 1.8 }, 1800);
        } else if (!retry) showFor({ kind: "good", title: "Энэ даалгавар төгсгөлд дахин ирнэ", chips, seconds: 2.2 }, 2200);
      },
      onSlow: setSlow,
      onFinish: (summary) => setFinish(toResult(summary, subjectId)),
    });
    engineRef.current = engine;
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(canvas);
    engine.reset(questions);
    return () => {
      clearTimeout(cardTimer);
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, [questions, subjectId]);

  return {
    canvasRef, hud, card, slow, finish, soundOn,
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

/** Every right answer of every task played (repeats too) counts; a let-go one counts as a slip. */
function toResult({ score, mistakes, misses, bestCombo, missed, retry, guesses }: SliceSummary, subjectId: string): SliceFinish {
  const answers = (ROUNDS + retry.retried) * 3;
  return {
    score, bestCombo, retry, guesses,
    stars: starsFor(mistakes + misses),
    accuracy: Math.max(0, Math.round((100 * (answers - misses - mistakes)) / answers)),
    review: missed[0]?.explanation,
    missedIds: missed.map((q) => q.id),
    ...saveBest("slice", subjectId, score),
  };
}
