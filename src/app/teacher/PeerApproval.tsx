"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { AnonQuestion } from "@/lib/types";

type PeerApprovalProps = {
  /** Questions with a classmate's answer waiting for the teacher. */
  questions: (AnonQuestion & { subtopicTitle: string })[];
  className?: string;
};

/** XP the helper gets once the teacher approves the answer. */
const HELP_XP = 10;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Classmates' answers wait here so a wrong answer never reaches other
 * students. Mock: decisions stay in local state.
 */
export function PeerApproval({ questions, className }: PeerApprovalProps) {
  const [decided, setDecided] = useState<
    Record<string, "approved" | "rejected">
  >({});
  const pendingCount = questions.filter((q) => !decided[q.id]).length;

  return (
    <section
      aria-labelledby="peer-title"
      className={cn(
        "min-w-0 rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-7",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="peer-title"
          className="text-[22px] leading-[1.15] font-bold md:text-[28px] md:leading-[1.1]"
        >
          Сурагчдын хариулт
        </h2>
        <span className="rounded-full border-2 border-magenta bg-pink px-2.5 py-0.5 text-xs font-bold md:px-3 md:text-[13px]">
          {pendingCount}
          <span className="sr-only"> хүлээгдэж буй</span>
        </span>
      </div>
      <p className="mt-1 text-[13px] font-semibold text-ink-muted md:text-sm">
        Батлагдсан хариулт л ангийнхандаа харагдана.
      </p>

      {questions.length === 0 ? (
        <p className="mt-4 rounded-card bg-surface px-4 py-3 text-center text-sm font-semibold text-ink-muted">
          Батлах хариулт алга.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {questions.map((q) => {
            const decision = decided[q.id];
            return (
              <li key={q.id} className="rounded-card bg-surface p-4">
                <span className="text-[13px] text-ink-muted">
                  {q.subtopicTitle} · {q.time}
                </span>
                <p className="font-bold">“{q.text}”</p>
                <div className="mt-2 rounded-field bg-white px-3.5 py-2.5">
                  <span className="text-xs font-bold text-ink-muted">
                    №{pad(q.answer?.studentNo ?? 0)} хариулсан
                  </span>
                  <p className="text-[15px]">{q.answer?.text}</p>
                </div>
                {decision ? (
                  <p role="status" className="mt-2.5 text-sm font-bold">
                    {decision === "approved"
                      ? `Батлагдлаа · №${pad(q.answer?.studentNo ?? 0)} +${HELP_XP} XP авлаа`
                      : "Татгалзсан · ангийнхандаа харагдахгүй"}
                  </p>
                ) : (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setDecided((prev) => ({ ...prev, [q.id]: "approved" }))
                      }
                    >
                      Батлах
                    </Button>
                    <Button
                      variant="white"
                      size="sm"
                      onClick={() =>
                        setDecided((prev) => ({ ...prev, [q.id]: "rejected" }))
                      }
                    >
                      Татгалзах
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
