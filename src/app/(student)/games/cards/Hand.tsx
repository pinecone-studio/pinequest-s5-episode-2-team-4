import { cn } from "@/lib/cn";
import type { Power } from "./arena/ArenaEngine";
import { POWER, type BattleCard } from "./deck";

const STYLE: Record<Power, string> = {
  easy: "from-[#0f5e4a] to-[#123a3a] border-[#34d399]",
  medium: "from-[#6b4a0c] to-[#3d2a12] border-[#ffcf5a]",
  hard: "from-[#7a1838] to-[#3d1024] border-[#ff4d6d]",
};

type HandProps = {
  cards: BattleCard[];
  disabled: boolean;
  onOpen: (index: number) => void;
};

/** The three cards to play; each shows its strength and damage, not the question. */
export function Hand({ cards, disabled, onOpen }: HandProps) {
  return (
    <ul className="grid grid-cols-3 gap-2.5">
      {cards.map((card, i) => (
        <li key={card.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onOpen(i)}
            aria-label={`${POWER[card.power].label} карт, ${POWER[card.power].damage} хохирол`}
            style={{ animationDelay: `${i * 80}ms` }}
            className={cn(
              "game-pop flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-between rounded-2xl border-2 bg-linear-to-b p-2.5 text-white transition-transform hover:-translate-y-1 disabled:cursor-wait disabled:opacity-60",
              STYLE[card.power],
            )}
          >
            <span className="text-[11px] font-extrabold tracking-wide uppercase">{POWER[card.power].label}</span>
            <span aria-hidden="true" className="text-3xl">
              {card.power === "easy" ? "🍃" : card.power === "medium" ? "⚔️" : "🔥"}
            </span>
            <span className="flex flex-col items-center leading-none">
              <b className="text-2xl font-extrabold">{POWER[card.power].damage}</b>
              <small className="text-[10px] text-white/70">хохирол</small>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
