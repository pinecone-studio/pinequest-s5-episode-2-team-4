"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { Button, ButtonLink } from "@/components/ui";
import { leaveBossBattle, refreshBattle, refreshClassBattle, submitBattleAnswer } from "@/lib/battle-actions";
import { cn } from "@/lib/cn";
import { petStage } from "@/lib/pets";
import { useBattleChannel } from "@/lib/realtime";
import type { BattleAnswerOutcome, BattleState, Boss, EnglishAnswer, PetLine, PetStage, TeamMember } from "@/lib/types";
import { PixelEgg } from "@/app/(student)/pets/PixelEgg";
import { ArenaBackground } from "@/app/(student)/pets/battle/ArenaBackground";
import { RARITY_LABELS } from "@/app/(student)/pets/battle/labels";
import { Backdrop } from "./Backdrop";
import { BattleAudio, type Sfx } from "./audio";
import { Formation, type FormationPet, type PetAnim, type PetFloater } from "./Formation";
import { HpBar } from "./HpBar";
import { QuestionCard } from "./QuestionCard";
import { ShotSprite, type ShotKind } from "./Shot";
import { TeacherPanel } from "./TeacherPanel";
import "./battle.css";

type BattleScreenProps = {
  initial: BattleState;
  boss: Pick<Boss, "id" | "name" | "sprite" | "attack" | "arena">;
  /** My fighting pet; the teacher watching a class battle has none. */
  pet?: PetStage;
  /** For teammates' pets in group battles. */
  lines: PetLine[];
  /** The teacher watches and runs a class battle instead of answering. */
  teacher?: boolean;
};

const isOver = (status: BattleState["status"]) => status === "won" || status === "lost" || status === "ended";

/** Everyone in the battle (solo too) as the formation shows them; my pet is the one fighting. */
function formationPets(state: BattleState, pet: PetStage | undefined, lines: PetLine[]): FormationPet[] {
  return state.team.map((m) => {
    const line = lines.find((l) => l.id === m.lineId);
    return { ...m, stage: m.me && pet ? pet : line ? petStage(line, m.level ?? 1) : null };
  });
}

/** Middle of `el`, in px from the top-left of `box`. */
function centerIn(el: Element, box: Element) {
  const r = el.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
}

/**
 * Fallback refresh. Group battles also refresh on Realtime messages, and
 * every screen refreshes when the next boss attack is due.
 */
const POLL_MS = 3000;
/** How long the end-of-battle animation plays before the result card. */
const END_DELAY_MS = 2600;

// Sound on/off, remembered per browser. useSyncExternalStore keeps the
// server render (always "on") and the browser in step.
const SOUND_KEY = "levelup-battle-sound";
const SOUND_EVENT = "levelup-battle-sound";
const readSound = () => {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
};
const writeSound = (on: boolean) => {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // Private mode: the choice lasts until the page closes.
  }
  window.dispatchEvent(new Event(SOUND_EVENT));
};
const subscribeSound = (onChange: () => void) => {
  window.addEventListener(SOUND_EVENT, onChange);
  return () => window.removeEventListener(SOUND_EVENT, onChange);
};

/** Server time minus device time, so countdowns don't trust the device clock. */
const clockOffset = (state: BattleState) => Date.parse(state.serverNow) - Date.now();

function secondsLeft(iso: string | null, now: number) {
  return iso ? Math.max(0, Math.ceil((Date.parse(iso) - now) / 1000)) : 0;
}

function mmss(total: number) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

type Anim<T extends string> = { name: T | null; id: number };
/** A shot in flight: starts at (x, y) in the arena and travels (dx, dy). */
type Shot = { id: number; kind: ShotKind; x: number; y: number; dx: number; dy: number };
/** Gap between attacks that arrive together, so each one reads. */
const STAGGER_MS = 140;

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "size-5",
} as const;

