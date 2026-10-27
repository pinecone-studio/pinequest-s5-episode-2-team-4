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

/** Side-view horse with a jockey, facing right; the legs swing while running. */
export function HorseSprite({ silk, coat, number, running, className }: HorseSpriteProps) {
  const legs = [
    { x: 21, group: "a" },
    { x: 25, group: "b" },
    { x: 39, group: "b" },
    { x: 43, group: "a" },
  ];
  return (
    <svg viewBox="0 0 64 50" aria-hidden="true" className={cn("overflow-visible", running && "race-running", className)}>
      {/* tail */}
      <path d="M15 22c-5 1-8 5-9 11 3-2 6-4 8-5" fill="none" stroke="#2b1a10" strokeWidth="3" strokeLinecap="round" />
      {/* legs */}
      {legs.map((l) => (
        <g key={l.x} className={`race-leg race-leg-${l.group}`} style={{ transformOrigin: `${l.x + 1.5}px 30px` }}>
          <rect x={l.x} y="29" width="3.2" height="14" rx="1.6" fill={coat} />
          <rect x={l.x - 0.3} y="41" width="3.8" height="3" rx="1" fill="#2b1a10" />
        </g>
      ))}
      {/* body, neck and head */}
      <ellipse cx="32" cy="26" rx="16" ry="8.5" fill={coat} />
      <path d="M41 23 48 9l6 2-6 17z" fill={coat} />
      <path d="M47 8c4-2 9 0 12 4 1 2 0 4-2 4l-8-1z" fill={coat} />
      <path d="M44 22 49 9" stroke="#2b1a10" strokeWidth="3" strokeLinecap="round" />
      <path d="m49 8 1-4 2 4z" fill={coat} />
      <circle cx="54" cy="10.5" r="1" fill="#111" />
      {/* saddle cloth with the number */}
      <rect x="26" y="18" width="11" height="9" rx="2" fill="#fff" />
      <text x="31.5" y="25.3" textAnchor="middle" fontSize="7" fontWeight="800" fill="#1d1647">
        {number}
      </text>
      {/* jockey */}
      <path d="M30 18c0-5 3-8 7-8 2 0 3 2 2 4l-3 5z" fill={silk} />
      <path d="M36 13l6 4" stroke={silk} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="36.5" cy="7" r="3.6" fill={silk} />
      <path d="M36.5 3.4a3.6 3.6 0 0 1 3.6 3.6H44" fill="none" stroke="#fff" strokeWidth="1.2" />
      <path d="M31 19l-2 6" stroke="#f4efe6" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
