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

/** A mole holding up its answer sign; squashed when hit. */
function MoleSprite({ hit }: { hit?: "good" | "bad" }) {
  return (
    <svg viewBox="0 0 100 90" aria-hidden="true" className="block w-full">
      <path d="M14 90C10 48 26 18 50 18s40 30 36 72z" fill={hit === "bad" ? "#a3304e" : "#7a5236"} />
      <ellipse cx="50" cy="66" rx="20" ry="18" fill="#b98a5e" />
      {/* paws holding the sign's pole */}
      <ellipse cx="34" cy="56" rx="7" ry="5" fill="#f1b3a8" />
      <ellipse cx="66" cy="56" rx="7" ry="5" fill="#f1b3a8" />
      {hit ? (
        <>
          <path d="m33 34 8 6m0-6-8 6M59 34l8 6m0-6-8 6" stroke="#1d1647" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="38" cy="38" r="5" fill="#1d1647" />
          <circle cx="62" cy="38" r="5" fill="#1d1647" />
          <circle cx="39.5" cy="36.5" r="1.6" fill="#fff" />
          <circle cx="63.5" cy="36.5" r="1.6" fill="#fff" />
        </>
      )}
      <ellipse cx="50" cy="48" rx="7" ry="5" fill="#ff8fb1" />
      <path d="M44 55q6 5 12 0" fill="none" stroke="#1d1647" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="45" y="56" width="4" height="5" rx="1" fill="#fff" />
      <rect x="51" y="56" width="4" height="5" rx="1" fill="#fff" />
    </svg>
  );
}

function Hammer() {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true" className="block size-full">
      <rect x="27" y="22" width="7" height="34" rx="3" fill="#8a5a34" />
      <rect x="10" y="6" width="40" height="20" rx="6" fill="#b4a9e3" />
      <rect x="10" y="6" width="9" height="20" rx="3" fill="#8b5cff" />
      <rect x="41" y="6" width="9" height="20" rx="3" fill="#8b5cff" />
    </svg>
  );
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
          <span aria-hidden="true" className="mole-hole absolute inset-x-[6%] bottom-[8%] h-[24%] rounded-[50%]" />
          {/* the mole rises from inside the hole */}
          <span className="absolute inset-x-0 bottom-[18%] top-0 overflow-hidden">
            {mole ? (
              <span key={mole.id} className={cn("mole-up absolute inset-x-[12%] bottom-0 flex flex-col items-center", mole.hit && "mole-hit")}>
                <span
                  className={cn(
                    "mole-sign relative z-10 mb-[-6%] flex min-h-9 w-[112%] items-center justify-center rounded-lg border-2 px-1 py-1 text-sm leading-tight font-extrabold text-[var(--game-ink)]",
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
          <span aria-hidden="true" className="mole-lip absolute inset-x-[2%] bottom-[4%] h-[18%] rounded-[50%]" />
          {mole?.hit === "good" ? (
            <span aria-hidden="true" className="mole-stars pointer-events-none absolute inset-x-0 top-[20%] z-20 text-center text-xl">
              ⭐✨⭐
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
