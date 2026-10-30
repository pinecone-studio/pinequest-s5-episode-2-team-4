"use client";

import { PixelIcon } from "@/components/ui";
import type { GameQuestion } from "@/lib/types";
import { ExplainCard } from "../_components/ExplainCard";
import { GameShell } from "../_components/GameShell";
import { ResultPanel } from "../_components/ResultPanel";
import { RoundProgress } from "../_components/RoundProgress";
import { StartOverlay } from "../_components/StartOverlay";
import { SubjectSelect } from "../_components/SubjectSelect";
import { TaskBanner } from "../_components/TaskBanner";
import { HEARTS, PROMPTS, TO_SCORE, useHoops } from "./useHoops";

type HoopsProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
};

/** Swipe basketball: every ball holds an answer; shoot the right ones, throw the wrong ones away. */
export function Hoops({ subjects, subjectId, questions }: HoopsProps) {
  const { canvasRef, game, question, explain, result, soundOn, start, discard, tick, toggleSound } = useHoops(questions);
  const hearts = game?.hearts ?? HEARTS;

  return (
    <GameShell
      title="Сагсан бөмбөг"
      score={game?.score ?? 0}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/hoops" />
          <div className="flex items-center gap-3">
            <span className="flex gap-0.5" aria-label={`${hearts} амь`}>
              {Array.from({ length: HEARTS }, (_, i) => (
                <PixelIcon key={i} name={i < hearts ? "heart" : "heart-empty"} className="size-4" />
              ))}
            </span>
            <div className="flex-1">
              <RoundProgress current={game ? Math.min(game.index, PROMPTS) : 0} total={PROMPTS} />
            </div>
          </div>
        </>
      }
    >
      <div className="relative overflow-hidden rounded-[22px]">
        <div className="game-field relative aspect-[400/560] overflow-hidden rounded-[22px]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 size-full touch-none"
            aria-label="Сагсан бөмбөгийн талбай. Бөмбөгийг дээш гулсуулж шидэж, доош гулсуулж хаяна."
          />
          {question && game ? (
            <TaskBanner
              tag="Сагсанд хий"
              prompt={question.prompt}
              marks={Array.from({ length: TO_SCORE }, (_, i) => (i < game.scored ? true : undefined))}
            />
          ) : null}
          {!game ? (
            <StartOverlay
              title="Сагсан бөмбөг"
              steps={[
                { icon: <PixelIcon name="basketball" className="size-6" />, text: "Бөмбөг бүр дээр хариулт бий" },
                { icon: <PixelIcon name="pointer-up" className="size-6" />, text: "Зөвийг нь дээш гулсуулж шид" },
                { icon: <PixelIcon name="pointer-down" className="size-6" />, text: "Буруугаа доош гулсуулж хая" },
              ]}
              buttonLabel="Тоглож эхлэх"
              onStart={start}
              onTick={tick}
            />
          ) : null}
          <ExplainCard card={explain} onContinue={() => undefined} />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <p className="flex-1 text-sm text-[var(--game-muted)]">
            Зөв хариулттай бөмбөгийг сагсанд хий. Буруу бөмбөг сагсанд орвол амь хасагдана.
            {game && game.combo >= 2 ? <b className="text-[var(--game-gold)]"> Комбо x{game.combo}!</b> : null}
          </p>
          {question ? (
            <button type="button" onClick={discard} className="game-chip min-h-12 cursor-pointer rounded-xl px-4 font-extrabold">
              <PixelIcon name="trash" className="inline-block size-4 align-[-0.15em]" /> Хаях
            </button>
          ) : null}
        </div>

        {result ? (
          <ResultPanel result={result} onAgain={start} otherHref="/games">
            <p className="text-sm font-extrabold text-[var(--game-gold)]">
              {game && game.hearts <= 0 ? "Амь дууслаа. Дахиад нэг үз!" : (
                <>
                  <PixelIcon name="basketball" className="inline-block size-4 align-[-0.15em]" /> {game?.right ?? 0} зөв бөмбөг сагсанд орлоо!
                </>
              )}
            </p>
          </ResultPanel>
        ) : null}
      </div>
    </GameShell>
  );
}
