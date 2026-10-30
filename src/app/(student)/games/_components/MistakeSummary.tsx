import type { GameQuestion } from "@/lib/types";
import { answerLabel } from "../_lib/shapes";

/**
 * After an assignment game: every question the student missed, with its
 * right answer and the teacher's (or AI's) explanation of the mistake.
 */
export function MistakeSummary({ questions, missedIds }: { questions: GameQuestion[]; missedIds: string[] }) {
  const missed = missedIds.flatMap((id) => questions.find((q) => q.id === id) ?? []);
  if (!missed.length) {
    return (
      <p className="game-chip w-full max-w-[420px] rounded-[14px] px-3 py-2 text-sm font-bold text-white">
        Бүх асуултад зөв хариуллаа 🎉
      </p>
    );
  }
  return (
    <section aria-labelledby="mistakes-title" className="w-full max-w-[420px] text-left">
      <h3 id="mistakes-title" className="mb-1.5 text-sm font-extrabold text-[var(--game-gold)]">
        Алдсан асуултууд · {missed.length}
      </h3>
      <ol className="flex flex-col gap-2">
        {missed.map((q) => (
          <li key={q.id} className="rounded-[14px] border border-[rgb(255_207_90/0.3)] bg-[rgb(255_207_90/0.08)] px-3 py-2 text-sm">
            <p className="font-bold text-white">{q.prompt}</p>
            <p className="mt-0.5 text-[var(--game-muted)]">
              Зөв хариулт: <b className="text-white">{answerLabel(q.correct[0])}</b>
            </p>
            {q.explanation && <p className="mt-1 text-[var(--game-muted)]">{q.explanation}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
