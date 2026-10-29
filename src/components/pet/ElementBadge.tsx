import { cn } from "@/lib/cn";
import { ELEMENT_LABELS } from "@/lib/pets";
import type { PetElement } from "@/lib/types";

/** Background and text colour per element, also used by the type filters on /pets. */
export const ELEMENT_COLORS: Record<PetElement, string> = {
  water: "bg-sky text-ink",
  fire: "bg-magenta text-white",
  wood: "bg-line text-ink",
  ice: "bg-lavender text-ink",
  sky: "bg-primary text-white",
  metal: "bg-night text-white",
  earth: "bg-white text-ink",
  shadow: "bg-primary-dark text-white",
};

export function ElementBadge({
  element,
  className,
}: {
  element: PetElement;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.75 text-sm font-bold",
        ELEMENT_COLORS[element],
        // White on white needs an outline.
        element === "earth" && "border-2 border-ink",
        className,
      )}
    >
      {ELEMENT_LABELS[element]}
    </span>
  );
}
