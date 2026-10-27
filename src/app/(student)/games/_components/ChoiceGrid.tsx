"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";
import type { ChoiceRound } from "../_lib/choices";
import { AnswerView } from "./AnswerView";

type ChoiceGridProps = {
  round: ChoiceRound;
  /** Index of the picked choice, or null before an answer. */
  picked: number | null;
  onChoose: (choice: number) => void;
  /** Changes with every new round so the buttons start fresh. */
  roundKey: number;
};

const LETTERS = "АБВГ";

/** The round's prompt and its 4 choices as 3D buttons; keys 1–4 pick too. */
export function ChoiceGrid({ round, picked, onChoose, roundKey }: ChoiceGridProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < round.choices.length) onChoose(i);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const answered = picked !== null;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg leading-tight font-extrabold">
        {round.question.prompt}
        <span className="block text-sm font-semibold text-[var(--game-muted)]">Тохирохыг нь сонго · 1–4</span>
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {round.choices.map((choice, k) => (
          <button
            key={`${roundKey}-${k}`}
            type="button"
            disabled={answered}
            onClick={() => onChoose(k)}
            className={cn(
              "game-chip flex min-h-14 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left font-bold shadow-[0_4px_0_var(--game-line)] transition-[transform,box-shadow,border-color] duration-75 enabled:hover:-translate-y-0.5 enabled:hover:border-[#8b5cff] enabled:active:translate-y-1 enabled:active:shadow-none disabled:cursor-default",
              answered && k === round.answer && "border-[var(--game-good)] bg-[rgb(52_211_153/0.2)]",
              answered && k === picked && k !== round.answer && "border-[var(--game-bad)] bg-[rgb(255_77_109/0.2)]",
            )}
          >
            <span className="grid size-6 flex-none place-items-center rounded-md bg-white/10 text-xs">{LETTERS[k]}</span>
            <AnswerView answer={choice} />
          </button>
        ))}
      </div>
    </div>
  );
}
