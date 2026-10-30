import { PixelIcon } from "@/components/ui";
import { pixelPaths } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/cn";
import { AnswerView } from "../_components/AnswerView";
import type { Mole } from "./useWhackAMole";
import "./mole.css";

type MoleFieldProps = {
  moles: (Mole | null)[];
  /** Hole of the last swing; `n` replays the hammer. */
  swing: { hole: number; n: number } | null;
  onHit: (hole: number) => void;
  disabled: boolean;
};

// Pixel art, like PixelIcon: each letter is a palette colour, "." is empty.

/** The mole: brown fur, a lighter belly, paws holding the sign's pole, buck teeth. */
const MOLE = [
  "......DDDDDDDD......", "....DDBBBBBBBBDD....", "...DBBBBBBBBBBBBD...", "..DBBBBBBBBBBBBBBD..",
  "..DBBBKKBBBBKKBBBD..", ".DBBBBKWBBBBKWBBBBD.", ".DBBBBKKBBBBKKBBBBD.", ".DBBBBBBBNNBBBBBBBD.",
  "DBBBBBBBNNNNBBBBBBBD", "DBBBBBBBBKKBBBBBBBBD", "DBBBPPBBWWWWBBPPBBBD", "DBBPPPPLLLLLLPPPPBBD",
  "DBBBPPLLLLLLLLPPBBBD", "DBBBBLLLLLLLLLLBBBBD", "DBBBBLLLLLLLLLLBBBBD", "DBBBBBLLLLLLLLBBBBBD",
  "DBBBBBBBBBBBBBBBBBBD", "DBBBBBBBBBBBBBBBBBBD",
];
/** Hit: the eyes turn into crosses. */
const MOLE_HIT = [
  ...MOLE.slice(0, 4),
  "..DBBKBKBBBBKBKBBD..", ".DBBBBKBBBBBBKBBBBD.", ".DBBBKBKBBBBKBKBBBD.",
  ...MOLE.slice(7),
];
const MOLE_COLORS = { D: "#4e321f", B: "#7a5236", L: "#b98a5e", P: "#f1b3a8", K: "#1d1647", W: "#fff", N: "#ff8fb1" };

const HAMMER = [
  ".VVHHHHHHVV.", ".VVHHHHHHVV.", ".VVHHHHHHVV.", ".VVHHHHHHVV.",
  ".....WW.....", ".....WW.....", ".....WW.....", ".....WW.....",
  ".....WW.....", ".....WW.....", ".....WW.....", ".....WW.....",
];
const HAMMER_COLORS = { V: "#8b5cff", H: "#b4a9e3", W: "#8a5a34" };

function PixelSprite({ rows, palette, className }: { rows: string[]; palette: Record<string, string>; className: string }) {
  return (
    <svg viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" aria-hidden="true" className={className}>
      {pixelPaths({ rows, palette }).map(([fill, d]) => (
        <path key={fill} fill={fill} d={d} />
      ))}
    </svg>
  );
}

/** A mole holding up its answer sign; squashed when hit, red when it was the wrong one. */
function MoleSprite({ hit }: { hit?: "good" | "bad" }) {
  const palette = hit === "bad" ? { ...MOLE_COLORS, B: "#a3304e", D: "#6b1a30" } : MOLE_COLORS;
  return <PixelSprite rows={hit ? MOLE_HIT : MOLE} palette={palette} className="block w-full" />;
}

function Hammer() {
  return <PixelSprite rows={HAMMER} palette={HAMMER_COLORS} className="block size-full" />;
}

/** 3×3 field of holes; moles pop up with an answer sign and go back down. */
export function MoleField({ moles, swing, onHit, disabled }: MoleFieldProps) {
  return (
    <div className="mole-field grid grid-cols-3 gap-x-2 gap-y-1 px-3 pt-16 pb-4">
      {moles.map((mole, hole) => (
        <button
          key={hole}
          type="button"
          disabled={disabled}
          onPointerDown={() => onHit(hole)}
          aria-label={mole ? `Мэнгэ: ${typeof mole.answer === "string" ? mole.answer : mole.answer.name}` : `Нүх ${hole + 1}, хоосон`}
          className="relative aspect-[1/1.12] cursor-pointer touch-none select-none disabled:cursor-default"
        >
          {/* back of the hole */}
          <span aria-hidden="true" className="mole-hole absolute inset-x-[6%] bottom-[8%] h-[24%]" />
          {/* the mole rises from inside the hole */}
          <span className="absolute inset-x-0 bottom-[18%] top-0 overflow-hidden">
            {mole ? (
              <span key={mole.id} className={cn("mole-up absolute inset-x-[12%] bottom-0 flex flex-col items-center", mole.hit && "mole-hit")}>
                <span
                  className={cn(
                    "mole-sign relative z-10 mb-[-6%] flex min-h-9 w-[112%] items-center justify-center border-[3px] px-1 py-1 text-sm leading-tight font-extrabold text-[var(--game-ink)]",
                    mole.hit === "good" && "border-[var(--game-good)] bg-[#0f3d33]",
                    mole.hit === "bad" && "border-[var(--game-bad)] bg-[#4a1030]",
                    !mole.hit && "border-[var(--game-line)] bg-[#1d1647]",
                  )}
                >
                  <AnswerView answer={mole.answer} />
                </span>
                <MoleSprite hit={mole.hit} />
              </span>
            ) : null}
          </span>
          {/* front lip of the hole, over the mole */}
          <span aria-hidden="true" className="mole-lip absolute inset-x-[2%] bottom-[4%] h-[9%]" />
          {mole?.hit === "good" ? (
            <span aria-hidden="true" className="mole-stars pointer-events-none absolute inset-x-0 top-[20%] z-20 flex justify-center gap-0.5">
              <PixelIcon name="star" className="size-5" />
              <PixelIcon name="sparkle" className="size-5" />
              <PixelIcon name="star" className="size-5" />
            </span>
          ) : null}
          {swing?.hole === hole ? (
            <span key={swing.n} aria-hidden="true" className="mole-hammer pointer-events-none absolute top-[2%] right-[2%] z-30 size-[55%]">
              <Hammer />
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