export function BattleScreen({ initial, boss, pet, lines, teacher = false }: BattleScreenProps) {
  const [state, setState] = useState(initial);
  const [outcome, setOutcome] = useState<BattleAnswerOutcome | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bossFloaters, setBossFloaters] = useState<{ id: number; text: string }[]>([]);
  const [petFloaters, setPetFloaters] = useState<PetFloater[]>([]);
  const [bossAnim, setBossAnim] = useState<Anim<"hit" | "lunge">>({ name: null, id: 0 });
  const [petAnims, setPetAnims] = useState<Record<string, PetAnim>>({});
  const [shots, setShots] = useState<Shot[]>([]);
  const [overVisible, setOverVisible] = useState(isOver(initial.status));
  const [now, setNow] = useState(() => Date.now() + clockOffset(initial));
  const soundOn = useSyncExternalStore(subscribeSound, readSound, () => true);

  const offset = useRef(clockOffset(initial));
  const lastAttack = useRef(initial.attackCount);
  const lastHp = useRef(initial.hp);
  const submittingRef = useRef(false);
  const lastStatus = useRef(initial.status);
  const attemptId = useRef<string | null>(null);
  const floaterId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = useRef<BattleAudio | null>(null);
  const soundOnRef = useRef(soundOn);
  const nextButton = useRef<HTMLButtonElement>(null);
  const exitDialog = useRef<HTMLDialogElement>(null);
  const arenaRef = useRef<HTMLElement>(null);
  const bossRef = useRef<HTMLDivElement>(null);
  const slots = useRef(new Map<string, HTMLElement>());
  const lastTeam = useRef(initial.team);
  const lastServerNow = useRef(Date.parse(initial.serverNow));

  const active = state.status === "active";
  const paused = state.status === "paused";
  // Still going: keep listening (a class lobby only for the teacher's screen).
  const live = active || paused || (teacher && state.status === "lobby");
  const me = state.team.find((m) => m.me);
  const myName = me?.username ?? "";

  /** A pet's attack looks like its element. */
  const shotKind = useCallback(
    (m: TeamMember | undefined): ShotKind => lines.find((l) => l.id === m?.lineId)?.element ?? "metal",
    [lines],
  );

  const later = useCallback((ms: number, run: () => void) => {
    timers.current.push(setTimeout(run, ms));
  }, []);

  const play = useCallback((name: Sfx) => {
    if (soundOnRef.current) audio.current?.play(name);
  }, []);

  /** A damage number over the boss, or over one player's pet. */
  const float = useCallback(
    (text: string, target: { pet: string } | "boss") => {
      const id = ++floaterId.current;
      if (target === "boss") {
        setBossFloaters((f) => [...f, { id, text }]);
        later(1100, () => setBossFloaters((f) => f.filter((x) => x.id !== id)));
      } else {
        setPetFloaters((f) => [...f, { id, text, username: target.pet }]);
        later(1100, () => setPetFloaters((f) => f.filter((x) => x.id !== id)));
      }
    },
    [later],
  );

  const animatePets = useCallback((usernames: string[], name: PetAnim["name"]) => {
    setPetAnims((all) => {
      const next = { ...all };
      for (const u of usernames) next[u] = { name, id: (all[u]?.id ?? 0) + 1 };
      return next;
    });
  }, []);

  /** A shot between a pet's spot in the formation and the boss, either way. */
  const fly = useCallback(
    (username: string, kind: ShotKind) => {
      const arena = arenaRef.current;
      const pet = slots.current.get(username);
      if (!arena || !pet || !bossRef.current) return;
      const petAt = centerIn(pet, arena);
      const bossAt = centerIn(bossRef.current, arena);
      const [from, to] = kind === "boss" ? [bossAt, petAt] : [petAt, bossAt];
      const id = ++floaterId.current;
      setShots((s) => [...s, { id, kind, x: from.x, y: from.y, dx: to.x - from.x, dy: to.y - from.y }]);
      later(500, () => setShots((s) => s.filter((x) => x.id !== id)));
    },
    [later],
  );

  /** One pet attacks: it leaps, its shot flies up, the boss takes the hit. */
  const attack = useCallback(
    (username: string, kind: ShotKind, damage: number, delay: number, sound: boolean) => {
      later(delay, () => {
        if (sound) play("swing");
        animatePets([username], "dash");
      });
      later(delay + 150, () => fly(username, kind));
      later(delay + 520, () => {
        if (sound) play("hit");
        setBossAnim((a) => ({ name: "hit", id: a.id + 1 }));
        float(`−${damage}`, "boss");
      });
    },
    [animatePets, float, fly, later, play],
  );

  /** The boss attacks: it lunges, shots fly down to each pet, each pet takes its damage. */
  const bossAttack = useCallback(
    (targets: { username: string; damage: number }[]) => {
      play("roar");
      setBossAnim((a) => ({ name: "lunge", id: a.id + 1 }));
      later(180, () => targets.forEach((t) => fly(t.username, "boss")));
      later(600, () => {
        play("impact");
        animatePets(targets.map((t) => t.username), "hurt");
        targets.forEach((t) => float(`−${t.damage}`, { pet: t.username }));
      });
    },
    [animatePets, float, fly, later, play],
  );

  const registerSlot = useCallback((username: string, el: HTMLElement | null) => {
    if (el) slots.current.set(username, el);
    else slots.current.delete(username);
  }, []);

  /**
   * Takes a new state from the server and plays what happened in it, pet by
   * pet: teammates' hits and misses, and boss attacks. `mine` is the state
   * from my own answer, whose hit or miss already has its own animation.
   */
  const apply = useCallback(
    (next: BattleState, mine = false) => {
      // A refresh sent before my answer can arrive after it: skip older states.
      const at = Date.parse(next.serverNow);
      if (at < lastServerNow.current) return;
      lastServerNow.current = at;
      offset.current = clockOffset(next);
      const before = new Map(lastTeam.current.map((m) => [m.username, m]));

      // Right answers: each pet attacks from its own spot.
      const hitters = next.team.filter((m) => {
        const was = before.get(m.username);
        return was && m.damage > was.damage && !(mine && m.me);
      });
      hitters.forEach((m, i) => attack(m.username, shotKind(m), m.damage - before.get(m.username)!.damage, i * STAGGER_MS, i === 0));
      if (!mine && hitters.length === 0 && next.hp < lastHp.current) {
        play("hit");
        setBossAnim((a) => ({ name: "hit", id: a.id + 1 }));
        float(`−${lastHp.current - next.hp}`, "boss");
      }
      lastHp.current = next.hp;

      const attacks = next.attackCount - lastAttack.current;
      if (attacks > 0) {
        lastAttack.current = next.attackCount;
        // Every pet that was still standing takes the hit.
        const targets = next.team
          .filter((m) => !m.left && (before.get(m.username)?.petHp ?? m.petHp) > 0)
          .map((m) => ({
            username: m.username,
            damage: Math.min(next.attackDamage * attacks, before.get(m.username)?.petHp ?? next.attackDamage),
          }));
        bossAttack(targets);
      } else {
        // Wrong answers: that pet takes the hit.
        const missed = next.team.filter((m) => {
          const was = before.get(m.username);
          return was && !m.me && !m.left && m.petHp < was.petHp;
        });
        if (missed.length > 0) {
          animatePets(missed.map((m) => m.username), "hurt");
          missed.forEach((m) => float(`−${before.get(m.username)!.petHp - m.petHp}`, { pet: m.username }));
        }
      }
      lastTeam.current = next.team;
      setState(next);
    },
    [animatePets, attack, bossAttack, float, play, shotKind],
  );

  useEffect(() => {
    soundOnRef.current = soundOn;
    audio.current?.setMuted(!soundOn);
  }, [soundOn]);

  // Music starts with the first tap or key press (browsers block autoplay).
  useEffect(() => {
    if (!active) return;
    const start = () => {
      if (!soundOnRef.current) return;
      audio.current ??= BattleAudio.forArena(boss.arena);
      void audio.current.startMusic();
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, [active, boss.arena]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      audio.current?.close();
    };
  }, []);

  // Clock for countdowns.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offset.current), 250);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    // My answer's response brings the new state; don't race it.
    if (submittingRef.current) return;
    try {
      const next = await (teacher ? refreshClassBattle : refreshBattle)(initial.id);
      if (next && !submittingRef.current) apply(next);
    } catch {
      // Offline for a moment; the next refresh tries again.
    }
  }, [initial.id, apply, teacher]);

  // Teammates' answers, joins and leaves arrive as Realtime messages.
  useBattleChannel(initial.id, refresh);

  // Fallback polling, so attacks and the time limit show up regardless.
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [live, refresh]);

  // Refresh right when the next boss attack is due.
  useEffect(() => {
    if (!active || !state.nextAttackAt) return;
    const wait = Date.parse(state.nextAttackAt) - (Date.now() + offset.current) + 300;
    const timer = setTimeout(refresh, Math.max(0, wait));
    return () => clearTimeout(timer);
  }, [active, state.nextAttackAt, refresh]);

  // End of battle: tune, animation, then the result card.
  useEffect(() => {
    if (!isOver(lastStatus.current) && isOver(state.status)) {
      if (state.status !== "ended") play(state.status === "won" ? "victory" : "defeat");
      later(END_DELAY_MS, () => setOverVisible(true));
    }
    lastStatus.current = state.status;
  }, [state.status, play, later]);

  const attackIn = secondsLeft(state.nextAttackAt, now);
  const warning = active && state.nextAttackAt !== null && attackIn <= boss.attack.warningSec;

  // A short beep when the warning starts.
  const warned = useRef(false);
  useEffect(() => {
    if (warning && !warned.current) play("warn");
    warned.current = warning;
  }, [warning, play]);

  useEffect(() => {
    if (outcome) nextButton.current?.focus();
  }, [outcome]);

  function toggleSound() {
    const on = !soundOn;
    writeSound(on);
    if (on && active) {
      audio.current ??= BattleAudio.forArena(boss.arena);
      audio.current.setMuted(false);
      void audio.current.startMusic();
    }
  }

  async function answer(value: EnglishAnswer) {
    const questionId = state.question?.id;
    if (submitting || !questionId) return;
    setSubmitting(true);
    submittingRef.current = true;
    setError(null);
    // Same id on a retry after a network error, so it can't count twice.
    attemptId.current ??= crypto.randomUUID();
    try {
      const res = await submitBattleAnswer(state.id, boss.id, questionId, attemptId.current, value);
      attemptId.current = null;
      if (res.outcome) {
        const o = res.outcome;
        setOutcome(o);
        if (o.correct) {
          attack(myName, shotKind(me), o.damage, 0, true);
        } else {
          play("wrong");
          animatePets([myName], "hurt");
          float(`−${o.petDamage}`, { pet: myName });
        }
      } else if (res.error === "fainted") {
        setError("Тэжээвэр чинь ухаан алдсан байна.");
      }
      if (res.state) apply(res.state, true);
    } catch {
      setError("Холболт тасарлаа. Дахин оролдоно уу.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const pets = formationPets(state, pet, lines);

  if (overVisible && !outcome) {
    return (
      <>
        <Backdrop arena={boss.arena} />
        <BattleOver state={state} boss={boss} pets={pets} teacher={teacher} />
      </>
    );
  }

  const won = state.status === "won";
  const fainted = !teacher && state.me.petHp === 0;
  // Paused: the clock stands still where the teacher stopped it.
  const timeLeft = secondsLeft(state.deadlineAt, paused && state.pausedAt ? Date.parse(state.pausedAt) : now);

  return (
    <>
      <Backdrop arena={boss.arena} />
      {/* One vertical arena for every battle: boss on top, the challenge in
          the middle, every player's pet at the bottom facing the boss. */}
      <div className="isolate mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3 px-4 pt-3 pb-2 md:gap-4 md:px-6 md:pt-5">
        <section
          ref={arenaRef}
          aria-label={`${boss.name}-тай тулалдаж байна`}
          className="relative flex flex-1 flex-col gap-2 md:gap-4"
        >
          {/* Top: exit, the boss's shared HP and the clocks, sound */}
          <div className="flex items-center gap-2 md:gap-3">
            {teacher ? (
              <Link
                href="/teacher"
                aria-label="Багшийн самбар"
                className="flex size-12 shrink-0 items-center justify-center gap-2 rounded-full bg-surface font-bold text-ink no-underline hover:text-ink md:w-auto md:px-5"
              >
                <svg {...iconProps}>
                  <path d="m15 18-6-6 6-6" />
                </svg>
                <span aria-hidden="true" className="hidden md:inline">
                  Самбар
                </span>
              </Link>
            ) : active || paused ? (
              <button
                type="button"
                onClick={() => exitDialog.current?.showModal()}
                aria-label="Гарах"
                className="flex size-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-surface font-bold text-ink md:w-auto md:px-5"
              >
                <svg {...iconProps}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="m16 17 5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                <span aria-hidden="true" className="hidden md:inline">
                  Гарах
                </span>
              </button>
            ) : (
              <span className="size-12 shrink-0" />
            )}
            <div className="mx-auto w-full max-w-xl min-w-0 rounded-tile bg-white/90 px-3 py-1.5 md:px-4 md:py-2.5">
              <div className="mb-1 flex items-center gap-1.5 md:gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-bold md:text-lg">{boss.name}</p>
                {paused ? (
                  <p className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white md:text-sm">
                    Түр зогссон
                  </p>
                ) : null}
                {active || paused ? (
                  <p
                    aria-label={`${mmss(timeLeft)} үлдсэн`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-bold tabular-nums md:text-sm"
                  >
                    <svg {...iconProps} className="size-3.5">
                      <circle cx="12" cy="13" r="8" />
                      <path d="M12 9v4l2.5 2.5M9 2h6" />
                    </svg>
                    {mmss(timeLeft)}
                  </p>
                ) : null}
                {active && state.nextAttackAt ? (
                  <p
                    aria-label={`Босс ${attackIn} секундын дараа довтолно`}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums md:text-sm",
                      warning ? "bg-magenta text-white" : "bg-surface text-ink",
                    )}
                  >
                    <svg {...iconProps} className="size-3.5">
                      <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" />
                    </svg>
                    <span className="hidden md:inline">Довтолгоо</span> {attackIn}с
                  </p>
                ) : null}
              </div>
              <HpBar value={state.hp} max={state.maxHp} label={`${boss.name} HP`} tone="boss" />
            </div>
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label="Дуу ба хөгжим"
              className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-ink"
            >
              <svg {...iconProps}>
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                {soundOn ? (
                  <>
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                    <path d="M19 5a10 10 0 0 1 0 14" />
                  </>
                ) : (
                  <path d="m22 9-6 6M16 9l6 6" />
                )}
              </svg>
            </button>
          </div>

          {/* The boss: as big as the height the question and pets leave (the
              absolute layer gives the box a definite height to fill) */}
          <div className={cn("relative flex-1", pets.length > 16 ? "min-h-32" : "min-h-40 md:min-h-52")}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div ref={bossRef} className="relative aspect-square h-full max-h-72 md:max-h-96">
                <div aria-hidden="true" className="absolute -bottom-1 left-1/2 h-[10%] w-3/4 -translate-x-1/2 rounded-[50%] bg-black/35" />
                <div className={cn("size-full", warning && "arena-windup")}>
                  <div className={cn("size-full", active && "arena-boss-idle")}>
                    <div
                      key={bossAnim.id}
                      className={cn(
                        "arena-actor relative size-full",
                        bossAnim.name === "hit" && "arena-hit",
                        bossAnim.name === "lunge" && "arena-lunge",
                        won && "arena-defeated",
                      )}
                    >
                      <PetSprite stage={{ name: boss.name, sprite: boss.sprite }} size={208} className="size-full!" />
                    </div>
                  </div>
                </div>
                {bossFloaters.map((f) => (
                  <span
                    key={f.id}
                    aria-hidden="true"
                    className="arena-float absolute top-1/4 left-1/2 text-3xl font-bold text-white [-webkit-text-stroke:1.5px_var(--color-magenta)] md:text-4xl"
                  >
                    {f.text}
                  </span>
                ))}
                {warning ? (
                  <p
                    aria-hidden="true"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-magenta px-4 py-1.5 text-sm font-bold whitespace-nowrap text-white md:text-base"
                  >
                    Довтолгоо · {attackIn}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Middle: the English challenge and what my answer did */}
          <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-2">
            {teacher ? (
              isOver(state.status) ? null : <TeacherPanel state={state} onChanged={refresh} />
            ) : outcome ? (
              <section
                role="status"
                className={cn(
                  "flex flex-col gap-3 rounded-card p-4 shadow-float md:flex-row md:items-center md:p-5",
                  outcome.correct ? "bg-sky" : "border-2 border-magenta bg-pink",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold md:text-xl">
                    {outcome.correct
                      ? `Зөв! Босс −${outcome.damage} HP${outcome.combo >= 2 ? ` · Комбо ×${outcome.combo}` : ""}`
                      : `Буруу. Тэжээвэр −${outcome.petDamage} HP`}
                  </p>
                  {outcome.correct ? null : (
                    <p className="mt-1 font-bold">
                      Зөв хариулт: <span lang="en">{outcome.expected}</span>
                    </p>
                  )}
                  <p lang="en" className="mt-1 text-sm">
                    {outcome.explanation}
                  </p>
                </div>
                <Button ref={nextButton} size="sm" className="w-full shrink-0 md:w-auto" onClick={() => setOutcome(null)}>
                  {active ? "Дараагийн асуулт" : "Үр дүнг харах"}
                </Button>
              </section>
            ) : paused ? (
              <p role="status" className="rounded-card bg-white px-5 py-4 text-center font-bold shadow-float">
                Багш тулааныг түр зогсоолоо. Удахгүй үргэлжилнэ.
              </p>
            ) : fainted && active ? (
              <p role="status" className="rounded-card bg-pink px-5 py-4 text-center font-bold shadow-float">
                Тэжээвэр чинь ухаан алдлаа. Багийнхан чинь үргэлжлүүлж байна.
              </p>
            ) : active && state.question ? (
              <QuestionCard
                key={state.question.id}
                question={state.question}
                disabled={submitting}
                checking={submitting}
                onAnswer={answer}
                onListen={() => audio.current?.duck(4)}
              />
            ) : null}

            {error ? (
              <p role="alert" className="rounded-tile border-2 border-magenta bg-pink px-4 py-3 font-semibold">
                {error}
              </p>
            ) : null}
          </div>

          {/* Bottom: every player's pet */}
          <Formation
            pets={pets}
            combo={state.me.combo}
            anims={petAnims}
            floaters={petFloaters}
            celebrate={won}
            registerSlot={registerSlot}
          />

          {/* Shots in flight, above everything */}
          {shots.map((shot) => (
            <span
              key={shot.id}
              aria-hidden="true"
              data-shot={shot.kind}
              className="pointer-events-none absolute z-30"
              style={{ left: shot.x, top: shot.y }}
            >
              <ShotSprite kind={shot.kind} style={{ "--dx": `${shot.dx}px`, "--dy": `${shot.dy}px` } as CSSProperties} />
            </span>
          ))}
        </section>

        <p role="status" className="sr-only">
          {warning ? `Босс ${attackIn} секундын дараа довтолно` : ""}
        </p>

        <dialog
          ref={exitDialog}
          aria-labelledby="exit-title"
          className="fixed inset-0 m-auto h-fit w-[min(420px,calc(100%-32px))] rounded-panel bg-white p-6 text-ink shadow-float backdrop:bg-ink/40 md:p-8"
        >
          <h2 id="exit-title" className="text-xl leading-tight font-bold md:text-2xl">
            Тулаанаас гарах уу?
          </h2>
          <p className="mt-2 text-ink-muted">
            {state.mode === "solo"
              ? "Тулаан дуусч, ялалт тооцогдохгүй."
              : "Тэжээвэр чинь тулаанаас гарч, шагнал авахгүй. Багийнхан үргэлжлүүлнэ."}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
            <Button variant="secondary" size="sm" autoFocus onClick={() => exitDialog.current?.close()}>
              Үргэлжлүүлэх
            </Button>
            <form action={leaveBossBattle.bind(null, state.id)}>
              <Button type="submit" size="sm" className="w-full">
                Гарах
              </Button>
            </form>
          </div>
        </dialog>
      </div>
    </>
  );
}

const END_MESSAGES: Record<NonNullable<BattleState["endReason"]>, { title: string; text: string }> = {
  won: { title: "Ялалт!", text: "Боссыг ялсан!" },
  fainted: { title: "Ялагдлаа", text: "Тэжээвэр чинь ухаан алдлаа. Дасгалаа давтаад дахин оролдоорой!" },
  timeout: { title: "Хугацаа дууслаа", text: "Энэ удаа амжсангүй. Дахин оролдоод улам сайжраарай!" },
  left: { title: "Тулаанаас гарсан", text: "Хүссэн үедээ дахин тулалдаж болно." },
  stopped: { title: "Тулаан дууслаа", text: "Багш тулааныг дуусгалаа." },
};

/** What the teacher reads at the end of a class battle. */
const CLASS_END_MESSAGES: Record<NonNullable<BattleState["endReason"]>, { title: string; text: string }> = {
  won: { title: "Анги ялсан!", text: "Сурагчид хамтдаа боссыг ялсан." },
  fainted: { title: "Ялагдлаа", text: "Бүх тэжээвэр ухаан алдлаа." },
  timeout: { title: "Хугацаа дууслаа", text: "Энэ удаа амжсангүй." },
  left: { title: "Тулаан дууслаа", text: "" },
  stopped: { title: "Тулаан дууслаа", text: "Та тулааныг дуусгасан." },
};

function BattleOver({
  state,
  boss,
  pets,
  teacher,
}: {
  state: BattleState;
  boss: BattleScreenProps["boss"];
  pets: FormationPet[];
  teacher: boolean;
}) {
  const won = state.status === "won";
  const message = (teacher ? CLASS_END_MESSAGES : END_MESSAGES)[state.endReason ?? "left"];
  // The teacher sees the class's numbers; a student sees their own.
  const stats: [string, number][] = teacher
    ? [
        ["Нийт хохирол", state.team.reduce((sum, m) => sum + m.damage, 0)],
        ["Оролцсон", state.team.length],
        ["Зөв хариулт", state.team.reduce((sum, m) => sum + m.correct, 0)],
      ]
    : [
        ["Нийт хохирол", state.me.damageDealt],
        ["Зөв", state.me.correct],
        ["Буруу", state.me.wrong],
        ["Шилдэг комбо", state.me.bestCombo],
      ];
  return (
    <section
      aria-labelledby="result-title"
      className="relative mx-auto mt-6 flex max-w-xl flex-col items-center gap-5 overflow-hidden rounded-panel bg-white px-6 py-8 text-center shadow-float md:mt-10 md:px-10"
    >
      <ArenaBackground arena={boss.arena} className="absolute inset-x-0 top-0 h-40 w-full opacity-90" />
      <div className="relative mt-8 rounded-card bg-white/80 p-2">
        <PetSprite
          stage={{ name: boss.name, sprite: boss.sprite }}
          size={128}
          className={won ? "opacity-40 grayscale" : ""}
        />
      </div>
      <h1 id="result-title" className="text-[40px] leading-none font-bold">
        {message.title}
      </h1>
      <p className="text-ink-muted">{message.text}</p>
      {/* The whole team, cheering if the boss is down */}
      <Formation pets={pets} celebrate={won} maxSize={64} onCard className="w-full" />
      {state.rewards ? (
        <div role="status" className="arena-reward flex w-full flex-col items-center gap-3 rounded-card bg-surface p-4">
          <p className="text-lg font-bold">Шагнал</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 font-bold text-white">+{state.rewards.exp} EXP</span>
            <span className="rounded-full bg-sky px-3 py-1 font-bold">Тэжээвэр +{state.rewards.petExp} EXP</span>
          </div>
          {state.rewards.egg ? (
            <div className="flex items-center gap-3">
              <PixelEgg rarity={state.rewards.egg.rarity} size={48} className="arena-egg-bob" />
              <div className="text-left">
                <p className="font-bold">Өндөг олдлоо!</p>
                <p className="text-sm text-ink-muted">
                  {RARITY_LABELS[state.rewards.egg.rarity]} · Тэжээвэр хэсгээс хагалаарай
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Энэ удаа өндөг олдсонгүй.</p>
          )}
        </div>
      ) : null}
      {state.mode !== "solo" ? (
        <div className="w-full text-left">
          <h2 className="mb-2 font-bold">Хэн хэр хохирол учруулсан</h2>
          <ol className="flex flex-col gap-1.5">
            {[...state.team]
              .sort((a, b) => b.damage - a.damage)
              .map((m) => (
                <li key={m.username} className="flex justify-between rounded-tile bg-surface px-3 py-2 text-sm">
                  <span className="font-bold">
                    {m.username}
                    {m.me ? " (чи)" : ""}
                    {m.left ? " · гарсан" : ""}
                  </span>
                  <span>
                    −{m.damage} · {m.correct} зөв
                  </span>
                </li>
              ))}
          </ol>
        </div>
      ) : null}
      <dl className={cn("grid w-full gap-2 text-sm", teacher ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4")}>
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-tile bg-surface px-2 py-3">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      {teacher ? (
        <ButtonLink href="/teacher">Багшийн самбар руу</ButtonLink>
      ) : (
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <ButtonLink href="/pets/battle">Боссууд руу буцах</ButtonLink>
          {state.rewards?.egg ? (
            <ButtonLink href="/pets/eggs" variant="secondary">
              Өндөг хагалах
            </ButtonLink>
          ) : null}
          <ButtonLink href="/pets/progress" variant="secondary">
            Ахицаа харах
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
