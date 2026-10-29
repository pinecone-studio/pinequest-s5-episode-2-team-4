"use client";

import { useEffect, useRef, useState } from "react";
import {
  askQuestion,
  setMeToo as saveMeToo,
  type AskResult,
} from "@/lib/question-actions";
import { PixelIcon } from "@/components/ui";
import type { AnonQuestion } from "@/lib/types";
import { ChatComposer } from "./ChatComposer";
import { ChatQuestion } from "./ChatQuestion";

type QuestionPanelProps = {
  /** Lesson the questions belong to. */
  subtopicId: string;
  /** Classmates' anonymous questions on this subtopic, newest first. */
  questions: AnonQuestion[];
};

/** Short line under a question the student sent, from what the server said. */
function sentNote(result: AskResult): React.ReactNode {
  if (!("error" in result))
    return result.duplicate ? (
      <>
        Ангийнхан ч асуусан · <PixelIcon name="hand" className="inline-block size-3 align-[-0.15em]" /> +1
      </>
    ) : (
      "Илгээсэн ✓"
    );
  if (result.error === "login") return "Асуухын тулд нэвтэрнэ үү";
  if (result.error === "noclass") return "Асуухын тулд эхлээд ангидаа нэгдээрэй";
  if (result.error === "failed") return "Илгээж чадсангүй";
  return "Илгээсэн ✓";
}

const now = () =>
  new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/**
 * Anonymous questions beside the lesson as a chat: classmates on the left,
 * mine on the right, answers as replies. The teacher or a classmate answers,
 * not the AI. New questions and «Би ч бас» are saved on the server.
 */
export function QuestionPanel({ subtopicId, questions }: QuestionPanelProps) {
  const [mine, setMine] = useState<
    { text: string; time: string; note: React.ReactNode }[]
  >([]);
  const [meToo, setMeToo] = useState<Set<string>>(new Set());
  const scroller = useRef<HTMLDivElement>(null);

  // Like a chat: open at the newest message and follow new ones.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mine]);

  function toggleMeToo(id: string) {
    void saveMeToo(id, !meToo.has(id));
    setMeToo((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  async function send(text: string) {
    const index = mine.length;
    setMine((prev) => [...prev, { text, time: now(), note: "Илгээж байна…" }]);
    const note = sentNote(await askQuestion(subtopicId, text));
    setMine((prev) => prev.map((m, i) => (i === index ? { ...m, note } : m)));
  }

  return (
    <aside
      id="tutor"
      aria-labelledby="questions-title"
      className="flex scroll-mt-6 flex-col overflow-hidden rounded-[25px] bg-white shadow-float md:rounded-panel"
    >
      <div className="flex items-center justify-between gap-2.5 bg-surface px-4.5 py-3.5 md:gap-3 md:px-5.5 md:py-4.5">
        <div className="flex items-center gap-2.5 md:gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white md:size-11"
          >
            ?
          </span>
          <h2
            id="questions-title"
            className="text-lg leading-tight font-bold md:text-xl"
          >
            Асуулт асуух
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted">
          <svg {...iconProps} strokeWidth={2.4} className="size-3">
            <rect width="18" height="11" x="3" y="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Нэргүй
        </span>
      </div>

      <div
        ref={scroller}
        className="flex max-h-[min(480px,65vh)] flex-col overflow-y-auto px-3.5 pt-3.5 pb-1.5 md:px-4.5 md:pt-4.5"
      >
        {questions.length === 0 && mine.length === 0 ? (
          <p className="py-4 text-center text-sm font-semibold text-ink-muted">
            Одоохондоо асуулт алга. Эхлээд чи асуу!
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {[...questions].reverse().map((q) => (
              <ChatQuestion
                key={q.id}
                question={q}
                meToo={meToo.has(q.id)}
                onMeToo={() => toggleMeToo(q.id)}
              />
            ))}
            {mine.map(({ text, time, note }, i) => (
              <li key={i} className="flex flex-col items-end gap-1">
                <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-primary px-3.5 py-2.5 text-white">
                  <p className="text-base">{text}</p>
                  <p className="mt-0.5 text-right text-2xs font-semibold opacity-80">
                    {time}
                  </p>
                </div>
                <p
                  role="status"
                  className="pr-1 text-2xs font-semibold text-ink-muted"
                >
                  {note}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <ChatComposer onSend={(text) => void send(text)} />
    </aside>
  );
}
