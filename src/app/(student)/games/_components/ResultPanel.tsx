import Link from "next/link";
import { cn } from "@/lib/cn";
import { useGamePlayed } from "../_lib/played";
import type { SessionResult } from "../_lib/session";
import { AssignmentResult, useAssignment } from "./AssignmentContext";

type ResultPanelProps = {
  result: SessionResult;
  onAgain: () => void;
  otherHref: string;
  /** Extra lines, e.g. a teacher note or an unlocked skin. */
  children?: React.ReactNode;
};

const TITLES = { 1: "Сайн эхлэл!", 2: "Маш сайн!", 3: "Төгс! Алдаагүй" } as const;

function Star({ on, big, delay }: { on: boolean; big?: boolean; delay: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ animationDelay: `${delay}s` }}
      className={cn(big ? "size-13" : "size-10", on ? "game-pop fill-[var(--game-gold)] drop-shadow-[0_0_10px_rgb(255_207_90/0.6)]" : "fill-[var(--game-line)]")}
    >
      <path d="m12 2 3 7 7 .6-5.4 4.6L18 21l-6-3.7L6 21l1.4-6.8L2 9.6 9 9z" />
    </svg>
  );
}

/** End-of-session screen over the field: stars, score, accuracy, best combo and what to revisit. */
export function ResultPanel({ result, onAgain, otherHref, children }: ResultPanelProps) {
  // Played for an assignment: "other game" goes back to the assignments.
  const assignment = useAssignment();
  // Free play counts for today's quests here; an assignment counts when its result is saved.
  useGamePlayed(!assignment);
  const stats = [
    { value: result.score, label: "оноо" },
    { value: `${result.accuracy}%`, label: "нарийвчлал" },
    { value: `x${result.bestCombo}`, label: "шилдэг комбо" },
  ];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[radial-gradient(70%_50%_at_50%_30%,rgb(91_0_237/0.4),rgb(13_10_34/0.96))] p-5 text-center">
      <div className="flex items-end gap-1" role="img" aria-label={`${result.stars} од`}>
        <Star on={result.stars >= 1} delay={0} />
        <Star on={result.stars >= 2} big delay={0.2} />
        <Star on={result.stars >= 3} delay={0.4} />
      </div>
      <h2 className="text-xl font-extrabold">{TITLES[result.stars]}</h2>
      <dl className="grid w-full max-w-[330px] grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="game-chip flex flex-col-reverse rounded-[14px] px-1 py-2">
            <dt className="text-2xs text-[var(--game-muted)]">{s.label}</dt>
            <dd className="text-lg font-extrabold text-white">{s.value}</dd>
          </div>
        ))}
      </dl>
      {result.review ? (
        <p className="line-clamp-4 max-w-[330px] rounded-[14px] border border-[rgb(255_207_90/0.3)] bg-[rgb(255_207_90/0.08)] px-3 py-2 text-left text-sm text-[var(--game-muted)]">
          <b className="text-[var(--game-gold)]">Давтах нь: </b>
          {result.review}
        </p>
      ) : null}
      <AssignmentResult result={result} />
      {children}
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onAgain} className="game-gradient cursor-pointer rounded-[14px] px-6 py-3 font-extrabold text-white">
          Дахин тоглох
        </button>
        <Link href={assignment ? "/assignments" : otherHref} className="game-chip rounded-[14px] px-6 py-3 font-extrabold text-white no-underline hover:text-white">
          {assignment ? "Даалгаврууд" : "Өөр тоглоом"}
        </Link>
      </div>
    </div>
  );
}
