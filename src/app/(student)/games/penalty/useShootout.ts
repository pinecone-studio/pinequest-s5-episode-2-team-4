"use client";

import { useEffect, useRef, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import type { ExplainCardState } from "../_components/ExplainCard";
import { makeChoiceRound, type ChoiceRound } from "../_lib/choices";
import { pickRounds, pointsFor, starsFor, type SessionResult } from "../_lib/session";
import { createSound, type GameSound } from "../_lib/sound";
import { PenaltyEngine } from "./engine/PenaltyEngine";

/** Kicks each before sudden death, and the most kicks each in all. */
export const KICKS = 5;
const MAX_KICKS = 10;
/** Seconds to answer while the bot runs up. */
export const DEFEND_SECONDS = 3;
const POOL = 24;

type Side = "attack" | "defend";

type Game = {
  rounds: GameQuestion[];
  qi: number;
  /** Goals per kick: the player's kicks and the bot's kicks. */
  you: boolean[];
  bot: boolean[];
  combo: number;
  bestCombo: number;
  score: number;
  right: number;
  wrong: number;
  missed: GameQuestion[];
};

export type Turn = { side: Side; round: ChoiceRound; picked: number | null; n: number };

const goals = (kicks: boolean[]) => kicks.filter(Boolean).length;

/** Over once one side can't catch up, or after sudden death breaks the tie. */
function isOver(g: Game) {
  const y = goals(g.you), b = goals(g.bot);
  if (g.you.length <= KICKS && g.bot.length <= KICKS) {
    const yLeft = KICKS - g.you.length, bLeft = KICKS - g.bot.length;
    if (y + yLeft < b || b + bLeft < y) return true;
    if (g.you.length < KICKS || g.bot.length < KICKS) return false;
  }
  return g.you.length === g.bot.length && (y !== b || g.you.length >= MAX_KICKS);
}

/**
 * Penalty shootout state: the player kicks (pick the right corner) and keeps
 * goal (pick the right answer before the bot shoots), turn about.
 */
export function useShootout(questions: GameQuestion[]) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PenaltyEngine | null>(null);
  const soundRef = useRef<GameSound | null>(null);
  // The engine calls back from its frame loop, so the game and turn live in
  // refs; copies are put in state for the screen.
  const gameRef = useRef<Game | null>(null);
  const turnRef = useRef<Turn | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [game, setGame] = useState<Game | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [explain, setExplain] = useState<ExplainCardState | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundRef.current ??= createSound();
    const engine = new PenaltyEngine(canvas);
    engineRef.current = engine;
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
      clearTimeout(timerRef.current);
      soundRef.current?.stopMusic();
    };
  }, []);

  useEffect(() => {
    if (!explain?.seconds) return;
    const id = setTimeout(() => setExplain(null), explain.seconds * 1000);
    return () => clearTimeout(id);
  }, [explain]);

  // Keys 1–4 kick at a corner (when keeping goal, ChoiceGrid takes the keys).
  useEffect(() => {
    if (turn?.side !== "attack") return;
    function onKey(e: KeyboardEvent) {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < 4) engineRef.current?.kick(i);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn?.side]);

  const finished = game !== null && isOver(game);
  const won = finished && goals(game.you) > goals(game.bot);
  const result: SessionResult | null =
    game && finished
      ? {
          score: game.score + (won ? 25 : 0),
          accuracy: Math.round((100 * game.right) / Math.max(1, game.right + game.wrong)),
          bestCombo: game.bestCombo,
          stars: won ? starsFor(game.wrong) : 1,
          review: game.missed[0]?.explanation,
          missedIds: game.missed.map((q) => q.id),
        }
      : null;

  function commit(g: Game, t: Turn | null) {
    gameRef.current = g;
    turnRef.current = t;
    setGame({ ...g, you: [...g.you], bot: [...g.bot] });
    setTurn(t && { ...t });
  }

  /** Scores an answer: right keeps the combo going, wrong shows why. */
  function scoreAnswer(g: Game, ok: boolean, q: GameQuestion): Game {
    const combo = ok ? g.combo + 1 : 0;
    if (ok) soundRef.current?.good(combo);
    else {
      soundRef.current?.bad();
      setExplain({ kind: "bad", title: "Буруу хариулт", text: q.explanation, seconds: 3.5 });
    }
    return {
      ...g,
      combo,
      bestCombo: Math.max(g.bestCombo, combo),
      score: g.score + (ok ? pointsFor(combo) : 0),
      right: g.right + (ok ? 1 : 0),
      wrong: g.wrong + (ok ? 0 : 1),
      missed: ok || g.missed.includes(q) ? g.missed : [...g.missed, q],
    };
  }

  /** The next kick: the player's if both have kicked as often, else the bot's. */
  function nextTurn() {
    const g = gameRef.current;
    if (!g) return;
    if (isOver(g)) {
      soundRef.current?.stopMusic();
      soundRef.current?.round();
      commit(g, null);
      return;
    }
    const side: Side = g.you.length === g.bot.length ? "attack" : "defend";
    const q = g.rounds[g.qi % g.rounds.length];
    const t: Turn = { side, round: makeChoiceRound(q, 4), picked: null, n: g.qi };
    const next = { ...g, qi: g.qi + 1 };
    commit(next, t);
    if (side === "attack") engineRef.current?.attack(t.round.choices);
    else {
      engineRef.current?.defend(DEFEND_SECONDS);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(null), DEFEND_SECONDS * 1000);
    }
  }

  /** Keeping goal: the answer picked in time saves the kick; none (or a wrong one) lets it in. */
  function save(choice: number | null) {
    const g = gameRef.current, t = turnRef.current;
    if (!g || !t || t.side !== "defend" || t.picked !== null) return;
    clearTimeout(timerRef.current);
    const ok = choice === t.round.answer;
    const scored = scoreAnswer(g, ok, t.round.question);
    if (choice === null) setExplain({ kind: "bad", title: "Хугацаа дууслаа!", text: t.round.question.explanation, seconds: 3.5 });
    commit({ ...scored, bot: [...g.bot, !ok] }, { ...t, picked: choice ?? -1 });
    engineRef.current?.shoot(ok);
    soundRef.current?.fx("kick");
    if (ok) setTimeout(() => soundRef.current?.fx("thud"), 450);
  }

  function start() {
    clearTimeout(timerRef.current);
    const g: Game = { rounds: pickRounds(questions, POOL), qi: 0, you: [], bot: [], combo: 0, bestCombo: 0, score: 0, right: 0, wrong: 0, missed: [] };
    gameRef.current = g;
    setExplain(null);
    soundRef.current?.startMusic("penalty");
    engineRef.current?.setCallbacks({
      onKick(zone) {
        const g = gameRef.current!, t = turnRef.current!;
        const ok = zone === t.round.answer;
        soundRef.current?.fx("kick");
        if (ok) setTimeout(() => soundRef.current?.fx("cheer"), 450);
        commit({ ...scoreAnswer(g, ok, t.round.question), you: [...g.you, ok] }, { ...t, picked: zone });
        return t.round.answer;
      },
      onDone: nextTurn,
    });
    nextTurn();
  }

  return {
    canvasRef,
    game,
    turn: finished ? null : turn,
    explain: finished ? null : explain,
    result,
    won,
    goals: { you: game ? goals(game.you) : 0, bot: game ? goals(game.bot) : 0 },
    soundOn,
    start,
    save,
    tick: () => soundRef.current?.tick(),
    toggleSound: () => {
      const sound = soundRef.current;
      if (!sound) return;
      sound.enabled = !sound.enabled;
      setSoundOn(sound.enabled);
    },
  };
}
