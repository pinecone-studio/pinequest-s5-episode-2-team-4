import { cn } from "@/lib/cn";
import "./PetAura.css";

/** A shop aura: sparkles or hearts in these colours (taken in turn). */
export type Aura = { shape: "sparkle" | "heart"; colors: string[] };

const SPARKLE = "M6 0l1.8 4.2L12 6l-4.2 1.8L6 12 4.2 7.8 0 6l4.2-1.8z";
const HEART = "M6 11 1 6a3 3 0 0 1 5-3 3 3 0 0 1 5 3z";
/** Where each shape sits, in % of the box around the pet. */
const SPOTS = [[8, 12], [78, 8], [88, 55], [2, 65], [45, 0]];

/**
 * Sparkles or hearts twinkling around a pet. Put it in the pet's positioned
 * box: it fills the box and scales with it.
 */
export function PetAura({ shape, colors, className }: Aura & { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      {SPOTS.map(([x, y], i) => (
        <svg
          key={i}
          viewBox="0 0 12 12"
          className="pet-aura absolute size-[18%]"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * 0.5}s` }}
        >
          <path d={shape === "heart" ? HEART : SPARKLE} fill={colors[i % colors.length]} stroke="rgb(0 0 0 / 0.15)" strokeWidth=".6" />
        </svg>
      ))}
    </span>
  );
}
