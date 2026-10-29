"use client";

import { useState } from "react";
import { MaterialLink } from "@/components/MaterialLink";
import { PixelIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { AnonQuestion } from "@/lib/types";

/** XP a helper gets once the teacher approves the answer. */
const HELP_XP = 10;

const chip = (on = false) =>
  cn(
    "min-h-9 cursor-pointer rounded-full px-3 text-xs font-bold whitespace-nowrap disabled:cursor-default",
    on ? "bg-primary text-white" : "bg-white text-ink hover:bg-lavender",
  );

type ChatQuestionProps = {
  question: AnonQuestion;
  meToo: boolean;
  onMeToo: () => void;
};

/**
 * A classmate's question as a chat bubble on the left, with «Би ч бас» and
 * the answer as a reply under it. Peer answers show only once the teacher
 * approves them.
 */
export function ChatQuestion({
  question: q,
  meToo,
  onMeToo,
}: ChatQuestionProps) {
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [replied, setReplied] = useState<string | null>(null);
  // One kudos per answer; there is no way to leave a negative reaction.
  const [kudos, setKudos] = useState(false);
  const answer = q.answer?.approved ? q.answer : undefined;

  return (
    <li className="flex flex-col items-start gap-1.5">
      <div className="max-w-[85%] rounded-[20px] rounded-bl-md bg-surface px-3.5 py-2.5">
        <p className="text-base">{q.text}</p>
        <p className="mt-0.5 text-right text-2xs font-semibold text-ink-muted">
          {q.time}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 pl-1">
        <button
          type="button"
          aria-pressed={meToo}
          onClick={onMeToo}
          className={chip(meToo)}
        >
          <PixelIcon name="hand" className="inline-block size-3.5 align-[-0.15em]" /> Би ч бас {q.meToo + (meToo ? 1 : 0)}
        </button>
        {answer || replied || replying ? null : (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className={chip()}
          >
            Хариулах
          </button>
        )}
      </div>

      {answer ? (
        <div className="ml-5 max-w-[85%] rounded-[20px] rounded-tl-md border-2 border-lavender bg-white px-3.5 py-2.5">
          <p className="text-xs font-bold text-primary">
            {answer.by === "teacher" ? "Багш" : "Ангийн найз"}
          </p>
          <p className="mt-0.5 text-base whitespace-pre-line">
            {answer.text}
          </p>
          {answer.material ? (
            <MaterialLink material={answer.material} className="mt-2" />
          ) : null}
          {answer.by === "peer" ? (
            <button
              type="button"
              disabled={kudos}
              onClick={() => setKudos(true)}
              className={cn(chip(kudos), "mt-2 border-2 border-lavender")}
            >
              {kudos ? "Баярлалаа!" : "Чи сайн тайлбарласан"}{" "}
              <PixelIcon name="clap" className="inline-block size-3.5 align-[-0.15em]" />{" "}
              {answer.kudos + (kudos ? 1 : 0)}
            </button>
          ) : null}
        </div>
      ) : replied ? (
        <div className="ml-5 max-w-[85%] rounded-[20px] rounded-tl-md bg-primary px-3.5 py-2.5 text-white">
          <p className="text-base">{replied}</p>
          <p
            role="status"
            className="mt-0.5 text-2xs font-semibold opacity-80"
          >
            Багш шалгаж байна · +{HELP_XP} XP
          </p>
        </div>
      ) : replying ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) setReplied(draft.trim());
            setReplying(false);
          }}
          className="ml-5 flex w-[85%] flex-col gap-1.5"
        >
          <label htmlFor={`reply-${q.id}`} className="sr-only">
            Хариулт бичих
          </label>
          <textarea
            id={`reply-${q.id}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Өөрийнхөөрөө тайлбарла… +${HELP_XP} XP`}
            rows={2}
            maxLength={500}
            autoFocus
            className="w-full resize-none rounded-field border-2 border-line bg-white px-3 py-2 text-base text-ink outline-none placeholder:text-ink-muted focus:border-primary"
          />
          <div className="flex gap-1.5 self-end">
            <button
              type="button"
              onClick={() => setReplying(false)}
              className={cn(chip(), "border-2 border-lavender")}
            >
              Болих
            </button>
            <button
              type="submit"
              disabled={!draft.trim()}
              className={cn(chip(true), "disabled:opacity-60")}
            >
              Илгээх
            </button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
