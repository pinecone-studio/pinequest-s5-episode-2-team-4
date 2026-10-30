import { PixelIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { HorseSprite } from "./HorseSprite";
import "./race.css";

type TrackProps = {
  horses: string[];
  /** Steps each horse has run, in `horses` order. */
  positions: number[];
  /** Steps to the finish line. */
  steps: number;
  /** Index of the player's horse; its lane is outlined. */
  player: number;
};

/** Jockey silks and horse coats, in `horses` order; the player rides in gold. */
const LOOKS = [
  { silk: "#ffcf5a", coat: "#8a5a34" },
  { silk: "#38bdf8", coat: "#5b3a24" },
  { silk: "#e30ba6", coat: "#c9a27c" },
  { silk: "#34d399", coat: "#3a2a22" },
];

/** Stands with a crowd above a grass field with one railed dirt lane per horse. */
export function Track({ horses, positions, steps, player }: TrackProps) {
  const lead = Math.max(...positions);

  return (
    <div className="race-sky">
      <div aria-hidden="true" className="race-stands relative h-12">
        <span className="race-crowd absolute inset-x-0 bottom-1.5 h-7" />
        <span className="race-banner absolute top-1.5 left-1/2 -translate-x-1/2 rounded-md px-2.5 py-0.5 text-2xs font-extrabold tracking-[0.2em] text-[#2a1600]">
          LEVELUP DERBY
        </span>
      </div>

      <div className="race-field relative px-2.5 pt-3 pb-3">
        {/* finish pole with a checkered flag */}
        <span aria-hidden="true" className="absolute top-0 right-[18px] z-10 h-full w-[3px] bg-white/90">
          <span className="race-flag race-finish absolute top-0 left-[3px] h-3.5 w-5 rounded-r-sm" />
        </span>

        <ol className="flex flex-col gap-3">
          {horses.map((name, i) => {
            const pos = positions[i];
            const leading = pos > 0 && pos === lead;
            return (
              <li
                key={name}
                className={cn("relative flex h-16 items-center rounded-lg", i === player ? "race-lane-player" : "race-lane")}
              >
                <span
                  aria-hidden="true"
                  className="race-gate grid h-full w-7 shrink-0 place-items-center rounded-l-lg text-2xs font-extrabold text-[#2a1600]"
                >
                  {i === player ? "ЧИ" : i + 1}
                </span>
                <div className="relative h-full flex-1">
                  <span aria-hidden="true" className="race-ticks absolute inset-0" style={{ "--race-steps": steps } as React.CSSProperties} />
                  <span aria-hidden="true" className="race-finish absolute inset-y-0 right-0 w-2 rounded-r-lg" />
                  <span
                    role="img"
                    aria-label={`${name}: ${pos}/${steps}${leading ? ", тэргүүлж байна" : ""}`}
                    className="absolute bottom-0.5 flex flex-col items-center transition-[left] duration-700 ease-out"
                    style={{ left: `calc(${pos / steps} * (100% - 4.5rem))` }}
                  >
                    {leading ? (
                      <span aria-hidden="true" className="race-crown absolute -top-3 left-[52%] text-2xs leading-none">
                        <PixelIcon name="crown" className="size-3.5" />
                      </span>
                    ) : null}
                    <HorseSprite key={pos} {...LOOKS[i]} number={i + 1} running={pos > 0} className="h-[58px] w-[72px]" />
                    <span aria-hidden="true" className="-mt-1.5 h-1.5 w-12 rounded-[50%] bg-black/25" />
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
