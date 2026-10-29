import { cn } from "@/lib/cn";

type TaskBannerProps = {
  ref?: React.Ref<HTMLDivElement>;
  tag: string;
  prompt: string;
  /** Result of each of the round's answers: true right, false wrong, undefined not yet. */
  marks: (boolean | undefined)[];
  /** Gold tag, e.g. for a repeat round. */
  highlight?: boolean;
};

/** The round's task at the top of the field, with one dot per answer to find. */
export function TaskBanner({ ref, tag, prompt, marks, highlight }: TaskBannerProps) {
  return (
    <div ref={ref} aria-live="polite" className="game-glass pointer-events-none absolute inset-x-3 top-3 flex items-center gap-2.5 rounded-2xl px-3 py-2.5">
      <span
        className={cn(
          "flex-none rounded-lg px-2 py-1 text-2xs font-extrabold tracking-[0.12em] uppercase",
          highlight ? "bg-[var(--game-gold)] text-[#2a1600]" : "game-gradient text-white",
        )}
      >
        {tag}
      </span>
      <span className="line-clamp-2 min-w-0 flex-1 leading-tight font-bold text-balance">{prompt}</span>
      <span className="flex flex-none gap-1.5" aria-label={`${marks.filter(Boolean).length} / ${marks.length} олсон`}>
        {marks.map((m, i) => (
          <i
            key={i}
            className={cn(
              "size-3.5 rounded-full border-2 transition-all",
              m === true && "scale-110 border-[var(--game-good)] bg-[var(--game-good)] shadow-[0_0_12px_var(--game-good)]",
              m === false && "border-[var(--game-bad)] bg-[var(--game-bad)]",
              m === undefined && "border-[var(--game-line)] bg-white/5",
            )}
          />
        ))}
      </span>
    </div>
  );
}
