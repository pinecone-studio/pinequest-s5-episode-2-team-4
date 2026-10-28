import { cn } from "@/lib/cn";
import type { AnonQuestion } from "@/lib/types";
import { askedBy, type GroupView } from "./QuestionGroupCard";

/** The wrong idea behind most of the group's questions (counting «Би ч бас»), as the AI saw it. */
function commonMisconception(questions: AnonQuestion[]) {
  const votes = new Map<string, number>();
  for (const q of questions) {
    if (q.misconception)
      votes.set(
        q.misconception,
        (votes.get(q.misconception) ?? 0) + 1 + q.meToo,
      );
  }
  return [...votes].sort((a, b) => b[1] - a[1])[0]?.[0];
}

type GroupSummaryProps = {
  group: GroupView;
  answered: boolean;
  /** Shows the ✏️ button; left out while a form is open. */
  onRename?: () => void;
};

/** A group's title, how many asked, its questions and what the AI noticed. */
export function GroupSummary({
  group: g,
  answered,
  onRename,
}: GroupSummaryProps) {
  const misconception = commonMisconception(g.questions);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1">
            <b className="text-base md:text-lg">{g.title}</b>
            {onRename ? (
              <button
                type="button"
                aria-label="Нэр солих"
                title="Нэр солих"
                onClick={onRename}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-white hover:text-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-4"
                >
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            ) : null}
          </span>
          <span className="text-[13px] text-ink-muted">
            {g.subtopicTitle} · {g.questions.length} асуулт ·{" "}
            <span
              className={cn(
                "font-bold",
                answered ? "text-ink" : "text-magenta",
              )}
            >
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

      {misconception ? (
        <p className="mt-3 rounded-field border-2 border-lavender bg-white px-3.5 py-2.5 text-[15px]">
          <span className="block text-xs font-bold text-primary">
            🤖 AI-ийн ажиглалт · нийтлэг буруу ойлголт
          </span>
          {misconception}
        </p>
      ) : null}
    </>
  );
}
