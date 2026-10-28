"use client";

import { cn } from "@/lib/cn";
import { GroupDetail } from "./GroupDetail";
import {
  askedBy,
  commonMisconception,
  shortTitle,
  type GroupView,
} from "./question-inbox";

type GroupRowProps = {
  group: GroupView;
  open: boolean;
  onToggle: () => void;
};

/**
 * One AI-made group as an inbox row: how many asked, the title and what the
 * AI noticed. Opening it shows the questions and the answer box.
 */
export function GroupRow({ group: g, open, onToggle }: GroupRowProps) {
  const misconception = commonMisconception(g.questions);
  const panelId = `group-${g.id}`;

  return (
    <li
      className={cn("rounded-card bg-surface", open && "ring-2 ring-lavender")}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start gap-3 p-3.5 text-left md:gap-4 md:p-4"
      >
        <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-white md:size-14">
          <b className="text-lg leading-none md:text-xl">
            {askedBy(g.questions)}
          </b>
          <span className="mt-0.5 text-[10px] font-semibold opacity-85">
            асуусан
          </span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <b className="text-[15px] leading-snug md:text-base">
            {shortTitle(g)}
          </b>
          {misconception ? (
            <span
              className={cn(
                "text-[13px] text-ink-muted",
                !open && "line-clamp-1",
              )}
            >
              🤖 {misconception}
            </span>
          ) : (
            <span className="text-[13px] text-ink-muted">
              {g.questions.length} асуулт
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            "mt-1 size-5 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div id={panelId} className="px-3.5 pb-4 md:px-4 md:pl-[88px]">
          <GroupDetail group={g} onClose={onToggle} />
        </div>
      ) : null}
    </li>
  );
}
