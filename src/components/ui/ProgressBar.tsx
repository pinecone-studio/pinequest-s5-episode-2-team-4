import { cn } from "@/lib/cn";

type ProgressBarProps = {
  /** 0–100 */
  value: number;
  /** Accessible name, e.g. "XP" or "Тестийн явц". */
  label: string;
  size?: "sm" | "md";
  /** Use "white" on tinted backgrounds. */
  track?: "surface" | "white";
  className?: string;
};

export function ProgressBar({
  value,
  label,
  size = "md",
  track = "surface",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "overflow-hidden rounded-full",
        size === "sm" ? "h-2" : "h-3.5",
        track === "white" ? "bg-white" : "bg-surface",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
