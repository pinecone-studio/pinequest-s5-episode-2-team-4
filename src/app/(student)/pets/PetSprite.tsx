import { cn } from "@/lib/cn";

type PetSpriteProps = {
  className?: string;
  /** Offsets the idle animation so neighbours don't move in sync. */
  delay?: number;
};

// TODO(#9): replace with the shared PetSprite component.
export function PetSprite({ className, delay = 0 }: PetSpriteProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("pets-sprite flex items-center justify-center", className)}
      style={{ animationDelay: `${-delay}s` }}
    >
      <span className="size-3/5 rounded-full bg-lavender" />
    </span>
  );
}

/** "z Z" shown above sprites while the pets are sleepy. */
export function SleepyZz({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pets-zz absolute leading-none font-bold text-primary",
        className,
      )}
    >
      z <span className="text-[1.4em]">Z</span>
    </span>
  );
}
