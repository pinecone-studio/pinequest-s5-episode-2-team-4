import { cn } from "@/lib/cn";
import { ELEMENT_LABELS } from "@/lib/pets";
import type { PetElement } from "@/lib/types";

/** Soft tint and dark ink per element, also used by the type filters on /pets. */
export const ELEMENT_COLORS: Record<PetElement, string> = {
  water: "bg-tint-blue text-tint-blue-ink",
  fire: "bg-tint-pink text-tint-pink-ink",
  wood: "bg-tint-violet text-tint-violet-ink",
  ice: "bg-tint-periwinkle text-tint-periwinkle-ink",
  sky: "bg-tint-purple text-tint-purple-ink",
  metal: "bg-tint-gray text-tint-gray-ink",
  earth: "bg-tint-sand text-tint-sand-ink",
  shadow: "bg-tint-plum text-tint-plum-ink",
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
        className,
      )}
    >
      {ELEMENT_LABELS[element]}
    </span>
  );
}
