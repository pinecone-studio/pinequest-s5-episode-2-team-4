"use client";

import { useEffect, useRef, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import { pointsFor, starsFor, type SessionResult } from "../_lib/session";
import { createSound, type GameSound } from "../_lib/sound";
import { ArenaEngine } from "./arena/ArenaEngine";
import { comboMultiplier, makeCard, makeDeck, POWER, type BattleCard } from "./deck";

const MAX_HP = 100;
const HAND = 3;

type Battle = {
  deck: BattleCard[];
  hand: BattleCard[];
  hp: number;
  combo: number;
  bestCombo: number;
  score: number;
  right: number;
  wrong: number;
  missed: GameQuestion[];
};

/** Fills the hand back to 3 cards, rebuilding the deck when it runs out. */
function deal(b: Battle, questions: GameQuestion[]): Battle {
  const deck = [...b.deck], hand = [...b.hand];
  while (hand.length < HAND) {
    if (!deck.length) deck.push(...makeDeck(questions));
    hand.push(deck.pop()!);
  }
  return { ...b, deck, hand };
}

const fresh = (questions: GameQuestion[]): Battle =>
  deal({ deck: makeDeck(questions), hand: [], hp: MAX_HP, combo: 0, bestCombo: 0, score: 0, right: 0, wrong: 0, missed: [] }, questions);

/** Card battle state: the hand, the open card, the monster's HP, and the arena animation. */
export function useCardBattle(questions: GameQuestion[], petSprite?: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arenaRef = useRef<ArenaEngine | null>(null);
  const soundRef = useRef<GameSound | null>(null);
  const [battle, setBattle] = useState(() => fresh(questions));
  const [open, setOpen] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundRef.current ??= createSound();
    const arena = new ArenaEngine(canvas);
    arena.setPet(petSprite);
    arenaRef.current = arena;
    const observer = new ResizeObserver(() => arena.resize());
    observer.observe(canvas);
    // The battle is on from the start, so the music plays whenever sound is on.
    soundRef.current?.startMusic("cards");
    return () => {
      observer.disconnect();
      arena.destroy();
      arenaRef.current = null;
      soundRef.current?.stopMusic();
    };
  }, [petSprite]);

  const card = open === null ? null : battle.hand[open];

  function choose(choice: number) {
    if (!card || picked !== null) return;
    setPicked(choice);
    const ok = choice === card.answer;
    if (ok) soundRef.current?.good(battle.combo + 1);
    else soundRef.current?.bad();
    setBattle((b) => (ok ? { ...b, combo: b.combo + 1, bestCombo: Math.max(b.bestCombo, b.combo + 1) } : { ...b, combo: 0 }));
  }

  /** Closes the card and plays its throw; a missed card goes back into the deck. */
  async function play() {
    const arena = arenaRef.current;
    if (!card || picked === null || !arena) return;
    const index = open!, ok = picked === card.answer, combo = battle.combo;
    setOpen(null);
    setPicked(null);
    setBusy(true);
    setBattle((b) => ({ ...b, hand: b.hand.filter((_, i) => i !== index) }));
    soundRef.current?.fx("card");
    await arena.throw(card.power, ok);
    soundRef.current?.fx(ok ? "hit" : "thud");
    const damage = ok ? Math.round(POWER[card.power].damage * comboMultiplier(combo)) : 0;
    const hp = Math.max(0, battle.hp - damage), won = hp === 0;
    if (ok) arena.hit(card.power, damage, combo, { rage: hp <= MAX_HP / 2, ko: won });
    const next: Battle = {
      ...battle,
      hand: battle.hand.filter((_, i) => i !== index),
      deck: ok ? battle.deck : [makeCard(card.question, card.power), ...battle.deck],
      hp,
      score: battle.score + (ok ? pointsFor(combo) : 0) + (won ? 25 : 0),
      right: battle.right + (ok ? 1 : 0),
      wrong: battle.wrong + (ok ? 0 : 1),
      missed: ok || battle.missed.includes(card.question) ? battle.missed : [...battle.missed, card.question],
    };
    if (won) {
      soundRef.current?.stopMusic();
      soundRef.current?.round();
      setBattle(next);
      setTimeout(() => setResult(toResult(next)), 1100);
      return;
    }
    setBattle(deal(next, questions));
    setBusy(false);
  }

  return {
    canvasRef, battle, card, picked, busy, result, soundOn, maxHp: MAX_HP,
    openCard: (i: number) => !busy && setOpen(i),
    choose,
    play,
    again: () => {
      soundRef.current?.startMusic("cards");
      arenaRef.current?.reset();
      setBattle(fresh(questions));
      setResult(null);
      setBusy(false);
    },
    toggleSound: () => {
      const sound = soundRef.current;
      if (!sound) return;
      sound.enabled = !sound.enabled;
      setSoundOn(sound.enabled);
    },
  };
}

function toResult(b: Battle): SessionResult {
  return {
    score: b.score,
    accuracy: Math.round((100 * b.right) / Math.max(1, b.right + b.wrong)),
    bestCombo: b.bestCombo,
    stars: starsFor(b.wrong),
    review: b.missed[0]?.explanation,
    missedIds: b.missed.map((q) => q.id),
  };
}
