"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  answerQuestionGroup,
  mergeQuestionGroups,
  renameQuestionGroup,
  type GroupResult,
} from "@/lib/question-group-actions";
import type { AnonQuestion, QuestionGroup } from "@/lib/types";
import { GroupForm } from "./GroupForm";

export type GroupView = QuestionGroup & {
  subtopicTitle: string;
  questions: AnonQuestion[];
};

/** Students behind a group: each asker plus everyone who tapped «Би ч бас». */
export const askedBy = (questions: AnonQuestion[]) =>
  questions.reduce((sum, q) => sum + 1 + q.meToo, 0);

const errorText: Record<Exclude<GroupResult, { ok: true }>["error"], string> = {
  login: "Багшаар нэвтэрнэ үү",
  empty: "Хоосон байна",
  offline: "Өгөгдлийн сан холбогдоогүй байна",
  failed: "Хадгалж чадсангүй. Дахин оролдоорой",
};


type QuestionGroupCardProps = {
  group: GroupView;
  /** Other groups of the same lesson this one can be merged into. */
  mergeTargets: GroupView[];
};

/** One group: rename it, merge it into another, or answer the whole class once. */
export function QuestionGroupCard({ group: g, mergeTargets }: QuestionGroupCardProps) {
  const [mode, setMode] = useState<"view" | "rename" | "answer">("view");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const teacherAnswer = sent ?? g.questions.find((q) => q.answer?.by === "teacher")?.answer?.text;
  const answered = g.status === "answered" || Boolean(teacherAnswer);

  function run(action: () => Promise<GroupResult>, done?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) setError(errorText[result.error]);
      else done?.();
    });
  }

  return (
    <li className="rounded-card bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <b className="text-base md:text-lg">{g.title}</b>
          <span className="text-[13px] text-ink-muted">
            {g.subtopicTitle} · {g.questions.length} асуулт ·{" "}
            <span className={cn("font-bold", answered ? "text-ink" : "text-magenta")}>
              {answered ? "Хариулсан" : "Хүлээгдэж буй"}
            </span>
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
            {q.needsReview ? (
              <span className="ml-2 rounded-full border-2 border-magenta bg-pink px-2 py-0.5 text-xs font-bold">
                Шалгах
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {mode !== "view" ? (
        <GroupForm
          id={g.id}
          kind={mode}
          initial={mode === "rename" ? g.title : ""}
          pending={pending}
          onCancel={() => setMode("view")}
          onSubmit={(text) =>
            mode === "rename"
              ? run(() => renameQuestionGroup(g.id, text), () => setMode("view"))
              : run(() => answerQuestionGroup(g.id, text), () => {
                  setSent(text);
                  setMode("view");
                })
          }
        />
      ) : (
        <>
          {teacherAnswer ? (
            <div className="mt-3 rounded-field bg-white px-3.5 py-2.5">
              <p className="text-[15px] whitespace-pre-line">{teacherAnswer}</p>
              <p role="status" className="mt-1 text-xs font-bold text-ink-muted">
                Бүх ангид илгээгдсэн
              </p>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {teacherAnswer ? null : (
              <Button size="sm" onClick={() => setMode("answer")}>
                Хариулах
              </Button>
            )}
            <Button variant="white" size="sm" onClick={() => setMode("rename")}>
              Нэр солих
            </Button>
            {mergeTargets.length > 0 ? (
              <label className="inline-flex items-center gap-1.5 text-[13px] font-bold">
                <span className="sr-only">Өөр бүлэгт нэгтгэх</span>
                <select value="" disabled={pending}
                  onChange={(e) => e.target.value && run(() => mergeQuestionGroups(g.id, e.target.value))}
                  className="min-h-9 max-w-56 cursor-pointer rounded-full border-2 border-line bg-white px-3 text-[13px] font-bold text-ink">
                  <option value="">Нэгтгэх…</option>
                  {mergeTargets.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-[13px] font-bold text-magenta">{error}</p>
      ) : null}
    </li>
  );
}
