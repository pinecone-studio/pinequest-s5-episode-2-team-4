"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { AnonQuestion, QuestionGroup } from "@/lib/types";

type QuestionGroupsProps = {
  groups: (QuestionGroup & {
    subtopicTitle: string;
    questions: AnonQuestion[];
  })[];
  className?: string;
};

/** Students behind a group: each asker plus everyone who tapped «Би ч бас». */
const askedBy = (questions: AnonQuestion[]) =>
  questions.reduce((sum, q) => sum + 1 + q.meToo, 0);

/**
 * Anonymous questions grouped (as if by AI): the teacher answers each group
 * once and the answer goes to the whole class. Mock: replies stay local.
 */
export function QuestionGroups({ groups, className }: QuestionGroupsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<Record<string, string>>({});

  const sorted = [...groups].sort(
    (a, b) => askedBy(b.questions) - askedBy(a.questions),
  );

  return (
    <section
      aria-labelledby="questions-title"
      className={cn(
        "min-w-0 rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-7",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="questions-title"
          className="text-[22px] leading-[1.15] font-bold md:text-[28px] md:leading-[1.1]"
        >
          Нэргүй асуултууд
        </h2>
        <p className="text-[13px] font-semibold text-ink-muted md:text-sm">
          AI ижил асуултуудыг бүлэглэсэн
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {sorted.map((g) => {
          const teacherAnswer =
            sent[g.id] ??
            g.questions.find((q) => q.answer?.by === "teacher")?.answer?.text;
          return (
            <li key={g.id} className="rounded-card bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <b className="text-base md:text-lg">{g.title}</b>
                  <span className="text-[13px] text-ink-muted">
                    {g.subtopicTitle} · {g.questions.length} асуулт
                  </span>
                </div>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white md:text-[13px]">
                  {askedBy(g.questions)} сурагч асуусан
                </span>
              </div>

              <ul className="mt-2.5 flex flex-col gap-1">
                {g.questions.map((q) => (
                  <li key={q.id} className="text-[15px]">
                    “{q.text}”
                  </li>
                ))}
              </ul>

              {teacherAnswer ? (
                <div className="mt-3 rounded-field bg-white px-3.5 py-2.5">
                  <p className="text-[15px]">{teacherAnswer}</p>
                  <p
                    role="status"
                    className="mt-1 text-xs font-bold text-ink-muted"
                  >
                    Бүх ангид илгээгдсэн
                  </p>
                </div>
              ) : openId === g.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = draft.trim();
                    if (!text) return;
                    setSent((prev) => ({ ...prev, [g.id]: text }));
                    setOpenId(null);
                  }}
                  className="mt-3 flex flex-col gap-2"
                >
                  <label htmlFor={`reply-${g.id}`} className="sr-only">
                    Ангид хариулт бичих
                  </label>
                  <textarea
                    id={`reply-${g.id}`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    autoFocus
                    placeholder="Нэг хариулт бүх ангид очно…"
                    className="w-full resize-none rounded-field border-2 border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none placeholder:text-ink-muted focus:border-primary"
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="white"
                      size="sm"
                      onClick={() => setOpenId(null)}
                    >
                      Болих
                    </Button>
                    <Button type="submit" size="sm" disabled={!draft.trim()}>
                      Бүх ангид илгээх
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setOpenId(g.id);
                      setDraft("");
                    }}
                  >
                    Хариулах
                  </Button>
                  {/* Voice replies need a backend; UI only for now. */}
                  <Button variant="white" size="sm" disabled title="Удахгүй">
                    🎙 Дуут хариулт
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
