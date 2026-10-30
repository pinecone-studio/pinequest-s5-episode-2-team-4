"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";

const arrowClass =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-surface disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";

/**
 * Picks the week of «Хичээлийн дохио»: arrows step a week, the list jumps.
 * The week is in the URL (?week=1 is last week), so the page reads it.
 */
export function WeekPicker({ labels, selected }: { labels: string[]; selected: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (i: number) =>
    startTransition(() => router.push(i === 0 ? "/teacher" : `/teacher?week=${i}`, { scroll: false }));

  return (
    <div aria-busy={pending} className={cn("flex w-full items-center gap-1 sm:w-auto", pending && "opacity-60")}>
      <button
        type="button"
        aria-label="Өмнөх долоо хоног"
        disabled={selected === labels.length - 1}
        onClick={() => go(selected + 1)}
        className={arrowClass}
      >
        <Chevron className="rotate-180" />
      </button>
      <select
        aria-label="Долоо хоног сонгох"
        value={selected}
        onChange={(e) => go(Number(e.target.value))}
        className="h-11 min-w-0 flex-1 cursor-pointer rounded-tile border-2 border-lavender bg-card px-3 text-sm font-bold text-ink focus:border-primary focus:outline-none"
      >
        {labels.map((label, i) => (
          <option key={label} value={i}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label="Дараагийн долоо хоног"
        disabled={selected === 0}
        onClick={() => go(selected - 1)}
        className={arrowClass}
      >
        <Chevron />
      </button>
    </div>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-4", className)}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
