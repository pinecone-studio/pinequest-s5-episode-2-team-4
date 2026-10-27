import { cn } from "@/lib/cn";
import { AnswerView } from "../_components/AnswerView";
import { POWER, type BattleCard } from "./deck";

type QuestionSheetProps = {
  card: BattleCard;
  picked: number | null;
  combo: number;
  onChoose: (choice: number) => void;
  onPlay: () => void;
};

const LETTERS = "АБВГ";

/** The opened card: pick the answer that fits, read why, then throw. */
export function QuestionSheet({ card, picked, combo, onChoose, onPlay }: QuestionSheetProps) {
  const answered = picked !== null, ok = picked === card.answer;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="card-q" className="absolute inset-0 z-10 flex items-end bg-[rgb(13_10_34/0.6)] p-3">
      <div className="game-glass flex w-full flex-col gap-3 rounded-[20px] p-4">
        <p className="flex justify-between text-xs text-[var(--game-muted)]">
          <span>
            <b className="text-white">{POWER[card.power].label} карт</b> · {POWER[card.power].damage} хохирол
          </span>
          {combo >= 1 ? <span className="font-bold text-[var(--game-gold)]">Комбо x{combo}</span> : null}
        </p>
        <h2 id="card-q" className="text-lg leading-tight font-extrabold">
          {card.prompt}
          <span className="block text-sm font-semibold text-[var(--game-muted)]">Тохирохыг нь сонго</span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {card.choices.map((choice, k) => (
            <button
              key={k}
              type="button"
              disabled={answered}
              autoFocus={k === 0}
              onClick={() => onChoose(k)}
              className={cn(
                "game-chip flex min-h-14 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left font-bold disabled:cursor-default",
                answered && k === card.answer && "border-[var(--game-good)] bg-[rgb(52_211_153/0.2)]",
                answered && k === picked && !ok && "border-[var(--game-bad)] bg-[rgb(255_77_109/0.2)]",
              )}
            >
              <span className="grid size-6 flex-none place-items-center rounded-md bg-white/10 text-xs">{LETTERS[k]}</span>
              <AnswerView answer={choice} />
            </button>
          ))}
        </div>
        {answered ? (
          <>
            <p className={cn("rounded-xl border-l-4 bg-white/5 px-3 py-2 text-sm text-[var(--game-muted)]", ok ? "border-[var(--game-good)]" : "border-[var(--game-gold)]")}>
              <b className="block text-white">{ok ? "Зөв! Тэжээвэр чинь шидэхэд бэлэн." : "Энэ удаа од унтарна. Карт дараа дахин ирнэ."}</b>
              {card.explanation}
            </p>
            <button type="button" autoFocus onClick={onPlay} className="game-gradient cursor-pointer self-end rounded-xl px-5 py-2.5 font-extrabold text-white">
              {ok ? "Шидэх!" : "Ойлголоо"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
