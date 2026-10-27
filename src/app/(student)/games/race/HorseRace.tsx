"use client";

import { useEffect, useState } from "react";
import { Expression, Fraction, sayFraction } from "@/components/Fraction";
import { Button, ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Question } from "@/lib/types";
import "./race.css";

type HorseRaceProps = {
  questions: Question[];
};

/** Chance that a bot horse moves after each question. */
const BOT_STEP_CHANCE = 0.6;
/** How long the right/wrong feedback stays before the next question. */
const FEEDBACK_MS = 1300;

const HORSES = ["Чи", "Хурдан хүрэн", "Цагаан салхи", "Шарга"];
const PLAYER = 0;
const MEDALS = ["🥇", "🥈", "🥉"];

type Phase = "ready" | "countdown" | "race" | "finished";

/** Horses sorted by position; ties share a place: 1, 2, 2, 4. */
function rank(positions: number[]) {
  const sorted = positions
    .map((pos, id) => ({ id, name: HORSES[id], pos }))
    .sort((a, b) => b.pos - a.pos);
  return sorted.map((h) => ({
    ...h,
    place: sorted.findIndex((o) => o.pos === h.pos) + 1,
  }));
}

/**
 * Horse race game: a right answer moves the player's horse one step; each
 * bot moves by chance after every question. After the last question the
 * horse furthest ahead wins. Keys 1–4 pick an answer.
 */
