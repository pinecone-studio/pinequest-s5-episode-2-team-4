import { cn } from "@/lib/cn";

type RoundProgressProps = {
  /** Index of the round being played; equal to `total` when the session is over. */
  current: number;
  total: number;
  /** Replaces the "2/5" count, e.g. "Давталт". */
  label?: string;
};

export function RoundProgress({ current, total, label }: RoundProgressProps) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Даалгавар ${Math.min(current + 1, total)} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-[7px] flex-1 rounded-full border transition-colors",
            i < current
              ? "game-gradient border-transparent"
              : i === current
                ? "border-[#8b5cff] bg-[#3a2a7a]"
                : "game-chip",
          )}
        />
      ))}
      <b className="text-xs whitespace-nowrap text-[var(--game-muted)] tabular-nums">
        {label ?? `${Math.min(current + 1, total)}/${total}`}
      </b>
    </div>
  );
}
