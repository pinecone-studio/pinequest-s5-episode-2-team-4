"use client";

import { useEffect, useRef, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import type { ExplainCardState } from "../_components/ExplainCard";
import { ROUNDS, starsFor, type SessionResult } from "../_lib/session";
import { answerLabel } from "../_lib/shapes";
import { createSound, type GameSound } from "../_lib/sound";
import { SnakeEngine } from "./engine/SnakeEngine";
import { readSkinState, skinById, SKINS, writeSkinState } from "./engine/skins";
import { WORLD } from "./engine/types";

export type SnakeHud = { round: number; prompt: string; found: number; score: number; combo: number };
export type SnakeFinish = SessionResult & { unlocked?: string };

/** Runs a SnakeEngine on the canvas and turns its events into React state for the screens around it. */
export function useSnakeGame(questions: GameQuestion[], skinId: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SnakeEngine | null>(null);
  const soundRef = useRef<GameSound | null>(null);
  const [hud, setHud] = useState<SnakeHud>({ round: 0, prompt: "", found: 0, score: 0, combo: 0 });
  const [card, setCard] = useState<ExplainCardState | null>(null);
  const [finish, setFinish] = useState<SnakeFinish | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sound = (soundRef.current ??= createSound());
    let cardTimer: ReturnType<typeof setTimeout> | undefined;
    const engine = new SnakeEngine(canvas, {
      onRound: (round, q) => setHud((h) => ({ ...h, round, prompt: q.prompt, found: 0 })),
      onFound: (found) => {
        sound.fx("eat");
        setHud((h) => ({ ...h, found }));
      },
      onScore: (score, combo) => {
        if (combo > 0) sound.good(combo);
        setHud((h) => ({ ...h, score, combo }));
      },
      onWrong: (answer, q) => {
        sound.bad();
        setCard({ kind: "bad", title: `«${answerLabel(answer)}» таарахгүй`, text: q.explanation });
      },
      onRoundDone: (q, bonus, clean) => {
        sound.round();
        setCard({ kind: "good", title: `${clean ? "Алдаагүй! Гайхалтай" : "Даалгавар биеллээ"} · +${bonus}`, chips: q.correct.map(answerLabel), seconds: 2.2 });
        clearTimeout(cardTimer);
        cardTimer = setTimeout(() => setCard(null), 2200);
      },
      onFinish: ({ score, mistakes, bestCombo, missed }) => {
        sound.stopMusic();
        setFinish(saveResult(score, mistakes, bestCombo, missed));
      },
    });
    engineRef.current = engine;
    // The banner is clamped to two lines, so the play area's top only changes with the size.
    const fit = () => {
      engine.resize();
      const banner = bannerRef.current?.getBoundingClientRect(), field = canvas.getBoundingClientRect();
      if (banner && field.width) engine.setTop((banner.bottom - field.top) / (field.width / WORLD.w) + 14);
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
      sound.stopMusic();
    };
  }, [questions]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.skin = skinById(skinId);
  }, [skinId]);

  return {
    canvasRef, bannerRef, hud, card, finish, soundOn,
    start: () => {
      soundRef.current?.startMusic("snake");
      engineRef.current?.start();
    },
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

/** Stars go into the saved total; reaching a skin's threshold unlocks and selects it. */
function saveResult(score: number, mistakes: number, bestCombo: number, missed: GameQuestion[]): SnakeFinish {
  const stars = starsFor(mistakes), saved = readSkinState(), total = saved.stars + stars;
  const unlocked = SKINS.find((s) => s.need > saved.stars && s.need <= total);
  writeSkinState({ stars: total, skin: unlocked?.id ?? saved.skin });
  const answers = ROUNDS * 3;
  return {
    score, bestCombo, stars,
    accuracy: Math.round((100 * answers) / (answers + mistakes)),
    review: missed[0]?.explanation,
    unlocked: unlocked?.name,
  };
}
