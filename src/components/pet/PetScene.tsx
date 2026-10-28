import { cn } from "@/lib/cn";
import { PET_MOOD_LABELS, type PetMood } from "@/lib/pets";
import type { PetElement, PetStage } from "@/lib/types";
import { ElementBadge } from "./ElementBadge";
import { PetSprite } from "./PetSprite";
import "./PetScene.css";

type PetSceneProps = {
  stage: PetStage;
  level: number;
  element: PetElement;
  /** From the learning streak (`petMood`), never a toggle. */
  mood: PetMood;
  className?: string;
};

/**
 * The student's pet in its pixel-art habitat (design: Тэжээвэр), with its
 * name, level and type. The mood sets how it moves and whether it's night.
 */
export function PetScene({ stage, level, element, mood, className }: PetSceneProps) {
  return (
    <section
      aria-labelledby="pet-scene-name"
      className={cn(
        `pet-scene pet-scene--${mood}`,
        "relative h-75 overflow-hidden rounded-[25px] bg-lavender shadow-float md:h-150 md:rounded-panel",
        className,
      )}
    >
      <SceneArt />
      <div className="pet-scene-pet absolute bottom-14 left-1/2 -ml-24 w-48 md:bottom-26 md:-ml-32 md:w-64">
        <PetSprite stage={stage} size={192} alt={`${PET_MOOD_LABELS[mood]} ${stage.name}`} className="md:hidden" />
        <PetSprite
          stage={stage}
          size={256}
          alt={`${PET_MOOD_LABELS[mood]} ${stage.name}`}
          className="hidden md:block"
        />
      </div>
      <span
        aria-hidden="true"
        className="pet-scene-zz absolute top-19 right-20 text-base leading-none font-bold text-primary-dark md:top-22.5 md:right-auto md:left-[62%] md:text-xl"
      >
        z <span className="text-2xl md:text-3xl">Z</span>
      </span>
      <div className="absolute top-3 left-3 flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-2 pl-4 shadow-[0_6px_20px_rgba(63,7,145,0.12)] md:top-auto md:right-5 md:bottom-5 md:left-5 md:justify-between md:gap-3 md:py-3 md:pr-3.5 md:pl-6 md:shadow-none">
        <h2 id="pet-scene-name" className="text-xl leading-[1.1] font-bold md:text-[28px]">
          {stage.name}
        </h2>
        <span className="flex gap-1.5 md:gap-2">
          <span className="inline-flex items-center rounded-full bg-primary px-3 py-0.75 text-[13px] font-bold text-white">
            Түв. {level}
          </span>
          <ElementBadge element={element} />
        </span>
      </div>
    </section>
  );
}

// Fixed artwork colors from the design, like the sprites: the scene looks
// the same in the dark theme.
const C = {
  sky: "#bfefff",
  lavender: "#dad9ff",
  pink: "#fce7f6",
  hill: "#cac4f4",
  ground: "#f2f1ff",
  primary: "#5b00ed",
  magenta: "#e30ba6",
  night: "#3f0791",
  white: "#ffffff",
};

const round = (n: number) => Math.round(n * 10) / 10;

/** A four-pointed sparkle whose top point is at (x, y), `r` tall from the top to the middle. */
function sparkle(x: number, y: number, r: number) {
  const a = round(r * 0.3);
  const b = round(r * 0.7);
  return `M${x} ${y}l${a} ${b} ${b} ${a}-${b} ${a}-${a} ${b}-${a}-${b}-${b}-${a} ${b}-${a}z`;
}

/** Positions in the 640×600 scene, from the design. */
const TREES = [[60, 392], [96, 384], [520, 394], [556, 388], [596, 398]];
const GRASS = [[36, 512], [120, 500], [470, 500], [566, 512], [250, 540], [380, 546]];
const FLOWERS: [number, number, string][] = [
  [80, 520, C.magenta],
  [190, 548, C.primary],
  [452, 540, C.magenta],
  [600, 530, C.primary],
  [330, 560, C.magenta],
];
const SPARKLES: [number, number, number, string, number][] = [
  [574, 58, 12, C.magenta, 0],
  [96, 161, 9, C.primary, -0.8],
  [250, 103, 7, C.white, -1.6],
  [400, 52, 8, C.primary, -1.2],
  [610, 223, 7, C.white, -0.4],
];
const STARS: [number, number, number, number][] = [
  [40, 40, 4, 0],
  [130, 90, 3, -0.5],
  [210, 30, 4, -1],
  [300, 150, 3, -1.5],
  [360, 40, 4, -0.3],
  [430, 110, 3, -0.9],
  [540, 40, 4, -1.3],
  [600, 140, 3, -0.6],
  [160, 220, 3, -1.8],
  [470, 230, 3, -0.2],
];
const RISING: [number, number, number, string, number][] = [
  [232, 470, 6, C.primary, 0],
  [402, 476, 5, C.magenta, -1.4],
  [286, 480, 4, C.white, -2.6],
  [360, 468, 6, C.white, -3.5],
  [452, 482, 4, C.primary, -0.7],
  [190, 484, 5, C.magenta, -4.2],
];

