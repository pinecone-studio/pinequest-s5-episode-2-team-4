"use client";

import { useEffect, useRef, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import type { ExplainCardState } from "../_components/ExplainCard";
import { makeChoiceRound, type ChoiceRound } from "../_lib/choices";
import { pickRounds, pointsFor, starsFor, type SessionResult } from "../_lib/session";
import { createSound, type GameSound } from "../_lib/sound";

/** Steps from the gate to the finish line. */
export const FINISH = 10;
export const HORSES = ["Чи", "Хурдан хүрэн", "Цагаан салхи", "Шарга"];
export const PLAYER = 0;
/** Chance each bot takes a step every tick; about 50–70 s to the finish. */
const BOT_SPEED = [0, 0.2, 0.17, 0.14];
const TICK_MS = 1000;
/** Questions dealt for a race; they repeat if the player needs more. */
const POOL = 40;
/** Seconds the «Зөв!» card stays before the next question. */
const RIGHT_SECONDS = 1.2;

type Race = {
  rounds: ChoiceRound[];
  index: number;
  positions: number[];
  combo: number;
  bestCombo: number;
  score: number;
  right: number;
  wrong: number;
  missed: GameQuestion[];
};

const fresh = (questions: GameQuestion[]): Race => ({
  rounds: pickRounds(questions, POOL).map((q) => makeChoiceRound(q)),
  index: 0,
  positions: HORSES.map(() => 0),
  combo: 0,
  bestCombo: 0,
  score: 0,
  right: 0,
  wrong: 0,
  missed: [],
});

/** Horses by steps run; ties share a place: 1, 2, 2, 4. */
export function standings(positions: number[]) {
  const sorted = positions.map((pos, id) => ({ id, name: HORSES[id], pos })).sort((a, b) => b.pos - a.pos);
  return sorted.map((h) => ({ ...h, place: sorted.findIndex((o) => o.pos === h.pos) + 1 }));
}

/**
 * Real-time horse race: the bots gallop on their own from the start, and the
 * player's horse steps forward only on a right answer. The first horse over
 * the finish line ends the race. Rounds are dealt on start, so the random
 * choices never differ between the server and the browser.
 */
export function useHorseRace(questions: GameQuestion[]) {
  const soundRef = useRef<GameSound | null>(null);
  const [race, setRace] = useState<Race | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [explain, setExplain] = useState<ExplainCardState | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    soundRef.current ??= createSound();
    return () => soundRef.current?.stopMusic();
  }, []);

  const round = race ? race.rounds[race.index % race.rounds.length] : null;
  // The first horse over the line ends the race.
  const finished = race !== null && race.positions.some((pos) => pos >= FINISH);
  const running = race !== null && !finished;
  const result: SessionResult | null =
    race && finished
      ? {
          score: race.score + (race.positions[PLAYER] >= FINISH ? 25 : 0),
          accuracy: Math.round((100 * race.right) / Math.max(1, race.right + race.wrong)),
          bestCombo: race.bestCombo,
          stars: starsFor(race.wrong),
          review: race.missed[0]?.explanation,
        }
      : null;

  function start() {
    soundRef.current?.startMusic("race");
    setRace(fresh(questions));
    setPicked(null);
    setExplain(null);
  }

  function choose(choice: number) {
    if (!race || !running || !round || picked !== null) return;
    const ok = choice === round.answer;
    const combo = ok ? race.combo + 1 : 0;
    setPicked(choice);
    if (ok) {
      soundRef.current?.good(combo);
      soundRef.current?.fx("hoof");
    } else soundRef.current?.bad();
    // Functional update: the bots may have moved since this render.
    setRace((r) =>
      r && {
        ...r,
        positions: r.positions.map((pos, horse) => (horse === PLAYER && ok ? pos + 1 : pos)),
        combo,
        bestCombo: Math.max(r.bestCombo, combo),
        score: r.score + (ok ? pointsFor(combo) : 0),
        right: r.right + (ok ? 1 : 0),
        wrong: r.wrong + (ok ? 0 : 1),
        missed: ok || r.missed.includes(round.question) ? r.missed : [...r.missed, round.question],
      },
    );
    setExplain(
      ok
        ? { kind: "good", title: combo >= 3 ? `Зөв! Комбо ${combo} 🔥` : "Зөв! Морь чинь +1 нүүдэл", seconds: RIGHT_SECONDS }
        : { kind: "bad", title: "Буруу. Ботууд давхисаар байна!", text: round.question.explanation },
    );
  }

  /** On to the next question; the race itself keeps going. */
  const next = () => {
    setPicked(null);
    setExplain(null);
    setRace((r) => r && { ...r, index: r.index + 1 });
  };

  // The bots gallop on their own while the race runs.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRace((r) =>
        r && {
          ...r,
          positions: r.positions.map((pos, horse) => (horse !== PLAYER && Math.random() < BOT_SPEED[horse] ? pos + 1 : pos)),
        },
      );
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
      setRace((r) => r && { ...r, index: r.index + 1 });
    }, explain.seconds * 1000);
    return () => clearTimeout(id);
  }, [running, explain]);

  return {
    race,
    round: running ? round : null,
    picked,
    explain: running ? explain : null,
    result,
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
