import { cn } from "@/lib/cn";

type HpBarProps = {
  value: number;
  max: number;
  /** Accessible name, e.g. "Bigfin HP". */
  label: string;
  tone: "boss" | "pet";
  className?: string;
};

/** HP bar with the numbers on it. */
export function HpBar({ value, max, label, tone, className }: HpBarProps) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("relative h-5 overflow-hidden rounded-full bg-surface md:h-6", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "boss" ? "bg-magenta" : percent <= 25 ? "bg-magenta" : "bg-primary",
        )}
        style={{ width: `${percent}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-ink md:text-sm">
        {value} / {max}
      </span>
    </div>
  );
}
