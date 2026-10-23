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

/** 7×7 pixel sparkle, drawn as whole cells so it stays crisp at any size. */
const STAR_PATH = "M3 0h1v2h-1zM2 2h3v1h-3zM0 3h7v1h-7zM2 4h3v1h-3zM3 5h1v2h-1z";

const STAR_SPOTS = {
  // Around the big sprite on the student's pet card.
  lg: [
    { className: "top-6 left-10 size-5 text-magenta md:size-6", delay: 0 },
    { className: "top-16 right-10 size-4 text-primary md:right-8", delay: 0.5 },
    { className: "bottom-12 left-16 size-3.5 text-sky-dark md:size-4", delay: 1 },
  ],
  // Around a sprite in a stage tile.
  sm: [
    { className: "top-3 right-1/4 size-3 text-magenta md:size-4", delay: 0 },
    { className: "top-1/2 right-2 size-2.5 text-primary md:size-3", delay: 0.6 },
    { className: "bottom-3 left-3 size-2.5 text-sky-dark md:size-3.5", delay: 1.1 },
  ],
};

/** Pixel stars that twinkle around sprites while the pets are happy. */
export function HappyStars({ size }: { size: keyof typeof STAR_SPOTS }) {
  return STAR_SPOTS[size].map((spot) => (
    <svg
      key={spot.className}
      viewBox="0 0 7 7"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className={cn("pets-star absolute fill-current", spot.className)}
      style={{ animationDelay: `${spot.delay}s` }}
    >
      <path d={STAR_PATH} />
    </svg>
  ));
}
