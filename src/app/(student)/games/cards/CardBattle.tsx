"use client";

import type { GameQuestion } from "@/lib/types";
import { GameShell } from "../_components/GameShell";
import { ResultPanel } from "../_components/ResultPanel";
import { SubjectSelect } from "../_components/SubjectSelect";
import { Hand } from "./Hand";
import { QuestionSheet } from "./QuestionSheet";
import { useCardBattle } from "./useCardBattle";

type CardBattleProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
  /** The student's pet sprite; it does the throwing. */
  petSprite?: string;
};

/** Card battle: every right answer lets the pet hit the monster; hard cards hit harder. */
export function CardBattle({ subjects, subjectId, questions, petSprite }: CardBattleProps) {
  const { canvasRef, battle, card, picked, busy, result, soundOn, maxHp, openCard, choose, play, again, toggleSound } =
    useCardBattle(questions, petSprite);
  const hpPercent = (100 * battle.hp) / maxHp;

  return (
    <GameShell
      title="Картын тулаан"
      score={battle.score}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/cards" />
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold">Мангас</span>
            <span className="game-chip h-3 flex-1 overflow-hidden rounded-full" role="progressbar" aria-label="Мангасын амь" aria-valuenow={battle.hp} aria-valuemax={maxHp}>
              <span className="block h-full bg-linear-to-r from-[var(--game-bad)] to-[var(--color-magenta)] transition-[width] duration-500" style={{ width: `${hpPercent}%` }} />
            </span>
            <b className="w-16 text-right text-xs text-[var(--game-muted)] tabular-nums">{battle.hp} HP</b>
          </div>
        </>
      }
    >
      <div className="relative flex min-h-[460px] flex-col gap-3 overflow-hidden rounded-[22px]">
        <div className="game-field relative aspect-[520/290] overflow-hidden rounded-[22px]">
          <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-label="Тэжээвэр мангастай тулалдаж байна" />
        </div>
        <p className="min-h-10 text-sm text-[var(--game-muted)]" aria-live="polite">
          {busy ? "Тэжээвэр од шидэж байна…" : "Картаа сонго. Зөв хариулбал тэжээвэр чинь мангас руу од шидэнэ."}
          {battle.combo >= 2 ? <b className="text-[var(--game-gold)]"> Комбо {battle.combo}!</b> : null}
        </p>
        <Hand cards={battle.hand} disabled={busy} onOpen={openCard} />
        {card ? <QuestionSheet card={card} picked={picked} combo={battle.combo} onChoose={choose} onPlay={play} /> : null}
        {result ? (
          <ResultPanel result={result} onAgain={again} otherHref="/games">
            <p className="text-sm font-extrabold text-[var(--game-gold)]">Мангасыг яллаа! {battle.right} зөв, {battle.wrong} дахин үзэх.</p>
          </ResultPanel>
        ) : null}
      </div>
    </GameShell>
  );
}
