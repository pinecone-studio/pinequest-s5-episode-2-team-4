"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import {
  answerQuestionGroup,
  renameQuestionGroup,
  type GroupResult,
} from "@/lib/question-group-actions";
import type { AnonQuestion, QuestionAnswer, QuestionGroup } from "@/lib/types";
import { MaterialLink } from "@/components/MaterialLink";
import { parseMaterial } from "@/lib/answer-material";
import { GroupForm } from "./GroupForm";
import { GroupSummary } from "./GroupSummary";
import { MaterialPicker, type MaterialDraft } from "./MaterialPicker";

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
};

/** One AI-made group: what the AI noticed, and one answer for the whole class. */
export function QuestionGroupCard({ group: g }: QuestionGroupCardProps) {
  const [mode, setMode] = useState<"view" | "rename" | "answer">("view");
  const [sent, setSent] = useState<Pick<
    QuestionAnswer,
    "text" | "material"
  > | null>(null);
  const [material, setMaterial] = useState<MaterialDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const teacherAnswer =
    sent ?? g.questions.find((q) => q.answer?.by === "teacher")?.answer;
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
      <GroupSummary
        group={g}
        answered={answered}
        onRename={mode === "view" ? () => setMode("rename") : undefined}
      />

      {mode !== "view" ? (
        <GroupForm
          id={g.id}
          kind={mode}
          initial={mode === "rename" ? g.title : ""}
          pending={pending}
          onCancel={() => setMode("view")}
          onSubmit={(text) => {
            if (mode === "rename")
              return run(
                () => renameQuestionGroup(g.id, text),
                () => setMode("view"),
              );
            const checked = material && parseMaterial(material);
            if (material && !checked)
              return setError("Холбоос https://-ээр эхлэх ёстой");
            run(
              () => answerQuestionGroup(g.id, text, checked),
              () => {
                setSent({ text, material: checked ?? undefined });
                setMode("view");
              },
            );
          }}
        >
          {mode === "answer" ? (
            <MaterialPicker
              id={g.id}
              subtopicId={g.subtopicId}
              subtopicTitle={g.subtopicTitle}
              onChange={setMaterial}
            />
          ) : null}
        </GroupForm>
      ) : (
        <>
          {teacherAnswer ? (
            <div className="mt-3 rounded-field bg-white px-3.5 py-2.5">
              <p className="text-[15px] whitespace-pre-line">
                {teacherAnswer.text}
              </p>
              {teacherAnswer.material ? (
                <MaterialLink
                  material={teacherAnswer.material}
                  className="mt-2"
                />
              ) : null}
              <p
                role="status"
                className="mt-1 text-xs font-bold text-ink-muted"
              >
                Бүх ангид илгээгдсэн
              </p>
            </div>
          ) : null}
          {teacherAnswer ? null : (
            <Button
              size="sm"
              className="mt-3"
              onClick={() => {
                setMaterial(null);
                setMode("answer");
              }}
            >
              Хариулах
            </Button>
          )}
        </>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-[13px] font-bold text-magenta">
          {error}
        </p>
      ) : null}
    </li>
  );
}
