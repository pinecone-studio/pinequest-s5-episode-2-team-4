// How a lesson reel is framed: its shape and the looping video behind it.
// Pure, so the teacher's chooser, the server and the player share it.

import type { ReelLayout } from "./types";

/** Looping videos a teacher can put behind a reel; files in public/reel-backgrounds/. */
export const REEL_BACKGROUNDS: { id: string; title: string; src: string }[] = [
  { id: "pixel-run", title: "Пиксел гүйлт", src: "/reel-backgrounds/pixel-run.mp4" },
  { id: "brick-blitz", title: "Тоосго хагалах", src: "/reel-backgrounds/brick-blitz.mp4" },
  { id: "star-dash", title: "Сансрын тулаан", src: "/reel-backgrounds/star-dash.mp4" },
];

export const reelBackground = (id: string | undefined) => REEL_BACKGROUNDS.find((b) => b.id === id);

/** A layout and background from untrusted input, keeping only known values. */
export function toReelFrame(v: { layout?: unknown; background?: unknown }): { layout?: ReelLayout; background?: string } {
  return {
    ...(v.layout === "horizontal" ? { layout: "horizontal" as const } : {}),
    ...(typeof v.background === "string" && reelBackground(v.background) ? { background: v.background } : {}),
  };
}
