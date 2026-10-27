import type { RetryStats } from "../_lib/retry";

type RetryNoteProps = {
  stats: RetryStats;
  /** Extra notes for the teacher after the repeats, e.g. guessing. */
  children?: React.ReactNode;
};

/** Line on the results for the teacher: how many of the repeated tasks the player fixed. */
export function RetryNote({ stats, children }: RetryNoteProps) {
  if (!stats.retried && !children) return null;
  return (
    <p className="max-w-[330px] rounded-[14px] border border-[var(--game-line)] bg-white/5 px-3 py-2 text-left text-[13px] text-[var(--game-muted)]">
      <b className="text-white">Багшид: </b>
      {stats.retried ? `давталтаар ${stats.fixed}/${stats.retried} засагдсан` : null}
      {children}
    </p>
  );
}
