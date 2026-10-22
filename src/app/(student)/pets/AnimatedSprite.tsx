import { PetSprite } from "@/components/pet/PetSprite";
import { cn } from "@/lib/cn";
import type { PetStage } from "@/lib/types";

type AnimatedSpriteProps = {
  stage: PetStage;
  /** Size in px below and from the md breakpoint. */
  mobile: number;
  desktop: number;
  /** Offsets the idle animation so neighbours don't move in sync. */
  delay?: number;
  alt?: string;
};

/**
 * A pet that follows the page mood (see pets.css). PetSprite sizes itself
 * inline, so one is rendered per breakpoint.
 */
export function AnimatedSprite({
  stage,
  mobile,
  desktop,
  delay = 0,
  alt,
}: AnimatedSpriteProps) {
  return (
    <span className="pets-sprite" style={{ animationDelay: `${-delay}s` }}>
      {mobile === desktop ? (
        <PetSprite stage={stage} size={mobile} alt={alt} />
      ) : (
        <>
          <PetSprite
            stage={stage}
            size={mobile}
            alt={alt}
            className="md:hidden"
          />
          <PetSprite
            stage={stage}
            size={desktop}
            alt={alt}
            className="hidden md:block"
          />
        </>
      )}
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
