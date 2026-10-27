"use client";

import { useEffect, useState } from "react";

type StartOverlayProps = {
  title: React.ReactNode;
  steps: { icon: React.ReactNode; text: string }[];
  buttonLabel: string;
  /** Called after the 3-2-1 countdown. */
  onStart: () => void;
  onTick?: () => void;
  /** Shown under the steps, e.g. a skin picker. */
  children?: React.ReactNode;
};

/** How-to-play screen with a start button and a 3-2-1 countdown. */
export function StartOverlay({ title, steps, buttonLabel, onStart, onTick, children }: StartOverlayProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      onStart();
      return;
    }
    onTick?.();
    const id = setTimeout(() => setCount(count - 1), 650);
    return () => clearTimeout(id);
  }, [count, onStart, onTick]);

  return (
    <div className="game-overlay absolute inset-0 flex flex-col items-center justify-center gap-3.5 p-6 text-center">
      {count !== null && count > 0 ? (
        <p key={count} className="game-count text-7xl font-extrabold text-white" aria-live="assertive">
          {count}
        </p>
      ) : count === null ? (
        <>
          <h2 className="text-2xl leading-tight font-extrabold">{title}</h2>
          <ul className="flex flex-wrap justify-center gap-2.5">
            {steps.map((s) => (
              <li key={s.text} className="flex w-[92px] flex-col items-center gap-1.5 text-xs text-[var(--game-muted)]">
                <span className="game-chip grid size-11 place-items-center rounded-[14px]">{s.icon}</span>
                {s.text}
              </li>
            ))}
          </ul>
          {children}
          <button
            type="button"
            onClick={() => setCount(3)}
            className="game-gradient mt-2 cursor-pointer rounded-[14px] px-7 py-3 text-lg font-extrabold text-white shadow-[0_10px_24px_-10px_var(--color-magenta)]"
          >
            {buttonLabel}
          </button>
        </>
      ) : null}
    </div>
  );
}
