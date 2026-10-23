"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ExerciseItem } from "@/lib/types";
import { publishAssignment, suggestExercisesAction, unpublishAssignment } from "./actions";

type Item = { id: number; question: string; answer: string };

type AssignmentDraftCardProps = {
  classCode: string;
  subtopicId: string;
  subtopicTitle: string;
  /** The published exercises, or AI suggestions for a new draft */
  initialItems: ExerciseItem[];
  published: boolean;
  initialDue: string;
  /** How many students are weak in the subtopic; who they are isn't shown. */
  targetCount: number;
  /** False when Gemini isn't set up: suggestions are demo ones. */
  aiEnabled: boolean;
  className?: string;
};

const fieldClass =
  "h-12 w-full min-w-0 rounded-tile border-2 px-3 text-base text-ink focus:border-primary focus:outline-none md:text-[15px]";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/**
 * AI-drafted exercises the teacher reviews and edits, then sends to the
 * class's students who are weak in the subtopic (counted, never named).
 */
export function AssignmentDraftCard({
  classCode,
  subtopicId,
  subtopicTitle,
  initialItems,
  published,
  initialDue,
  targetCount,
  aiEnabled,
  className,
}: AssignmentDraftCardProps) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(() =>
    initialItems.map((item, i) => ({ id: i, ...item })),
  );
  const nextId = useRef(initialItems.length);
  const [due, setDue] = useState(initialDue);
  const [toast, setToast] = useState<string | null>(null);
  const [suggesting, startSuggest] = useTransition();
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const hasQuestions = items.some((item) => item.question.trim() && item.answer.trim());

  function suggest() {
    startSuggest(async () => {
      const suggested = await suggestExercisesAction(subtopicId);
      setItems(suggested.map((item) => ({ id: nextId.current++, ...item })));
      setToast(aiEnabled ? "AI шинэ дасгал санал болголоо" : "Жишээ дасгал (AI түлхүүргүй)");
    });
  }

  function publish() {
    startSave(async () => {
      await publishAssignment({ classCode, subtopicId, items, due });
      setToast(`${targetCount} сурагчид илгээгдлээ`);
      router.refresh();
    });
  }

  function unpublish() {
    startSave(async () => {
      await unpublishAssignment(classCode, subtopicId);
      setToast("Ноорог болголоо, сурагчдад харагдахгүй");
      router.refresh();
    });
  }

  function updateItem(id: number, change: Partial<Item>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...change } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: nextId.current++, question: "", answer: "" },
    ]);
  }

  return (
    <section
      aria-labelledby="draft-title"
      className={cn(
        "min-w-0 rounded-[25px] bg-white p-5 shadow-float md:rounded-panel md:p-7",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-[3px] text-xs font-bold text-primary md:gap-1.5 md:px-3 md:py-1 md:text-[13px]">
            <svg {...iconProps} strokeWidth="2.2" className="size-3 md:size-3.5">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
            AI
          </span>
          <h2
            id="draft-title"
            className="text-xl leading-[1.15] font-bold md:text-[28px] md:leading-[1.1]"
          >
            {subtopicTitle}
          </h2>
        </div>
        <StatusPill published={published} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={suggest}
          disabled={suggesting}
          aria-busy={suggesting}
        >
          <svg {...iconProps} strokeWidth="2.2" className="size-4.5">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          </svg>
          {suggesting ? "AI бодож байна…" : "AI-аар шинэ дасгал санал болгох"}
        </Button>
        <p className="text-xs font-semibold text-ink-muted">
          AI-ийн саналыг шалгаж, засаад илгээнэ үү.
        </p>
      </div>

      <div
        aria-hidden="true"
        className="mt-5 hidden grid-cols-[32px_minmax(0,1fr)_128px_48px] gap-3 text-xs font-bold text-ink-muted md:grid"
      >
        <span />
        <span>Асуулт</span>
        <span>Хариу</span>
      </div>
      <ol className="mt-4 flex flex-col gap-2.5 md:mt-2">
        {items.map((item, i) => {
          const num = i + 1;
          return (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-card bg-surface p-2.5 md:grid md:grid-cols-[32px_minmax(0,1fr)_128px_48px] md:items-center md:gap-3 md:bg-transparent md:p-0"
            >
              <div className="flex items-center gap-2 md:contents">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lavender text-xs font-bold md:size-8 md:text-[13px]"
                >
                  {num}
                </span>
                <label htmlFor={`question-${item.id}`} className="sr-only">
                  {num}-р асуулт
                </label>
                <input
                  id={`question-${item.id}`}
                  type="text"
                  value={item.question}
                  onChange={(e) =>
                    updateItem(item.id, { question: e.target.value })
                  }
                  className={cn(fieldClass, "border-lavender bg-white md:px-4")}
                />
              </div>
              <div className="flex items-center gap-2 pl-9 md:contents">
                <label htmlFor={`answer-${item.id}`} className="sr-only">
                  {num}-р асуултын хариу
                </label>
                <input
                  id={`answer-${item.id}`}
                  type="text"
                  value={item.answer}
                  onChange={(e) =>
                    updateItem(item.id, { answer: e.target.value })
                  }
                  className={cn(
                    fieldClass,
                    "border-sky bg-[#f5fcff] font-bold md:px-3.5",
                  )}
                />
                <button
                  type="button"
                  onClick={() =>
                    setItems((prev) => prev.filter((it) => it.id !== item.id))
                  }
                  aria-label={`${num}-р асуултыг устгах`}
                  className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-surface"
                >
                  <svg {...iconProps} strokeWidth="2" className="size-[18px]">
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={addItem}
        className="mt-2.5 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-dashed border-line bg-white px-[18px] text-sm font-bold text-primary hover:bg-surface md:mt-3 md:inline-flex md:w-auto"
      >
        <svg {...iconProps} strokeWidth="2.4" className="size-4">
          <path d="M5 12h14M12 5v14" />
        </svg>
        Нэмэх
      </button>

      <div className="mt-3.5 flex flex-col gap-3.5 md:mt-6 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-4 md:border-t-2 md:border-surface md:pt-6">
        <div className="grid grid-cols-2 gap-2.5 md:flex md:flex-wrap md:gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="due" className="text-xs font-bold text-ink-muted">
              Хугацаа
            </label>
            <input
              id="due"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className={cn(fieldClass, "border-lavender bg-white md:px-3.5")}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-muted">Хэнд</span>
            <span
              title="Энэ сэдэв дээр хоцорсон сурагчид. Хэн болох нь харагдахгүй."
              className="flex h-12 items-center rounded-tile bg-surface px-3 text-[15px] font-bold md:px-4"
            >
              {targetCount} хоцорсон сурагч
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap">
          {published && (
            <Button variant="white" size="sm" onClick={unpublish} disabled={saving}>
              Ноорог болгох
            </Button>
          )}
          <Button size="sm" disabled={!hasQuestions || saving} onClick={publish}>
            <svg {...iconProps} strokeWidth="2.6" className="size-[18px]">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {published ? "Шинэчилж илгээх" : "Батлаад илгээх"}
          </Button>
        </div>
      </div>

      <div role="status" aria-live="polite">
        {toast && (
          <p className="teacher-toast mt-3 flex items-center gap-2.5 rounded-card bg-black px-4 py-3 text-sm font-semibold text-white md:mt-4 md:inline-flex md:rounded-full md:px-[18px]">
            <svg {...iconProps} strokeWidth="2.4" className="size-[18px] shrink-0 stroke-sky">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {toast}
          </p>
        )}
      </div>
    </section>
  );
}

/** Draft / published state: a two-part switch on desktop, one pill on mobile. */
function StatusPill({ published }: { published: boolean }) {
  const draftPill = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-bold md:bg-white md:px-3.5 md:py-1.5 md:text-[13px] md:shadow-[0_4px_12px_rgb(0_0_0/0.08)]">
      <span aria-hidden="true" className="size-2 rounded-full bg-magenta" />
      Ноорог
    </span>
  );
  const publishedPill = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-2.5 py-1 text-xs font-bold md:px-3.5 md:py-1.5 md:text-[13px]">
      <svg {...iconProps} strokeWidth="3.4" className="size-3">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Нийтэлсэн
    </span>
  );
  const inactive = (label: string) => (
    <span
      aria-hidden="true"
      className="hidden px-3.5 py-1.5 text-[13px] font-semibold text-ink-muted md:inline"
    >
      {label}
    </span>
  );

  return (
    <p className="flex shrink-0 items-center gap-1 rounded-full md:bg-surface md:p-1">
      <span className="sr-only">Төлөв: </span>
      {published ? (
        <>
          {inactive("Ноорог")}
          {publishedPill}
        </>
      ) : (
        <>
          {draftPill}
          {inactive("Нийтэлсэн")}
        </>
      )}
    </p>
  );
}
