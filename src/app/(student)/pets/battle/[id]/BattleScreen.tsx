"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { Button, ButtonLink } from "@/components/ui";
import { leaveBossBattle, refreshBattle, submitBattleAnswer } from "@/lib/battle-actions";
import { cn } from "@/lib/cn";
import { petStage } from "@/lib/pets";
import { useBattleChannel } from "@/lib/realtime";
import type {
  BattleAnswerOutcome,
  BattleState,
  Boss,
  EnglishAnswer,
  PetLine,
  PetStage,
  TeamMember,
} from "@/lib/types";
import { PixelEgg } from "../../PixelEgg";
import { ArenaBackground } from "../ArenaBackground";
import { Backdrop } from "./Backdrop";
import { RARITY_LABELS } from "../labels";
import { BattleAudio, type Sfx } from "./audio";
import { HpBar } from "./HpBar";
import { QuestionCard } from "./QuestionCard";
import "./battle.css";

type BattleScreenProps = {
  initial: BattleState;
  boss: Pick<Boss, "id" | "name" | "sprite" | "attack" | "arena">;
  pet: PetStage;
  /** For teammates' pets in group battles. */
  lines: PetLine[];
};

/**
 * Fallback refresh. Group battles also refresh on Realtime messages, and
 * every screen refreshes when the next boss attack is due.
 */
const POLL_MS = 3000;
/** How long the end-of-battle animation plays before the result card. */
const END_DELAY_MS = 1800;

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

type Floater = { id: number; text: string; target: "boss" | "pet" };
type Anim<T extends string> = { name: T | null; id: number };

const STAR_PATH = "M3 0h1v2h-1zM2 2h3v1h-3zM0 3h7v1h-7zM2 4h3v1h-3zM3 5h1v2h-1z";

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

