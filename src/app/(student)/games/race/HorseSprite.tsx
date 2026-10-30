import { pixelPaths } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/cn";

type HorseSpriteProps = {
  /** Jockey silk color. */
  silk: string;
  /** Horse coat color. */
  coat: string;
  number: number;
  /** Legs gallop while true. */
  running?: boolean;
  className?: string;
};

// Pixel art on a 32 × 25 grid, 2 viewBox units per pixel: each letter is a
// palette colour, "." is empty. C coat, D mane/tail/hooves, S silk, W saddle
// cloth and helmet stripe, J breeches, K eye.

const BODY = [
  "................SSS.............", "...............SSSSW............", "...............SSSS......C......",
  "................SS......CCC.....", "...............SSSS....DCCCC....", "..............SSSSSS..DCCCKCC...",
  "..............SSSSSSS.DCCCCCCC..", "...............SSSSSSDCCC..CCCC.", "..............JSSSS.DCCC........",
  ".........CCCCWWWWWWCDCCC........", ".......CCCCCCWWWWWWCCCCC........", "......DCCCCCCWWWWWWCCCCCC.......",
  ".....DDCCCCCCWWWWWWCCCCCC.......", "....DD.CCCCCCCCCCCCCCCCCC.......", "...DD...CCCCCCCCCCCCCCCC........",
  "...D.....CCCCCCCCCCCCCC.........", "..D.......CC.CC....CC.CC........",
];
/** Legs together, then stretched out: the two gallop frames. */
const LEGS = {
  a: [
    "..........CC.CC....CC.CC........", "..........CC.CC....CC.CC........", "..........CC.CC....CC.CC........",
    "..........CC.CC....CC.CC........", "..........CC.CC....CC.CC........", "..........DD.DD....DD.DD........",
  ],
  b: [
    ".........CC...CC..CC...CC.......", "........CC.....CC.CC....CC......", ".......CC......CCCC......CC.....",
    "......CC........CC........CC....", ".....DD.........DD.........DD...",
  ],
};

function Frame({ rows, palette, className }: { rows: string[]; palette: Record<string, string>; className: string }) {
  return (
    <g transform="scale(2)" className={className}>
      {pixelPaths({ rows, palette }).map(([fill, d]) => (
        <path key={fill} fill={fill} d={d} />
      ))}
    </g>
  );
}

/** Side-view pixel horse with a jockey, facing right; two leg frames swap while running. */
export function HorseSprite({ silk, coat, number, running, className }: HorseSpriteProps) {
  const palette = { C: coat, D: "#2b1a10", S: silk, W: "#fff", J: "#f4efe6", K: "#111" };
  return (
    <svg viewBox="0 0 64 50" shapeRendering="crispEdges" aria-hidden="true" className={cn("overflow-visible", running && "race-running", className)}>
      <Frame rows={[...BODY, ...LEGS.a]} palette={palette} className="race-frame-a" />
      <Frame rows={[...BODY, ...LEGS.b]} palette={palette} className="race-frame-b" />
      {/* the number on the saddle cloth */}
      <text x="32" y="24.5" textAnchor="middle" fontSize="7" fontWeight="800" fill="#1d1647">
        {number}
      </text>
    </svg>
  );
}
