import { cn } from "@/lib/cn";
import type { PetStage } from "@/lib/types";

type PetSpriteProps = {
  stage: PetStage;
  /** Rendered size in px; sprites are 64×64 pixel art and scale without blur. */
  size?: number;
  /** Leave empty when a nearby label already names the pet. */
  alt?: string;
  className?: string;
};

export function PetSprite({ stage, size = 64, alt = "", className }: PetSpriteProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny pixel art, no optimization needed
    <img
      src={stage.sprite}
      alt={alt}
      width={size}
      height={size}
      className={cn("[image-rendering:pixelated]", className)}
      style={{ width: size, height: size }}
    />
  );
}
