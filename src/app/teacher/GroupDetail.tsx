"use client";

import { useState, useTransition } from "react";
import { MaterialLink } from "@/components/MaterialLink";
import { parseMaterial } from "@/lib/answer-material";
import {
  answerQuestionGroup,
  renameQuestionGroup,
  type GroupResult,
} from "@/lib/question-group-actions";
import type { QuestionAnswer } from "@/lib/types";
import { GroupForm } from "./GroupForm";
import { MaterialPicker, type MaterialDraft } from "./MaterialPicker";
import { sharedAnswer, type GroupView } from "./question-inbox";

const errorText: Record<Exclude<GroupResult, { ok: true }>["error"], string> = {
  login: "Багшаар нэвтэрнэ үү",
  empty: "Хоосон байна",
  offline: "Өгөгдлийн сан холбогдоогүй байна",
  failed: "Хадгалж чадсангүй. Дахин оролдоорой",
};

type GroupDetailProps = {
  group: GroupView;
  /** Closes the row, e.g. on «Болих». */
  onClose: () => void;
};

/** An open inbox row: the questions, then the answer box or the answer the class got. */
export function GroupDetail({ group: g, onClose }: GroupDetailProps) {
  const [renaming, setRenaming] = useState(false);
  const [sent, setSent] = useState<Pick<
    QuestionAnswer,
    "text" | "material"
  > | null>(null);
  const [material, setMaterial] = useState<MaterialDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const answer = sent ?? sharedAnswer(g);

  function run(action: () => Promise<GroupResult>, done: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) setError(errorText[result.error]);
      else done();
    });
  }

  function sendAnswer(text: string) {
    const checked = material && parseMaterial(material);
    if (material && !checked)
      return setError("Холбоос https://-ээр эхлэх ёстой");
    run(
      () => answerQuestionGroup(g.id, text, checked),
      () => setSent({ text, material: checked ?? undefined }),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {g.questions.map((q) => (
          <li
            key={q.id}
            className="flex items-baseline justify-between gap-3 text-base"
          >
            <span>“{q.text}”</span>
            {q.meToo > 0 ? (
              <span className="shrink-0 text-xs font-bold text-ink-muted">
                🙋 +{q.meToo}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {renaming ? (
        <GroupForm
          id={g.id}
          kind="rename"
          initial={g.title}
          pending={pending}
          onCancel={() => setRenaming(false)}
          onSubmit={(text) =>
            run(
              () => renameQuestionGroup(g.id, text),
              () => setRenaming(false),
            )
          }
        />
      ) : (
        <button
          type="button"
          onClick={() => setRenaming(true)}
          className="cursor-pointer self-start text-sm font-bold text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          ✏️ Нэр солих
        </button>
      )}

      {answer ? (
        <div className="rounded-field bg-white px-3.5 py-2.5">
          <p className="text-xs font-bold text-primary">
            Таны хариулт · бүх ангид илгээгдсэн
          </p>
          <p className="mt-0.5 text-base whitespace-pre-line">
            {answer.text}
          </p>
          {answer.material ? (
            <MaterialLink material={answer.material} className="mt-2" />
          ) : null}
        </div>
      ) : renaming ? null : (
        <GroupForm
          id={g.id}
          kind="answer"
          pending={pending}
          onCancel={onClose}
          onSubmit={sendAnswer}
        >
          <MaterialPicker
            id={g.id}
            subtopicId={g.subtopicId}
            subtopicTitle={g.subtopicTitle}
            onChange={setMaterial}
          />
        </GroupForm>
      )}

      {error ? (
        <p role="alert" className="text-sm font-bold text-magenta">
          {error}
        </p>
      ) : null}
    </div>
  );
}