export function HorseRace({ questions }: HorseRaceProps) {
  const steps = questions.length;
  const [phase, setPhase] = useState<Phase>("ready");
  const [count, setCount] = useState(3);
  const [index, setIndex] = useState(0);
  const [positions, setPositions] = useState(() => HORSES.map(() => 0));
  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const question = questions[index];
  const answered = picked !== null;
  const correct = answered && picked === question.correctIndex;
  const standings = rank(positions);
  const playerPlace = standings.find((h) => h.id === PLAYER)?.place ?? 0;

  function start() {
    setIndex(0);
    setPositions(HORSES.map(() => 0));
    setPicked(null);
    setStreak(0);
    setBestStreak(0);
    setCount(3);
    setPhase("countdown");
  }

  function pick(i: number) {
    if (phase !== "race" || answered) return;
    const right = i === question.correctIndex;
    setPicked(i);
    setStreak((s) => {
      const next = right ? s + 1 : 0;
      setBestStreak((b) => Math.max(b, next));
      return next;
    });
    setPositions((prev) =>
      prev.map((pos, horse) => {
        const moves =
          horse === PLAYER ? right : Math.random() < BOT_STEP_CHANCE;
        return moves ? pos + 1 : pos;
      }),
    );
  }

  // 3, 2, 1, then the race starts.
  useEffect(() => {
    if (phase !== "countdown") return;
    const timer = setTimeout(() => {
      if (count > 0) setCount(count - 1);
      else setPhase("race");
    }, 700);
    return () => clearTimeout(timer);
  }, [phase, count]);

  // After the feedback, go on to the next question or the finish.
  useEffect(() => {
    if (phase !== "race" || picked === null) return;
    const timer = setTimeout(() => {
      if (index + 1 >= steps) {
        setPhase("finished");
      } else {
        setIndex(index + 1);
        setPicked(null);
      }
    }, FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [phase, picked, index, steps]);

  // Keys 1–4 pick an answer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < question.options.length) pick(i);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* HUD */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { label: "Асуулт", value: `${Math.min(index + 1, steps)}/${steps}` },
          { label: "Байр", value: phase === "ready" ? "—" : `${playerPlace}` },
          { label: "Цуврал", value: streak > 1 ? `🔥 ${streak}` : `${streak}` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-card bg-white px-3 py-2 text-center shadow-card md:py-3"
          >
            <p className="text-xs font-bold text-ink-muted md:text-sm">
              {s.label}
            </p>
            <p className="text-xl font-bold md:text-[28px]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Track */}
      <section
        aria-label="Уралдааны зам"
        className="race-field relative overflow-hidden rounded-[25px] p-3 shadow-float md:rounded-panel md:p-5"
      >
        <ol className="flex flex-col gap-2 md:gap-3">
          {HORSES.map((name, i) => {
            const pos = positions[i];
            return (
              <li
                key={name}
                className={cn(
                  "relative flex h-14 items-center rounded-field md:h-[72px]",
                  i === PLAYER ? "race-lane-player" : "race-lane",
                )}
              >
                <span
                  aria-hidden="true"
                  className="race-gate flex h-full w-7 shrink-0 items-center justify-center rounded-l-field text-sm font-bold text-ink md:w-9 md:text-base"
                >
                  {i + 1}
                </span>
                <div className="relative h-full flex-1">
                  <span
                    aria-hidden="true"
                    className="race-finish absolute inset-y-0 right-0 w-3 md:w-4"
                  />
                  <span
                    role="img"
                    aria-label={`${name}: ${pos}/${steps}`}
                    className="absolute top-1/2 flex -translate-y-1/2 flex-col items-center transition-[left] duration-700 ease-out"
                    style={{
                      left: `calc(${pos / steps} * (100% - 3.5rem) + 0.25rem)`,
                    }}
                  >
                    {i === PLAYER ? (
                      <span className="mb-0.5 rounded-full bg-primary px-1.5 text-[10px] leading-4 font-bold text-white md:text-xs md:leading-5">
                        ЧИ
                      </span>
                    ) : null}
                    <span className="relative">
                      {pos > 0 ? (
                        <span
                          key={`dust-${pos}`}
                          className="race-dust absolute top-1/2 -left-3 text-lg md:text-2xl"
                        >
                          💨
                        </span>
                      ) : null}
                      <span
                        key={`horse-${pos}`}
                        className={cn(
                          "race-horse text-[30px] leading-none md:text-[44px]",
                          pos > 0 && "race-horse-gallop",
                        )}
                      >
                        <span className="inline-block -scale-x-100">🐎</span>
                      </span>
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {phase === "ready" || phase === "countdown" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/45 p-4 text-center text-white">
            {phase === "ready" ? (
              <>
                <p className="race-pop text-[32px] leading-none font-bold md:text-[52px]">
                  🏇 Бэлэн үү?
                </p>
                <p className="max-w-md font-bold md:text-lg">
                  {steps} асуулт. Зөв хариулт бүрт морь чинь нэг нүүдэл
                  урагшилна. 1–4 товчоор хариулж болно.
                </p>
                <Button size="lg" onClick={start}>
                  Эхлэх
                </Button>
              </>
            ) : (
              <p
                key={count}
                role="status"
                className="race-pop text-[72px] leading-none font-bold md:text-[120px]"
              >
                {count > 0 ? count : "ГАРАА!"}
              </p>
            )}
          </div>
        ) : null}
      </section>

      {phase === "finished" ? (
        <section
          aria-labelledby="race-result"
          className="relative overflow-hidden rounded-[25px] bg-white p-5 text-center shadow-card md:rounded-panel md:p-8"
        >
          {playerPlace === 1
            ? ["🎉", "⭐", "🎊", "✨", "🎉", "⭐", "🎊", "✨"].map((c, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="race-confetti absolute top-0 text-2xl md:text-3xl"
                  style={{ left: `${8 + i * 12}%`, animationDelay: `${i * 0.12}s` }}
                >
                  {c}
                </span>
              ))
            : null}
          <h2
            id="race-result"
            className="race-pop text-[32px] leading-tight font-bold md:text-[48px]"
          >
            {playerPlace === 1 ? "🏆 Чи түрүүллээ!" : `Чи ${playerPlace}-р байр`}
          </h2>
          <p className="mt-1 font-bold text-ink-muted md:text-lg">
            {positions[PLAYER]}/{steps} зөв · хамгийн урт цуврал {bestStreak}
          </p>

          {/* Podium: 2nd, 1st, 3rd */}
          <ol className="mx-auto mt-6 flex max-w-md items-end justify-center gap-2 md:gap-3">
            {[standings[1], standings[0], standings[2]].map((h) =>
              h ? (
                <li key={h.id} className="flex flex-1 flex-col items-center">
                  <span className="text-[28px] md:text-[36px]">
                    <span className="inline-block -scale-x-100">🐎</span>
                  </span>
                  <span
                    className={cn(
                      "mb-1 text-xs font-bold md:text-sm",
                      h.id === PLAYER && "text-primary",
                    )}
                  >
                    {h.name}
                  </span>
                  <span
                    className={cn(
                      "flex w-full flex-col items-center justify-start rounded-t-tile pt-2 font-bold",
                      h.id === PLAYER ? "bg-primary text-white" : "bg-lavender",
                      h.place === 1 ? "h-28 md:h-32" : h.place === 2 ? "h-20 md:h-24" : "h-14 md:h-16",
                    )}
                  >
                    <span className="text-2xl">{MEDALS[h.place - 1] ?? h.place}</span>
                    <span className="text-xs">{h.pos} нүүдэл</span>
                  </span>
                </li>
              ) : null,
            )}
          </ol>
          {standings[3] ? (
            <p className="mt-2 text-sm font-bold text-ink-muted">
              {standings[3].place}. {standings[3].name} · {standings[3].pos} нүүдэл
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={start}>Дахин тоглох</Button>
            <ButtonLink href="/" variant="secondary">
              Нүүр хуудас
            </ButtonLink>
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="race-question"
          className={cn(
            "relative rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-7",
            phase !== "race" && "pointer-events-none opacity-50",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="race-question" className="text-lg font-bold md:text-2xl">
              {question.prompt}
            </h2>
            {answered ? (
              <span
                key={index}
                aria-live="polite"
                className={cn(
                  "race-pop rounded-full px-3 py-1 text-sm font-bold md:text-base",
                  correct ? "bg-primary text-white" : "bg-pink text-ink",
                )}
              >
                {correct ? "ЗӨВ! +1 🐎" : "Буруу 😬"}
              </span>
            ) : null}
          </div>
          <Expression
            tokens={question.expression}
            className="mt-3 justify-center text-[34px] font-bold md:text-[44px]"
          />

          <div
            key={`options-${index}`}
            className={cn(
              "mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4",
              answered && !correct && "race-shake",
            )}
          >
            {question.options.map((option, i) => {
              const isRight = answered && i === question.correctIndex;
              const isWrongPick = answered && i === picked && !correct;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={answered || phase !== "race"}
                  aria-label={sayFraction(option)}
                  className={cn(
                    "relative flex min-h-24 cursor-pointer items-center justify-center rounded-tile border-3 text-[28px] font-bold transition-[transform,box-shadow] duration-75 active:translate-y-[5px] disabled:cursor-default md:min-h-32 md:text-[34px]",
                    isRight
                      ? "border-primary bg-primary text-white shadow-3d"
                      : isWrongPick
                        ? "border-magenta bg-pink text-ink shadow-[0_6px_0_var(--color-magenta)]"
                        : "border-lavender bg-white text-ink shadow-[0_6px_0_var(--color-lavender)] enabled:hover:border-primary",
                    answered && !isRight && !isWrongPick && "opacity-50",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 left-2 hidden text-xs font-bold text-ink-muted md:block"
                  >
                    {i + 1}
                  </span>
                  <Fraction value={option} />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
