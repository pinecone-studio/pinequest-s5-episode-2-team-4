"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { AnonQuestion } from "@/lib/types";

type HelpClassmatesProps = {
  /** Open questions with no answer yet. */
  questions: AnonQuestion[];
};

/** XP a helper gets once the teacher approves the answer. */
const HELP_XP = 10;

/**
 * Students answer classmates' anonymous questions; the teacher approves the
 * answer before anyone sees it. Mock: answers stay in local state.
 */
export function HelpClassmates({ questions }: HelpClassmatesProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<Record<string, string>>({});

  if (questions.length === 0) return null;

  return (
    <section
      aria-labelledby="help-title"
      className="rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:px-8 md:py-7"
    >
      <h3
        id="help-title"
        className="text-2xl leading-tight font-bold md:text-[28px]"
      >
        Ангийнхандаа туслах
      </h3>
      <p className="mt-1 text-sm font-bold text-ink-muted md:text-base">
        Тайлбарлах нь хамгийн сайн сурах арга. Багш баталбал +{HELP_XP} XP.
      </p>

      <ul className="mt-4 flex flex-col gap-2.5 md:gap-3">
        {questions.map((q) => (
          <li key={q.id} className="rounded-card bg-surface px-4 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <p className="flex-1 font-bold">{q.text}</p>
              {sent[q.id] || openId === q.id ? null : (
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => {
                    setOpenId(q.id);
                    setDraft("");
                  }}
                >
                  Хариулах
                </Button>
              )}
            </div>

            {sent[q.id] ? (
              <div className="mt-2 rounded-field bg-white px-3.5 py-2.5">
                <p className="text-[15px]">{sent[q.id]}</p>
                <p role="status" className="mt-1 text-xs font-bold text-ink-muted">
                  Багш баталгаажуулахыг хүлээж байна · +{HELP_XP} XP
                </p>
              </div>
            ) : openId === q.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = draft.trim();
                  if (!text) return;
                  setSent((prev) => ({ ...prev, [q.id]: text }));
                  setOpenId(null);
                }}
                className="mt-2 flex flex-col gap-2"
              >
                <label htmlFor={`help-${q.id}`} className="sr-only">
                  Хариулт бичих
                </label>
                <textarea
                  id={`help-${q.id}`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  maxLength={500}
                  autoFocus
                  placeholder="Өөрийнхөөрөө тайлбарла…"
                  className="w-full resize-none rounded-field border-2 border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none placeholder:text-ink-muted focus:border-primary"
                />
                <div className="flex gap-2 self-end">
                  <Button variant="white" size="sm" onClick={() => setOpenId(null)}>
                    Болих
                  </Button>
                  <Button type="submit" size="sm" disabled={!draft.trim()}>
                    Илгээх
                  </Button>
                </div>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
