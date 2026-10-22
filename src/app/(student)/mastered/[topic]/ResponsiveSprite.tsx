import { PetSprite } from "@/components/pet/PetSprite";
import { cn } from "@/lib/cn";
import type { PetStage } from "@/lib/types";

type ResponsiveSpriteProps = {
  stage: PetStage;
  /** Size in px below and from the md breakpoint. */
  mobile: number;
  desktop: number;
  className?: string;
};

/** PetSprite sizes itself inline, so render one per breakpoint. */
export function ResponsiveSprite({
  stage,
  mobile,
  desktop,
  className,
}: ResponsiveSpriteProps) {
  return (
    <>
      <PetSprite
        stage={stage}
        size={mobile}
        className={cn("md:hidden", className)}
      />
      <PetSprite
        stage={stage}
        size={desktop}
        className={cn("hidden md:block", className)}
      />
    </>
  );
}
