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
const TEAMS = {
  left: { shirt: "#ffcf5a", trim: "#b8892a" },
  right: { shirt: "#e30ba6", trim: "#8f0068" },
};

/** One puller leaning back from the rope; drawn for the left team, mirrored for the right. */
function Puller({ x, side }: { x: number; side: "left" | "right" }) {
  const team = TEAMS[side];
  return (
    <g transform={side === "right" ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>
      <g className="tug-lean" style={{ transformOrigin: `${x - 16}px ${GROUND}px` }}>
        {/* legs braced against the ground */}
        <path d={`M${x - 20} 150 L${x - 6} ${GROUND - 2}`} stroke="#3a2a6b" strokeWidth="7" strokeLinecap="round" />
        <path d={`M${x - 22} 150 L${x - 36} ${GROUND - 2}`} stroke="#3a2a6b" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx={x - 4} cy={GROUND} rx="6" ry="3" fill="#1d1647" />
        <ellipse cx={x - 38} cy={GROUND} rx="6" ry="3" fill="#1d1647" />
        {/* shorts, then the shirt with a stripe and a number */}
        <path d={`M${x - 22} 152 L${x - 19} 140`} stroke="#1d1647" strokeWidth="13" strokeLinecap="round" />
        <path d={`M${x - 19} 140 L${x - 12} 112`} stroke={team.shirt} strokeWidth="14" strokeLinecap="round" />
        <path d={`M${x - 20} 132 L${x - 13} 118`} stroke={team.trim} strokeWidth="2.5" strokeLinecap="round" />
        {/* arms to the rope */}
        <path d={`M${x - 12} 118 L${x + 2} ${ROPE_Y}`} stroke="#f1c7a0" strokeWidth="5" strokeLinecap="round" />
        {/* head with a headband */}
        <circle cx={x - 15} cy="98" r="10" fill="#f1c7a0" />
        <path d={`M${x - 25} 95 a10 10 0 0 1 20 0`} fill="#2b1a10" />
        <path d={`M${x - 25} 97 h20`} stroke={team.trim} strokeWidth="3" />
        <circle cx={x - 10} cy="100" r="1.3" fill="#111" />
      </g>
    </g>
  );
}

/** Field with a mud pit, two win lines, the rope with its flag and both teams pulling. */
export function RopeScene({ rope, heaves, running }: RopeSceneProps) {
  // + rope moves everything toward the player's side (left).
  const shift = -(rope / LIMIT) * LINE;
  const danger = rope < -LIMIT * 0.6;

  return (
    <svg viewBox={`0 -90 ${W} 300`} role="img" aria-label={`Туг ${rope >= 0 ? "чиний" : "ботуудын"} тал руу ${Math.round(Math.abs(rope))}%`} className="block w-full">
      <defs>
        <linearGradient id="tug-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1f6b" />
          <stop offset="1" stopColor="#5a3fb0" />
        </linearGradient>
        <pattern id="tug-grass" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#3f9a4f" />
          <rect width="20" height="40" fill="#398d48" />
        </pattern>
      </defs>

      <rect y="-90" width={W} height="300" fill="url(#tug-sky)" />
      <circle cx="450" cy="-58" r="18" fill="#ffcf5a" opacity="0.85" />
      {/* stands: three rows of cheering heads */}
      <rect y="-20" width={W} height="90" fill="#3d2a85" />
      {[0, 1, 2].map((row) => (
        <g key={row} className="tug-crowd" style={{ animationDelay: `${row * 0.2}s` }}>
          <rect y={-8 + row * 24} width={W} height="6" fill="#2b1f6b" />
          {Array.from({ length: 27 }, (_, i) => (
            <circle
              key={i}
              cx={(row % 2 ? 0 : 10) + i * 20}
              cy={8 + row * 24}
              r="7"
              fill={["#ffcf5a", "#f6f3ff", "#38bdf8", "#e30ba6", "#34d399"][(i + row) % 5]}
            />
          ))}
        </g>
      ))}
      {/* team banners */}
      <rect x="12" y="-80" width="104" height="22" rx="6" fill="#ffcf5a" />
      <text x="64" y="-65" textAnchor="middle" fontSize="12" fontWeight="800" fill="#2a1600">ЧИНИЙ БАГ</text>
      <rect x={W - 116} y="-80" width="104" height="22" rx="6" fill="#e30ba6" />
      <text x={W - 64} y="-65" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">БОТ БАГ</text>
      <rect y="62" width={W} height="8" fill="#2b1f6b" />
      <rect y="70" width={W} height="140" fill="url(#tug-grass)" />
      {/* mud pit and lines */}
      <ellipse cx={MID} cy={GROUND + 4} rx="58" ry="14" fill="#7a4a24" />
      <ellipse cx={MID} cy={GROUND + 2} rx="46" ry="9" fill="#93592b" />
      <path d={`M${MID} 86 V200`} stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="6 6" />
      <path d={`M${MID - LINE} 80 V204`} stroke="#ffcf5a" strokeWidth="4" />
      <path d={`M${MID + LINE} 80 V204`} stroke="#e30ba6" strokeWidth="4" />
      <rect x={MID - LINE - 22} y="196" width="44" height="12" rx="3" fill="#ffcf5a" />
      <text x={MID - LINE} y="205" textAnchor="middle" fontSize="8" fontWeight="800" fill="#2a1600">ЯЛАЛТ</text>
      <rect x={MID + LINE - 22} y="196" width="44" height="12" rx="3" fill="#e30ba6" />
      <text x={MID + LINE} y="205" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">ЯЛАЛТ</text>

      <g className="tug-rope" style={{ transform: `translateX(${shift.toFixed(1)}px)` }}>
        {/* rope */}
        <path d={`M-40 ${ROPE_Y} H${W + 40}`} stroke="#8a6a3a" strokeWidth="7" strokeLinecap="round" />
        <path d={`M-40 ${ROPE_Y} H${W + 40}`} stroke="#c9a86b" strokeWidth="3" strokeDasharray="5 4" />
        {/* flag at the middle of the rope */}
        <g className={cn(danger && "tug-flag-danger")}>
          <path d={`M${MID} ${ROPE_Y} v26`} stroke="#fff" strokeWidth="2.5" />
          <path className="tug-flag" d={`M${MID} ${ROPE_Y + 4} l16 6 -16 6z`} fill="#ff4d6d" style={{ transformOrigin: `${MID}px ${ROPE_Y + 10}px` }} />
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