export function BattleScreen({ initial, boss, pet, lines }: BattleScreenProps) {
  const [state, setState] = useState(initial);
  const [outcome, setOutcome] = useState<BattleAnswerOutcome | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [bossAnim, setBossAnim] = useState<Anim<"hit" | "lunge">>({ name: null, id: 0 });
  const [petAnim, setPetAnim] = useState<Anim<"dash" | "hurt">>({ name: null, id: 0 });
  const [starId, setStarId] = useState(0);
  const [overVisible, setOverVisible] = useState(initial.status !== "active");
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

  const active = state.status === "active";

  const later = useCallback((ms: number, run: () => void) => {
    timers.current.push(setTimeout(run, ms));
  }, []);

  const play = useCallback((name: Sfx) => {
    if (soundOnRef.current) audio.current?.play(name);
  }, []);

  const float = useCallback(
    (text: string, target: Floater["target"]) => {
      const id = ++floaterId.current;
      setFloaters((f) => [...f, { id, text, target }]);
      later(1100, () => setFloaters((f) => f.filter((x) => x.id !== id)));
    },
    [later],
  );

  /**
   * Takes a new state from the server and plays what happened in it: boss
   * attacks, and (in group battles) teammates' hits. `mine` is the state
   * from my own answer, whose hit already has its own animation.
   */
  const apply = useCallback(
    (next: BattleState, mine = false) => {
      offset.current = clockOffset(next);
      if (!mine && next.hp < lastHp.current) {
        play("hit");
        setBossAnim((a) => ({ name: "hit", id: a.id + 1 }));
        float(`−${lastHp.current - next.hp}`, "boss");
      }
      lastHp.current = next.hp;
      if (next.attackCount > lastAttack.current) {
        lastAttack.current = next.attackCount;
        play("roar");
        setBossAnim((a) => ({ name: "lunge", id: a.id + 1 }));
        later(300, () => {
          play("impact");
          setPetAnim((a) => ({ name: "hurt", id: a.id + 1 }));
          float(`−${next.attackDamage}`, "pet");
        });
      }
      setState(next);
    },
    [float, later, play],
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
      const next = await refreshBattle(initial.id);
      if (next && !submittingRef.current) apply(next);
    } catch {
      // Offline for a moment; the next refresh tries again.
    }
  }, [initial.id, apply]);

  // Teammates' answers, joins and leaves arrive as Realtime messages.
  useBattleChannel(initial.id, refresh);

  // Fallback polling, so attacks and the time limit show up regardless.
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [active, refresh]);

  // Refresh right when the next boss attack is due.
  useEffect(() => {
    if (!active || !state.nextAttackAt) return;
    const wait = Date.parse(state.nextAttackAt) - (Date.now() + offset.current) + 300;
    const timer = setTimeout(refresh, Math.max(0, wait));
    return () => clearTimeout(timer);
  }, [active, state.nextAttackAt, refresh]);

  // End of battle: tune, animation, then the result card.
  useEffect(() => {
    if (lastStatus.current === "active" && state.status !== "active") {
      play(state.status === "won" ? "victory" : "defeat");
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
          play("swing");
          setPetAnim((a) => ({ name: "dash", id: a.id + 1 }));
          later(150, () => setStarId((n) => n + 1));
          later(520, () => {
            play("hit");
            setBossAnim((a) => ({ name: "hit", id: a.id + 1 }));
            float(`−${o.damage}`, "boss");
          });
        } else {
          play("wrong");
          setPetAnim((a) => ({ name: "hurt", id: a.id + 1 }));
          float(`−${o.petDamage}`, "pet");
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

  if (overVisible && !outcome) {
    return (
      <>
        <Backdrop arena={boss.arena} />
        <BattleOver state={state} boss={boss} />
      </>
    );
  }

  const won = state.status === "won";
  const fainted = state.me.petHp === 0;
  const timeLeft = secondsLeft(state.deadlineAt, now);

  return (
    <>
      <Backdrop arena={boss.arena} />
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pt-2 md:gap-5 md:px-6">
        <div className="flex items-center justify-between gap-3">
          {active ? (
            <Button variant="secondary" size="sm" onClick={() => exitDialog.current?.showModal()}>
              <svg {...iconProps}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Гарах
            </Button>
          ) : (
            <span />
          )}
          {active ? (
            <p
              aria-label={`${mmss(timeLeft)} үлдсэн`}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 font-bold tabular-nums"
            >
              <svg {...iconProps} className="size-4">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2.5 2.5M9 2h6" />
              </svg>
              {mmss(timeLeft)}
            </p>
          ) : null}
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label="Дуу ба хөгжим"
            className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-surface text-ink"
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

        {/* Arena: boss on the left, pet on the right, like a side-view RPG */}
        <section
          aria-label={`${boss.name}-тай тулалдаж байна`}
          className="relative aspect-[4/3] overflow-hidden rounded-[25px] bg-ink shadow-float ring-4 ring-white/70 md:aspect-[16/9] md:rounded-panel"
        >
          <ArenaBackground arena={boss.arena} className="absolute inset-0 size-full" />

          <div className="absolute inset-x-2 top-2 grid grid-cols-2 gap-2 md:inset-x-4 md:top-4 md:gap-4">
            <div className="rounded-tile bg-white/90 p-2 md:p-3">
              <p className="mb-1 truncate text-sm font-bold md:text-lg">{boss.name}</p>
              <HpBar value={state.hp} max={state.maxHp} label={`${boss.name} HP`} tone="boss" />
            </div>
            <div className="rounded-tile bg-white/90 p-2 md:p-3">
              <p className="mb-1 flex items-center justify-between gap-1 text-sm font-bold md:text-lg">
                <span className="truncate">{pet.name}</span>
                {state.me.combo >= 2 ? (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] text-white md:text-xs">
                    Комбо ×{state.me.combo}
                  </span>
                ) : null}
              </p>
              <HpBar value={state.me.petHp} max={state.me.petMaxHp} label={`${pet.name} HP`} tone="pet" />
            </div>
          </div>

          {warning ? (
            <p
              aria-hidden="true"
              className="absolute top-[40%] left-1/2 -translate-x-1/2 rounded-full bg-magenta px-4 py-1.5 text-sm font-bold whitespace-nowrap text-white md:text-base"
            >
              Довтолгоо · {attackIn}
            </p>
          ) : null}

          {/* Boss */}
          <div className="absolute bottom-[7%] left-[5%] md:left-[10%]">
            <div aria-hidden="true" className="absolute -bottom-1 left-1/2 h-3 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/30" />
            <div className={cn(warning && "arena-windup")}>
              <div
                key={bossAnim.id}
                className={cn(
                  "arena-actor relative",
                  bossAnim.name === "hit" && "arena-hit",
                  bossAnim.name === "lunge" && "arena-lunge",
                  won && "arena-defeated",
                )}
              >
                <PetSprite stage={{ name: boss.name, sprite: boss.sprite }} size={128} className="md:hidden" />
                <PetSprite stage={{ name: boss.name, sprite: boss.sprite }} size={208} className="hidden md:block" />
              </div>
            </div>
          </div>

          {/* Pet */}
          <div className="absolute right-[8%] bottom-[7%] md:right-[14%]">
            <div aria-hidden="true" className="absolute -bottom-1 left-1/2 h-2.5 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/30" />
            <div
              key={petAnim.id}
              className={cn(
                "arena-actor relative",
                petAnim.name === "dash" && "arena-dash",
                petAnim.name === "hurt" && "arena-hurt",
                fainted && "arena-fainted",
              )}
            >
              <PetSprite stage={pet} size={80} className="md:hidden" />
              <PetSprite stage={pet} size={128} className="hidden md:block" />
            </div>
          </div>

          {/* The star the pet throws */}
          {starId > 0 ? (
            <svg
              key={starId}
              viewBox="0 0 7 7"
              shapeRendering="crispEdges"
              aria-hidden="true"
              className="arena-star absolute bottom-[24%] size-6 fill-[#ffd166] md:size-9"
            >
              <path d={STAR_PATH} />
            </svg>
          ) : null}

          {floaters.map((f) => (
            <span
              key={f.id}
              aria-hidden="true"
              className={cn(
                "arena-float absolute bottom-[42%] text-2xl font-bold text-white [-webkit-text-stroke:1.5px_var(--color-magenta)] md:text-4xl",
                f.target === "boss" ? "left-[22%] md:left-[24%]" : "left-[80%] md:left-[76%]",
              )}
            >
              {f.text}
            </span>
          ))}
        </section>

        <p role="status" className="sr-only">
          {warning ? `Босс ${attackIn} секундын дараа довтолно` : ""}
        </p>

        {state.mode !== "solo" ? <TeamPanel team={state.team} lines={lines} /> : null}

        {fainted && active ? (
          <p role="status" className="rounded-card bg-pink px-5 py-4 text-center font-bold">
            Тэжээвэр чинь ухаан алдлаа. Багийнхан чинь үргэлжлүүлж байна.
          </p>
        ) : null}

        {/* Answer feedback, then the next question */}
        {outcome ? (
          <section
            role="status"
            className={cn(
              "rounded-[25px] p-5 md:rounded-panel md:p-6",
              outcome.correct ? "bg-sky" : "border-2 border-magenta bg-pink",
            )}
          >
            <p className="text-xl font-bold md:text-2xl">
              {outcome.correct
                ? `Зөв! Босс −${outcome.damage} HP${outcome.combo >= 2 ? ` · Комбо ×${outcome.combo}` : ""}`
                : `Буруу. Тэжээвэр −${outcome.petDamage} HP`}
            </p>
            {outcome.correct ? null : (
              <p className="mt-2 font-bold">
                Зөв хариулт: <span lang="en">{outcome.expected}</span>
              </p>
            )}
            <p lang="en" className="mt-2">
              {outcome.explanation}
            </p>
            <Button ref={nextButton} className="mt-4 w-full md:w-auto" onClick={() => setOutcome(null)}>
              {active ? "Дараагийн асуулт" : "Үр дүнг харах"}
            </Button>
          </section>
        ) : active && state.question ? (
          <QuestionCard
            key={state.question.id}
            question={state.question}
            disabled={submitting || fainted}
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

/** Everyone in a group battle: pet, HP and damage so far. */
function TeamPanel({ team, lines }: { team: TeamMember[]; lines: PetLine[] }) {
  const total = team.reduce((sum, m) => sum + m.damage, 0);
  return (
    <section aria-labelledby="team-title" className="rounded-[25px] bg-white p-4 shadow-card md:rounded-panel md:p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="team-title" className="text-lg font-bold">
          Баг
        </h2>
        <p className="text-sm text-ink-muted">Нийт хохирол {total}</p>
      </div>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {team.map((m) => {
          const line = lines.find((l) => l.id === m.lineId);
          const out = m.left || m.petHp === 0;
          return (
            <li key={m.username} className={cn("flex items-center gap-3 rounded-tile bg-surface p-2", out && "opacity-60")}>
              {line ? (
                <PetSprite stage={petStage(line, m.level ?? 1)} size={40} className={out ? "grayscale" : undefined} />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {m.username}
                  {m.me ? <span className="text-ink-muted"> (чи)</span> : null}
                  {m.left ? <span className="text-ink-muted"> · гарсан</span> : null}
                </p>
                <HpBar value={m.petHp} max={m.petMaxHp} label={`${m.username}-ын тэжээвэр HP`} tone="pet" className="mt-1" />
              </div>
              <p className="shrink-0 text-sm font-bold" aria-label={`${m.damage} хохирол`}>
                −{m.damage}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const END_MESSAGES: Record<NonNullable<BattleState["endReason"]>, { title: string; text: string }> = {
  won: { title: "Ялалт!", text: "Боссыг ялсан!" },
  fainted: { title: "Ялагдлаа", text: "Тэжээвэр чинь ухаан алдлаа. Дасгалаа давтаад дахин оролдоорой!" },
  timeout: { title: "Хугацаа дууслаа", text: "Энэ удаа амжсангүй. Дахин оролдоод улам сайжраарай!" },
  left: { title: "Тулаанаас гарсан", text: "Хүссэн үедээ дахин тулалдаж болно." },
};

function BattleOver({ state, boss }: { state: BattleState; boss: BattleScreenProps["boss"] }) {
  const won = state.status === "won";
  const message = END_MESSAGES[state.endReason ?? "left"];
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
                  {RARITY_LABELS[state.rewards.egg.rarity]} · Тэжээвэр хэсгээс ангаахай
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
      <dl className="grid w-full grid-cols-2 gap-2 text-sm md:grid-cols-4">
        {[
          ["Нийт хохирол", state.me.damageDealt],
          ["Зөв", state.me.correct],
          ["Буруу", state.me.wrong],
          ["Шилдэг комбо", state.me.bestCombo],
        ].map(([label, value]) => (
          <div key={label} className="rounded-tile bg-surface px-2 py-3">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
        <ButtonLink href="/pets/battle">Боссууд руу буцах</ButtonLink>
        {state.rewards?.egg ? (
          <ButtonLink href="/pets/eggs" variant="secondary">
            Өндөг ангаахай
          </ButtonLink>
        ) : null}
        <ButtonLink href="/pets/progress" variant="secondary">
          Ахицаа харах
        </ButtonLink>
      </div>
    </section>
  );
}
