import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { PetElement } from "@/lib/types";

/** What flies: a pet's attack (by its element) or the boss's. */
export type ShotKind = PetElement | "boss";

// 7×7 pixel shapes.
const STAR = "M3 0h1v2h-1zM2 2h3v1h-3zM0 3h7v1h-7zM2 4h3v1h-3zM3 5h1v2h-1z";
const ORB = "M2 0h3v1h-3zM1 1h5v1h-5zM0 2h7v3h-7zM1 5h5v1h-5zM2 6h3v1h-3z";
const DROP = "M3 0h1v1h-1zM2 1h3v2h-3zM1 3h5v3h-5zM2 6h3v1h-3z";
const LEAF = "M4 0h3v1h-3zM2 1h5v1h-5zM1 2h5v1h-5zM1 3h4v1h-4zM0 4h4v1h-4zM0 5h3v1h-3zM0 6h1v1h-1z";
const SHARD = "M3 0h1v1h-1zM2 1h3v1h-3zM1 2h5v3h-5zM2 5h3v1h-3zM3 6h1v1h-1z";
const ROCK = "M1 1h4v1h-4zM0 2h6v3h-6zM1 5h5v1h-5z";
const GUST = "M2 0h4v1h-4zM5 1h2v1h-2zM6 2h1v3h-1zM5 5h2v1h-2zM2 6h4v1h-4z";

const SHOTS: Record<ShotKind, { path: string; color: string }> = {
  fire: { path: ORB, color: "#ff8a3d" },
  water: { path: DROP, color: "#4cc3ff" },
  wood: { path: LEAF, color: "#5fd068" },
  ice: { path: SHARD, color: "#c9f3ff" },
  sky: { path: GUST, color: "#ffffff" },
  metal: { path: STAR, color: "#ffd166" },
  earth: { path: ROCK, color: "#c08a52" },
  shadow: { path: ORB, color: "#a66bff" },
  boss: { path: ORB, color: "#e30ba6" },
};

/**
 * One shot in flight. It sits at its start point; --dx / --dy (in `style`)
 * say how far it travels, and the arena-shot animation flies it there.
 */
export function ShotSprite({ kind, style }: { kind: ShotKind; style: CSSProperties }) {
  const { path, color } = SHOTS[kind];
  return (
    <svg
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      className={cn(
        "arena-shot block",
        kind === "boss" ? "-mt-4 -ml-4 size-8 md:-mt-5 md:-ml-5 md:size-10" : "-mt-3 -ml-3 size-6 md:-mt-4.5 md:-ml-4.5 md:size-9",
      )}
      style={{ ...style, fill: color, filter: `drop-shadow(0 0 3px ${color})` }}
    >
      <path d={path} />
    </svg>
  );
}
