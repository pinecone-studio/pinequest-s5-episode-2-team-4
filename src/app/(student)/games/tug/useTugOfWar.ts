"use client";

import { useEffect, useRef, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import type { ExplainCardState } from "../_components/ExplainCard";
import { makeChoiceRound, type ChoiceRound } from "../_lib/choices";
import { pickRounds, pointsFor, starsFor, type SessionResult } from "../_lib/session";
import { createSound, type GameSound } from "../_lib/sound";
import { LIMIT } from "./rules";

/** One right answer pulls this far; a combo pulls harder. */
const PULL = 16;
/** The bots pull this far every tick, a little harder as time goes on. */
const BOT_PULL = 0.9;
const BOT_GROWTH = 0.004;
const TICK_MS = 250;
/** A wrong answer lets the bots heave once. */
const WRONG_SLIP = 6;
const POOL = 40;
const RIGHT_SECONDS = 1;

/** 1× for the first right answer, up to 2× from a 5-streak. */
export const pullFor = (combo: number) => PULL * Math.min(2, 1 + 0.25 * (combo - 1));

type Tug = {
  rounds: ChoiceRound[];
  index: number;
  /** Flag position, −LIMIT…LIMIT. */
  rope: number;
  ticks: number;
  /** Counts the player's pulls, so the team's heave animation replays. */
  heaves: number;
  combo: number;
  bestCombo: number;
  score: number;
  right: number;
  wrong: number;
  missed: GameQuestion[];
};

const fresh = (questions: GameQuestion[]): Tug => ({
  rounds: pickRounds(questions, POOL).map((q) => makeChoiceRound(q)),
  index: 0,
  rope: 0,
  ticks: 0,
  heaves: 0,
  combo: 0,
  bestCombo: 0,
  score: 0,
  right: 0,
  wrong: 0,
  missed: [],
});

const clamp = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v));

/**
 * Real-time tug of war: the bot team pulls all the time; every right answer
 * pulls the rope back, harder with a combo. The flag reaching either line
 * ends the game. Rounds are dealt on start, so server and browser agree.
 */
export function useTugOfWar(questions: GameQuestion[]) {
  const soundRef = useRef<GameSound | null>(null);
  const [tug, setTug] = useState<Tug | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [explain, setExplain] = useState<ExplainCardState | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    soundRef.current ??= createSound();
    return () => soundRef.current?.stopMusic();
  }, []);

  const round = tug ? tug.rounds[tug.index % tug.rounds.length] : null;
  const finished = tug !== null && Math.abs(tug.rope) >= LIMIT;
  const won = finished && tug.rope > 0;
  const running = tug !== null && !finished;
  const result: SessionResult | null =
    tug && finished
      ? {
          score: tug.score + (won ? 25 : 0),
          accuracy: Math.round((100 * tug.right) / Math.max(1, tug.right + tug.wrong)),
          bestCombo: tug.bestCombo,
          stars: won ? starsFor(tug.wrong) : 1,
          review: tug.missed[0]?.explanation,
          missedIds: tug.missed.map((q) => q.id),
        }
      : null;

  function start() {
    soundRef.current?.startMusic("tug");
    setTug(fresh(questions));
    setPicked(null);
    setExplain(null);
  }

  function choose(choice: number) {
    if (!tug || !running || !round || picked !== null) return;
    const ok = choice === round.answer;
    const combo = ok ? tug.combo + 1 : 0;
    setPicked(choice);
    if (ok) {
      soundRef.current?.good(combo);
      soundRef.current?.fx("pull");
    } else soundRef.current?.bad();
    // Functional update: the bots may have pulled since this render.
    setTug((t) =>
      t && {
        ...t,
        rope: clamp(t.rope + (ok ? pullFor(combo) : -WRONG_SLIP)),
        heaves: t.heaves + (ok ? 1 : 0),
        combo,
        bestCombo: Math.max(t.bestCombo, combo),
        score: t.score + (ok ? pointsFor(combo) : 0),
        right: t.right + (ok ? 1 : 0),
        wrong: t.wrong + (ok ? 0 : 1),
        missed: ok || t.missed.includes(round.question) ? t.missed : [...t.missed, round.question],
      },
    );
    setExplain(
      ok
        ? { kind: "good", title: combo >= 3 ? `Хүчтэй татлаа! Комбо ${combo}` : "Зөв! Олсыг татлаа", icon: combo >= 3 ? "fire" : "dumbbell", seconds: RIGHT_SECONDS }
        : { kind: "bad", title: "Буруу. Ботууд олсыг татаж байна!", text: round.question.explanation },
    );
  }

  const next = () => {
    setPicked(null);
    setExplain(null);
    setTug((t) => t && { ...t, index: t.index + 1 });
  };

  // The bot team never stops pulling.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTug((t) => t && { ...t, ticks: t.ticks + 1, rope: clamp(t.rope - BOT_PULL * (1 + BOT_GROWTH * t.ticks)) });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!finished) return;
    soundRef.current?.stopMusic();
    soundRef.current?.round();
  }, [finished]);

  // The «Зөв!» card closes by itself.
  useEffect(() => {
    if (!running || !explain?.seconds) return;
    const id = setTimeout(() => {
      setPicked(null);
      setExplain(null);
      setTug((t) => t && { ...t, index: t.index + 1 });
    }, explain.seconds * 1000);
    return () => clearTimeout(id);
  }, [running, explain]);

  return {
    tug,
    round: running ? round : null,
    picked,
    explain: running ? explain : null,
    result,
    won,
    soundOn,
    start,
    choose,
    next,
    tick: () => soundRef.current?.tick(),
    toggleSound: () => {
      const sound = soundRef.current;
      if (!sound) return;
      sound.enabled = !sound.enabled;
      setSoundOn(sound.enabled);
    },
  };
}
