import { ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ClassGoal } from "@/lib/types";

type ClassGoalCardProps = {
  goal: ClassGoal;
  className?: string;
};

const xp = (n: number) => n.toLocaleString("en-US");

/** Shared class XP goal: every student's XP counts towards the reward. */
export function ClassGoalCard({ goal, className }: ClassGoalCardProps) {
  const left = Math.max(0, goal.targetXp - goal.currentXp);
  return (
    <section
      aria-labelledby="class-goal-title"
      className={cn(
        "rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:px-8 md:py-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="class-goal-title"
          className="type-section-title"
        >
          {goal.name} ангийн зорилго
        </h2>
        <p className="text-lg font-bold md:text-xl">
          {xp(goal.currentXp)}{" "}
          <span className="text-ink-muted">/ {xp(goal.targetXp)} XP</span>
        </p>
      </div>
      <ProgressBar
        value={(goal.currentXp / goal.targetXp) * 100}
        label="Ангийн XP"
        className="mt-3"
      />
      <p className="mt-2.5 text-sm font-bold text-ink-muted md:text-base">
        {left > 0
          ? `${xp(left)} XP үлдлээ · 🎁 ${goal.reward}`
          : `Зорилгод хүрлээ! 🎁 ${goal.reward}`}
      </p>
    </section>
  );
}
