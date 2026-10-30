import { pixelPaths } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/cn";
import { LIMIT } from "./rules";
import "./tug.css";

type RopeSceneProps = {
  /** Flag position, −LIMIT…LIMIT; + pulls toward the player's team on the left. */
  rope: number;
  /** Changes on every player pull, to replay the heave. */
  heaves: number;
  /** Whether the bots are pulling (the race is on). */
  running: boolean;
};

const W = 520;
const MID = W / 2;
/** The flag wins when it crosses a line this far from the middle. */
const LINE = 96;
const ROPE_Y = 128;
const GROUND = 178;
/** Hand positions along the rope, from the middle out. */
const SPOTS = [62, 112, 162];
/** SVG units per art pixel: the scene is pixel art, drawn with crisp edges. */
const P = 4;
const TEAMS = {
  left: { s: "#ffcf5a", t: "#b8892a" },
  right: { s: "#e30ba6", t: "#8f0068" },
};

/**
 * A puller leaning back from the rope, as pixel art (each letter a palette
 * colour, "." empty): headband, shirt with a stripe, arms to the rope at
 * row 10, legs braced. Its top left sits at (x − 46, 88), so the hand meets
 * the rope at (x + 2, ROPE_Y) and the feet the ground.
 */
const PULLER = [
  "......hhhh...", ".....hhhhhh..", ".....tttttt..", ".....ffffkf..", ".....ffffff..", "......ffff...",
  "......sss....", "......ssss...", "......sssff..", ".....ssss.ff.", ".....ssts..ff", ".....ssts....",
  "....ssss.....", "....dddd.....", "....dddd.....", "...ll..ll....", "...ll...ll...", "..ll....ll...",
  "..ll.....ll..", ".ll......ll..", ".ll.......ll.", ".ll.......ll.", "bbb.......bbb",
];
const PEOPLE = { h: "#2b1a10", f: "#f1c7a0", k: "#111", d: "#1d1647", l: "#3a2a6b", b: "#1d1647" };

/** The sun: a pixel disc. */
const SUN = ["..yyyy..", ".yyyyyy.", "yyyyyyyy", "yyyyyyyy", "yyyyyyyy", "yyyyyyyy", ".yyyyyy.", "..yyyy.."];

/** The flag on its pole: a stepped pennant. */
const FLAG = ["wrr...", "wrrrr.", "wrrrrr", "wrrrr.", "wrr...", "w.....", "w.....", "w....."];

/** Pixel art with its top left at (x, y); `className` goes on a wrapper so CSS transforms don't replace the placement. */
function Pixels({ rows, palette, x, y, className }: { rows: string[]; palette: Record<string, string>; x: number; y: number; className?: string }) {
  return (
    <g className={className}>
      <g transform={`translate(${x} ${y}) scale(${P})`}>
        {pixelPaths({ rows, palette }).map(([fill, d]) => (
          <path key={fill} fill={fill} d={d} />
        ))}
      </g>
    </g>
  );
}

