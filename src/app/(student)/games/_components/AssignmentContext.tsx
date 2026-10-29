"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { type AttemptInput, submitAssignmentAttempt } from "@/lib/assignment-actions";
import type { SessionResult } from "../_lib/session";

type AssignmentInfo = { id: string; title: string; game: string };

const AssignmentContext = createContext<AssignmentInfo | undefined>(undefined);

/** Marks a game as played for a teacher's assignment, so its result is saved. */
export function AssignmentProvider({
  assignment,
  children,
}: {
  assignment?: AssignmentInfo;
  children: React.ReactNode;
}) {
  return <AssignmentContext value={assignment}>{children}</AssignmentContext>;
}

export const useAssignment = () => useContext(AssignmentContext);

/**
 * In the results panel of an assignment game: saves the result once and
 * shows the XP the pet got. Renders nothing outside an assignment.
 */
export function AssignmentResult({ result }: { result: SessionResult }) {
  const assignment = useAssignment();
  const [saved, setSaved] = useState<{ xp: number; done: boolean } | "error" | undefined>();
  const sent = useRef(false);

  useEffect(() => {
    if (!assignment || sent.current) return;
    sent.current = true;
    const attempt: AttemptInput = {
      game: assignment.game,
      score: result.score,
      accuracy: result.accuracy,
      stars: result.stars,
      bestCombo: result.bestCombo,
      missedIds: result.missedIds ?? [],
    };
    submitAssignmentAttempt(assignment.id, attempt)
      .then((r) => setSaved(r ?? "error"))
      .catch(() => setSaved("error"));
  }, [assignment, result]);

  if (!assignment) return null;
  return (
    <p role="status" className="max-w-[330px] rounded-[14px] border border-[rgb(124_255_178/0.35)] bg-[rgb(124_255_178/0.08)] px-3 py-2 text-sm font-bold text-white">
      {saved === undefined
        ? "Даалгаврын үр дүнг хадгалж байна…"
        : saved === "error"
          ? "Үр дүнг хадгалж чадсангүй. Дахин тоглоод үзээрэй."
          : saved.done
            ? `✓ «${assignment.title}» даалгавар биелсэн${saved.xp ? ` · Тэжээвэр +${saved.xp} XP` : ""}`
            : "Даалгавар хараахан биелээгүй: дор хаяж нэг асуултад зөв хариулаад дахин тоглоорой."}
    </p>
  );
}
