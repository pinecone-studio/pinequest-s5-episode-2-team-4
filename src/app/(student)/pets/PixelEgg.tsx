import type { Rarity } from "@/lib/types";
import { EGG_COLORS } from "./battle/labels";

// A 12×14 pixel egg, drawn as whole cells so it stays crisp at any size.
const SHELL =
  "M4 0h4v1h1v1h1v2h1v3h1v4h-1v2h-1v1h-2v1h-4v-1h-2v-1h-1v-2h-1v-4h1v-3h1v-2h1v-1h1z";
const SPOTS = "M4 3h2v2h-2zM8 6h2v2h-2zM3 9h2v1h-2zM7 10h2v2h-2z";

export function PixelEgg({
  rarity,
  size = 64,
  className,
}: {
  rarity: Rarity;
  size?: number;
  className?: string;
}) {
  const { shell, spots } = EGG_COLORS[rarity];
  return (
    <svg
      viewBox="0 0 12 14"
      width={size}
      height={(size * 14) / 12}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <path d={SHELL} fill="#3f0791" transform="translate(0.5 0.5) scale(0.92)" />
      <path d={SHELL} fill={shell} transform="translate(0.95 0.95) scale(0.84)" />
      <path d={SPOTS} fill={spots} />
    </svg>
  );
}
