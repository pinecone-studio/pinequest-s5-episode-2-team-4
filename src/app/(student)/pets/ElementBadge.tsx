import { cn } from "@/lib/cn";
import type { PetElement } from "./pet-lines";

const ELEMENTS: Record<PetElement, { label: string; className: string }> = {
  water: { label: "Ус", className: "bg-sky" },
  fire: { label: "Гал", className: "bg-magenta text-black" },
  wood: { label: "Мод", className: "bg-line" },
  ice: { label: "Мөс", className: "bg-lavender" },
  sky: { label: "Тэнгэр", className: "bg-primary text-white" },
  metal: { label: "Төмөр", className: "bg-black text-white" },
  earth: { label: "Шороо", className: "border-2 border-ink bg-white" },
  shadow: { label: "Сүүдэр", className: "bg-ink text-white" },
};

type ElementBadgeProps = {
  element: PetElement;
  size?: "sm" | "md";
};

export function ElementBadge({ element, size = "md" }: ElementBadgeProps) {
  const { label, className } = ELEMENTS[element];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full",
        size === "sm"
          ? "px-2.5 py-[3px] text-xs font-bold md:px-3 md:py-1 md:text-[13px]"
          : "px-3 py-[5px] text-[13px] font-semibold md:px-[18px] md:py-2 md:text-[15px]",
        className,
      )}
    >
      {label}
    </span>
  );
}