/** Sky, sun, clouds, hills, trees and meadow; a night sky and stars fade in when the pet is sleepy. */
function SceneArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 600"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 block size-full"
    >
      <defs>
        <linearGradient id="pet-scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.sky} />
          <stop offset=".52" stopColor={C.lavender} />
          <stop offset=".8" stopColor={C.pink} />
        </linearGradient>
        <radialGradient id="pet-scene-glow">
          <stop offset="0" stopColor={C.white} stopOpacity=".95" />
          <stop offset=".45" stopColor={C.white} stopOpacity=".45" />
          <stop offset="1" stopColor={C.white} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pet-scene-spot">
          <stop offset="0" stopColor={C.white} stopOpacity=".85" />
          <stop offset="1" stopColor={C.white} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="640" height="600" fill="url(#pet-scene-sky)" />
      <g className="pet-scene-sun">
        <circle className="pet-scene-glow" cx="488" cy="150" r="130" fill="url(#pet-scene-glow)" />
        <circle cx="488" cy="150" r="46" fill={C.white} />
      </g>
      <g className="pet-scene-drift">
        <path fill={C.white} d="M60 92h24V80h36v12h24v12h12v12H48v-12h12z" />
      </g>
      <g className="pet-scene-drift" style={{ animationDelay: "-4s" }}>
        <path fill={C.white} opacity=".85" d="M300 62h16v-8h28v8h16v8h8v8H292v-8h8z" />
      </g>
      <g className="pet-scene-drift" style={{ animationDelay: "-7s" }}>
        <path fill={C.white} opacity=".7" d="M520 262h12v-6h22v6h12v6h6v6h-60v-6h8z" />
      </g>

      {/* Mountains with snowy tops, then the near hill and its trees. */}
      <path
        d="M0 360L70 300l50 30 80-90 70 70 60-40 70 60 70-50 70 50 60-30 40 20V600H0z"
        fill={C.hill}
        opacity=".55"
      />
      <path d="M200 240l22 24-12-2-10 10-10-10-12 2z M470 280l18 20-10-2-8 8-8-8-10 2z" fill={C.white} opacity=".8" />
      <path d="M0 430C110 380 210 390 300 420s200-40 340-10V600H0z" fill={C.hill} />
      <g fill={C.primary} opacity=".22">
        {TREES.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="14" height="14" />
            <rect x={x + 4} y={y - 10} width="6" height="10" />
            <rect x={x + 5} y={y + 14} width="4" height="6" />
          </g>
        ))}
      </g>

      {/* Light behind the pet, the meadow and the pet's spot. */}
      <ellipse cx="320" cy="400" rx="210" ry="170" fill="url(#pet-scene-spot)" />
      <path d="M0 500c140-32 500-32 640 0V600H0z" fill={C.ground} />
      <path d="M0 524c160-26 480-26 640 0V600H0z" fill={C.lavender} opacity=".6" />
      <ellipse cx="320" cy="490" rx="134" ry="22" fill={C.lavender} />
      <ellipse cx="320" cy="488" rx="104" ry="13" fill={C.night} opacity=".16" />
      <g fill={C.hill}>
        {GRASS.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="6" height="10" />
            <rect x={x + 8} y={y - 6} width="6" height="16" />
            <rect x={x + 16} y={y + 2} width="6" height="8" />
          </g>
        ))}
      </g>
      {FLOWERS.map(([x, y, color]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="3" height="10" fill={C.hill} />
          <rect x={x - 3} y={y - 8} width="9" height="9" fill={color} />
        </g>
      ))}
      {SPARKLES.map(([x, y, r, color, delay]) => (
        <path
          key={`${x}-${y}`}
          className="pet-scene-twinkle"
          style={{ animationDelay: `${delay}s` }}
          fill={color}
          d={sparkle(x, y, r)}
        />
      ))}

      {/* Night, shown when the pet is sleepy. */}
      <rect className="pet-scene-night" width="640" height="600" fill={C.night} />
      <g className="pet-scene-stars" fill={C.white}>
        {STARS.map(([x, y, size, delay]) => (
          <rect
            key={`${x}-${y}`}
            className="pet-scene-twinkle"
            style={{ animationDelay: `${delay}s` }}
            x={x}
            y={y}
            width={size}
            height={size}
          />
        ))}
      </g>
      {RISING.map(([x, y, size, color, delay]) => (
        <rect
          key={`${x}-${y}`}
          className="pet-scene-rise"
          style={{ animationDelay: `${delay}s` }}
          x={x}
          y={y}
          width={size}
          height={size}
          fill={color}
        />
      ))}
    </svg>
  );
}
