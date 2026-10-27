"use client";

import { useState } from "react";
import { Expression, Fraction, sayFraction } from "@/components/Fraction";
import { Button, ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Question } from "@/lib/types";

type HorseRaceProps = {
  questions: Question[];
};

/** Chance that a bot horse moves after each question. */
const BOT_STEP_CHANCE = 0.6;

const HORSES = [
  { name: "Чи", lane: "bg-lavender" },
  { name: "Хурдан хүрэн", lane: "bg-sky" },
  { name: "Цагаан салхи", lane: "bg-pink" },
  { name: "Шарга", lane: "bg-surface" },
];

const PLAYER = 0;

/**
 * Horse race: a right answer moves the player's horse one step; each bot
 * moves by chance after every question. After the last question the horse
 * furthest ahead wins.
 */
export function HorseRace({ questions }: HorseRaceProps) {
  const steps = questions.length;
  const [index, setIndex] = useState(0);
  const [positions, setPositions] = useState(() => HORSES.map(() => 0));
  const [picked, setPicked] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const answered = picked !== null;
  const correct = answered && picked === question.correctIndex;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    setPositions((prev) =>
      prev.map((pos, horse) => {
        const moves =
          horse === PLAYER
            ? i === question.correctIndex
            : Math.random() < BOT_STEP_CHANCE;
        return moves ? pos + 1 : pos;
      }),
    );
  }

  function next() {
    if (index + 1 >= steps) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setPicked(null);
  }

  function restart() {
    setIndex(0);
    setPositions(HORSES.map(() => 0));
    setPicked(null);
    setFinished(false);
  }

  // Places share a number on a tie: 1, 2, 2, 4.
  const standings = HORSES.map((h, i) => ({ ...h, id: i, pos: positions[i] }))
    .sort((a, b) => b.pos - a.pos)
    .map((h, _, all) => ({
      ...h,
      place: all.findIndex((o) => o.pos === h.pos) + 1,
    }));
  const playerPlace = standings.find((h) => h.id === PLAYER)?.place ?? 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <section
        aria-label="Уралдааны зам"
        className="rounded-[25px] bg-white p-4 shadow-card md:rounded-panel md:p-7"
      >
        <ol className="flex flex-col gap-2 md:gap-3">
          {HORSES.map((horse, i) => (
            <li key={horse.name} className="flex items-center gap-2 md:gap-4">
              <span
                className={cn(
                  "w-16 shrink-0 text-xs font-bold md:w-28 md:text-base",
                  i === PLAYER && "text-primary",
                )}
              >
                {horse.name}
              </span>
              <div
                className={cn(
                  "relative h-11 flex-1 rounded-field md:h-14",
                  horse.lane,
                )}
              >
                {/* finish line */}
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 right-0 w-1.5 rounded-r-field bg-ink md:w-2"
                />
                <span
                  role="img"
                  aria-label={`${horse.name}: ${positions[i]}/${steps}`}
                  className="absolute top-1/2 -translate-y-1/2 text-[28px] leading-none transition-[left] duration-500 ease-out md:text-[40px]"
                  style={{
                    left: `calc(${positions[i] / steps} * (100% - 2.75rem))`,
                  }}
                >
                  <span className="inline-block -scale-x-100">🐎</span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {finished ? (
        <section
          aria-labelledby="race-result"
          className="rounded-[25px] bg-white p-5 text-center shadow-card md:rounded-panel md:p-8"
        >
          <h2
            id="race-result"
            className="text-[28px] leading-tight font-bold md:text-[40px]"
          >
            {playerPlace === 1 ? "🏆 Чи түрүүллээ!" : `Чи ${playerPlace}-р байр`}
          </h2>
          <p className="mt-1 font-bold text-ink-muted">
            {positions[PLAYER]}/{steps} зөв хариулт
          </p>
          <ol className="mx-auto mt-5 flex max-w-sm flex-col gap-2 text-left">
            {standings.map((h) => (
              <li
                key={h.id}
                className={cn(
                  "flex items-center gap-3 rounded-card px-4 py-2.5 font-bold",
                  h.id === PLAYER ? "bg-primary text-white" : "bg-surface",
                )}
              >
                <span className="w-6">{h.place}.</span>
                <span className="flex-1">{h.name}</span>
                <span>{h.pos} нүүдэл</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={restart}>Дахин тоглох</Button>
            <ButtonLink href="/" variant="secondary">
              Нүүр хуудас
            </ButtonLink>
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="race-question"
          className="rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-8"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="race-question" className="text-lg font-bold md:text-2xl">
              {question.prompt}
            </h2>
            <span className="rounded-full bg-surface px-3 py-1 text-sm font-bold">
              {index + 1}/{steps}
            </span>
          </div>
          <Expression
            tokens={question.expression}
            className="mt-4 justify-center text-[34px] font-bold md:text-[44px]"
          />

          <div className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
            {question.options.map((option, i) => {
              const isRight = answered && i === question.correctIndex;
              const isWrongPick = answered && i === picked && !correct;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={answered}
                  aria-label={sayFraction(option)}
                  className={cn(
                    "flex min-h-24 cursor-pointer items-center justify-center rounded-tile border-3 text-[28px] font-bold transition active:scale-[.98] disabled:cursor-default md:min-h-32 md:text-[34px]",
                    isRight
                      ? "border-primary bg-primary text-white"
                      : isWrongPick
                        ? "border-magenta bg-pink text-ink"
                        : "border-lavender bg-white text-ink enabled:hover:border-primary",
                  )}
                >
                  <Fraction value={option} />
                </button>
              );
            })}
          </div>

          <div
            aria-live="polite"
            className="mt-5 flex min-h-12 flex-wrap items-center justify-between gap-3"
          >
            {answered ? (
              <>
                <p className="font-bold">
                  {correct
                    ? "Зөв! Морь чинь нэг нүүдэл урагшиллаа 🐎"
                    : "Буруу. Энэ удаа морь чинь зогслоо."}
                </p>
                <Button onClick={next}>
                  {index + 1 >= steps ? "Үр дүн харах" : "Дараах"}
                </Button>
              </>
            ) : (
              <p className="font-bold text-ink-muted">
                Зөв хариулбал морь чинь урагшилна.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
