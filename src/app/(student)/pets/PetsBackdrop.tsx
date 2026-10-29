import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { Rarity } from "@/lib/types";
import { PixelEgg } from "./PixelEgg";
import "./PetsBackdrop.css";

/** Where a piece sits: offsets from the area's edges, and whether phones show it. */
type Spot = { style: CSSProperties; size: number; delay?: number; wide?: boolean };

// Pixel shapes, drawn in theme colours through currentColor.
const CLOUD = "M36 0h36v12h24v12h12v12H0V24h12V12h24z";
const SPARKLE = "M12 0l3.6 8.4 8.4 3.6-8.4 3.6-3.6 8.4-3.6-8.4L0 12l8.4-3.6z";
const STAR = "M1 0h1v1h1v1H2v1H1V2H0V1h1z";
const HEART = "M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z";

// Beside the page title and in the side margins, clear of the tabs and the title itself.
const CLOUDS: Spot[] = [
  { style: { left: "-1%", top: 250 }, size: 120 },
  { style: { right: "5%", top: 36 }, size: 104, delay: -5, wide: true },
  { style: { left: "46%", top: 70 }, size: 84, delay: -9, wide: true },
  { style: { right: "14%", top: 100 }, size: 72, delay: -3, wide: true },
];
const SPARKLES: (Spot & { color: string })[] = [
  { style: { left: "1.5%", top: 300 }, size: 22, color: "text-primary/45" },
  { style: { right: "2%", top: 380 }, size: 18, delay: -1, color: "text-magenta/45" },
  { style: { left: "48%", top: 150 }, size: 14, delay: -2, color: "text-sky-dark", wide: true },
  { style: { right: "3%", top: 760 }, size: 20, delay: -0.6, color: "text-primary/40", wide: true },
  { style: { left: "2.5%", top: 1040 }, size: 18, delay: -1.6, color: "text-sky-dark", wide: true },
  { style: { right: "2.5%", top: 1380 }, size: 16, delay: -2.2, color: "text-magenta/40", wide: true },
];
const STARS: Spot[] = [
  { style: { left: "8%", top: 40 }, size: 9 },
  { style: { right: "12%", top: 120 }, size: 9, delay: -1.2 },
  { style: { left: "26%", top: 64 }, size: 6, delay: -0.4, wide: true },
  { style: { right: "40%", top: 96 }, size: 6, delay: -2, wide: true },
  { style: { left: "1%", top: 640 }, size: 9, delay: -0.8, wide: true },
  { style: { right: "1.5%", top: 1100 }, size: 9, delay: -1.8, wide: true },
  { style: { left: "3%", top: 1560 }, size: 6, delay: -0.2, wide: true },
];
const HEARTS: Spot[] = [
  { style: { left: "2.5%", top: 520 }, size: 21, delay: -1 },
  { style: { right: "2%", top: 980 }, size: 18, delay: -2.5, wide: true },
];
const EGGS: (Spot & { rarity: Rarity })[] = [
  { style: { right: "1.5%", top: 540 }, size: 30, rarity: "rare", wide: true },
  { style: { left: "1.5%", top: 1260 }, size: 26, delay: -2, rarity: "common", wide: true },
];

const shown = (spot: Spot) => cn("absolute", spot.wide && "hidden md:block");
const delay = (spot: Spot) => ({ ...spot.style, animationDelay: `${spot.delay ?? 0}s` });

/**
 * Pixel art behind every pets page: drifting clouds, twinkling sparkles and
 * stars, floating hearts and eggs, and a meadow along the bottom. Pieces sit
 * near the edges and only decorate; phones get fewer.
 */
export function PetsBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {CLOUDS.map((c, i) => (
        <svg
          key={`cloud-${i}`}
          viewBox="0 0 108 36"
          width={c.size}
          height={(c.size * 36) / 108}
          shapeRendering="crispEdges"
          className={cn(shown(c), "pets-bg-drift text-lavender")}
          style={delay(c)}
        >
          <path d={CLOUD} fill="currentColor" />
        </svg>
      ))}
      {SPARKLES.map((s, i) => (
        <svg
          key={`sparkle-${i}`}
          viewBox="0 0 24 24"
          width={s.size}
          height={s.size}
          className={cn(shown(s), "pets-bg-twinkle", s.color)}
          style={delay(s)}
        >
          <path d={SPARKLE} fill="currentColor" />
        </svg>
      ))}
      {STARS.map((s, i) => (
        <svg
          key={`star-${i}`}
          viewBox="0 0 3 3"
          width={s.size}
          height={s.size}
          shapeRendering="crispEdges"
          className={cn(shown(s), "pets-bg-twinkle text-line")}
          style={delay(s)}
        >
          <path d={STAR} fill="currentColor" />
        </svg>
      ))}
      {HEARTS.map((h, i) => (
        <svg
          key={`heart-${i}`}
          viewBox="0 0 7 6"
          width={h.size}
          height={(h.size * 6) / 7}
          shapeRendering="crispEdges"
          className={cn(shown(h), "pets-bg-float text-magenta/35")}
          style={delay(h)}
        >
          <path d={HEART} fill="currentColor" />
        </svg>
      ))}
      {EGGS.map((e, i) => (
        <span key={`egg-${i}`} className={cn(shown(e), "pets-bg-float opacity-55")} style={delay(e)}>
          <PixelEgg rarity={e.rarity} size={e.size} />
        </span>
      ))}

      {/* Meadow: grass tufts and little flowers repeating along the bottom. */}
      <svg width="100%" height="44" shapeRendering="crispEdges" className="absolute inset-x-0 bottom-0">
        <defs>
          <pattern id="pets-meadow" width="120" height="44" patternUnits="userSpaceOnUse">
            <g className="fill-line">
              <rect x="8" y="26" width="6" height="10" />
              <rect x="16" y="20" width="6" height="16" />
              <rect x="24" y="28" width="6" height="8" />
              <rect x="66" y="24" width="6" height="12" />
              <rect x="74" y="30" width="6" height="6" />
              <rect x="47" y="24" width="3" height="12" />
              <rect x="101" y="26" width="3" height="10" />
            </g>
            <rect x="44" y="16" width="9" height="9" className="fill-magenta/40" />
            <rect x="98" y="18" width="9" height="9" className="fill-primary/35" />
          </pattern>
        </defs>
        <rect width="100%" height="36" fill="url(#pets-meadow)" />
        <rect y="36" width="100%" height="8" className="fill-lavender" />
      </svg>
    </div>
  );
}
