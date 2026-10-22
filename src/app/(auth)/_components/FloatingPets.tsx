import { PetSprite } from "@/components/pet/PetSprite";
import { cn } from "@/lib/cn";
import type { PetStage } from "@/lib/types";

type FloatingPetsProps = {
  /** Position in % of the page area, e.g. { left: 7, top: 26 } */
  pets: { stage: PetStage; left: number; top: number }[];
  size?: "md" | "lg";
};

/** Decorative pets in white bubbles around the form; desktop only. */
export function FloatingPets({ pets, size = "md" }: FloatingPetsProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
      {pets.map(({ stage, left, top }, i) => (
        <div
          key={stage.name}
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-white shadow-card",
            size === "lg" ? "size-26" : "size-21",
          )}
          style={{ left: `${left}%`, top: `${top}%` }}
        >
          {/* stagger so the pets don't bob in sync */}
          <span className="animate-bob" style={{ animationDelay: `${-0.4 - i * 0.5}s` }}>
            <PetSprite stage={stage} />
          </span>
        </div>
      ))}
    </div>
  );
}