/** One puller leaning back from the rope; drawn for the left team, mirrored for the right. */
function Puller({ x, side }: { x: number; side: "left" | "right" }) {
  return (
    <g transform={side === "right" ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>
      <g className="tug-lean" style={{ transformOrigin: `${x - 16}px ${GROUND}px` }}>
        <Pixels rows={PULLER} palette={{ ...PEOPLE, ...TEAMS[side] }} x={x - 46} y={88} />
      </g>
    </g>
  );
}

const SKY = ["#2b1f6b", "#33247c", "#3b2a8d", "#44309e", "#4d37a8", "#5a3fb0"];
const CROWD = ["#ffcf5a", "#f6f3ff", "#38bdf8", "#e30ba6", "#34d399"];

/** Field with a mud pit, two win lines, the rope with its flag and both teams pulling. */
export function RopeScene({ rope, heaves, running }: RopeSceneProps) {
  // + rope moves everything toward the player's side (left).
  const shift = Math.round((-(rope / LIMIT) * LINE) / P) * P;
  const danger = rope < -LIMIT * 0.6;

  return (
    <svg
      viewBox={`0 -90 ${W} 300`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Туг ${rope >= 0 ? "чиний" : "ботуудын"} тал руу ${Math.round(Math.abs(rope))}%`}
      className="block w-full"
    >
      <defs>
        <pattern id="tug-grass" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#3f9a4f" />
          <rect width="20" height="20" fill="#398d48" />
          <rect x="20" y="20" width="20" height="20" fill="#398d48" />
        </pattern>
      </defs>

      {/* sky in bands, a pixel sun */}
      {SKY.map((c, i) => (
        <rect key={c} y={-90 + i * 12} width={W} height="12" fill={c} />
      ))}
      <Pixels rows={SUN} palette={{ y: "#ffcf5a" }} x={340} y={-80} />
      {/* stands: three rows of cheering heads */}
      <rect y="-20" width={W} height="90" fill="#3d2a85" />
      {[0, 1, 2].map((row) => (
        <g key={row} className="tug-crowd" style={{ animationDelay: `${row * 0.2}s` }}>
          <rect y={-8 + row * 24} width={W} height="8" fill="#2b1f6b" />
          {Array.from({ length: 27 }, (_, i) => (
            <rect key={i} x={(row % 2 ? 0 : 8) + i * 20 - 6} y={2 + row * 24} width="12" height="12" fill={CROWD[(i + row) % 5]} />
          ))}
        </g>
      ))}
      {/* team banners */}
      <rect x="12" y="-80" width="104" height="24" fill="#ffcf5a" />
      <rect x="12" y="-56" width="104" height="4" fill="#b8892a" />
      <text x="64" y="-64" textAnchor="middle" fontSize="12" fontWeight="800" fill="#2a1600">ЧИНИЙ БАГ</text>
      <rect x={W - 116} y="-80" width="104" height="24" fill="#e30ba6" />
      <rect x={W - 116} y="-56" width="104" height="4" fill="#8f0068" />
      <text x={W - 64} y="-64" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">БОТ БАГ</text>
      <rect y="62" width={W} height="8" fill="#2b1f6b" />
      <rect y="70" width={W} height="140" fill="url(#tug-grass)" />
      {/* mud pit in steps, and the lines */}
      <rect x={MID - 48} y={GROUND - 8} width="96" height="24" fill="#7a4a24" />
      <rect x={MID - 60} y={GROUND - 4} width="120" height="16" fill="#7a4a24" />
      <rect x={MID - 36} y={GROUND - 4} width="72" height="12" fill="#93592b" />
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={i} x={MID - 1} y={86 + i * 8} width="2" height="4" fill="#fff" fillOpacity="0.5" />
      ))}
      <rect x={MID - LINE - 2} y="80" width="4" height="124" fill="#ffcf5a" />
      <rect x={MID + LINE - 2} y="80" width="4" height="124" fill="#e30ba6" />
      <rect x={MID - LINE - 24} y="196" width="48" height="12" fill="#ffcf5a" />
      <text x={MID - LINE} y="205" textAnchor="middle" fontSize="8" fontWeight="800" fill="#2a1600">ЯЛАЛТ</text>
      <rect x={MID + LINE - 24} y="196" width="48" height="12" fill="#e30ba6" />
      <text x={MID + LINE} y="205" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">ЯЛАЛТ</text>

      <g className="tug-rope" style={{ transform: `translateX(${shift}px)` }}>
        {/* rope: a dark band with a twisted, lighter stripe */}
        <rect x="-40" y={ROPE_Y - 4} width={W + 80} height="8" fill="#8a6a3a" />
        {Array.from({ length: Math.ceil((W + 80) / 12) }, (_, i) => (
          <rect key={i} x={-40 + i * 12} y={ROPE_Y - 2} width="6" height="4" fill="#c9a86b" />
        ))}
        {/* flag at the middle of the rope */}
        <g className={cn(danger && "tug-flag-danger")}>
          <Pixels rows={FLAG} palette={{ w: "#fff", r: "#ff4d6d" }} x={MID - 2} y={ROPE_Y} className="tug-flag" />
        </g>
        <g key={`heave-${heaves}`} className={cn(heaves > 0 && "tug-heave")}>
          {SPOTS.map((d) => (
            <Puller key={d} x={MID - LINE - d + 70} side="left" />
          ))}
        </g>
        <g className={cn(running && "tug-strain")}>
          {SPOTS.map((d) => (
            <Puller key={d} x={MID + LINE + d - 70} side="right" />
          ))}
        </g>
      </g>
    </svg>
  );
}
