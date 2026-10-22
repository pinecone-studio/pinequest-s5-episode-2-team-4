import { cn } from "@/lib/cn";
import { ELEMENT_LABELS } from "@/lib/pets";
import type { PetElement } from "@/lib/types";

const colors: Record<PetElement, string> = {
  water: "bg-sky text-ink",
  fire: "bg-magenta text-black",
  wood: "bg-line text-ink",
  ice: "bg-lavender text-ink",
  sky: "bg-primary text-white",
  metal: "bg-black text-white",
  earth: "border-2 border-ink bg-white text-ink",
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
        "inline-flex items-center rounded-full px-3 py-0.75 text-[13px] font-bold",
        colors[element],
        className,
      )}
    >
      {ELEMENT_LABELS[element]}
    </span>
  );
}
