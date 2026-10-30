"use client";

import { PixelIcon } from "@/components/ui";
import type { GameQuestion } from "@/lib/types";
import { ExplainCard } from "../_components/ExplainCard";
import { GameShell } from "../_components/GameShell";
import { ResultPanel } from "../_components/ResultPanel";
import { StartOverlay } from "../_components/StartOverlay";
import { SubjectSelect } from "../_components/SubjectSelect";
import { TaskBanner } from "../_components/TaskBanner";
import { MoleField } from "./MoleField";
import { HEARTS, HOLES, SECONDS, TO_FIND, useWhackAMole } from "./useWhackAMole";

type WhackAMoleProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
};

/** Whack-a-mole: hit the moles holding answers that fit the prompt, before the clock runs out. */
export function WhackAMole({ subjects, subjectId, questions }: WhackAMoleProps) {
  const { game, question, explain, swing, result, soundOn, start, hit, tick, toggleSound } = useWhackAMole(questions);
  const left = game ? Math.max(0, SECONDS - game.time / 1000) : SECONDS;
  const hearts = game?.hearts ?? HEARTS;

  return (
    <GameShell
      title="Мэнгэ цохих"
      score={game?.score ?? 0}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/mole" />
          <div className="flex items-center gap-2.5">
            <span className="flex gap-0.5" aria-label={`${hearts} амь`}>
              {Array.from({ length: HEARTS }, (_, i) => (
                <PixelIcon key={i} name={i < hearts ? "heart" : "heart-empty"} className="size-4" />
              ))}
            </span>
            <span
              role="timer"
              aria-label={`${Math.ceil(left)} секунд үлдлээ`}
              className="game-chip h-3 flex-1 overflow-hidden rounded-full"
            >
              <span
                className="block h-full bg-linear-to-r from-[var(--game-bad)] via-[var(--game-gold)] to-[var(--game-good)] transition-[width] duration-100"
                style={{ width: `${(100 * left) / SECONDS}%` }}
              />
            </span>
            <b className="w-9 text-right text-sm tabular-nums">{Math.ceil(left)}с</b>
          </div>
        </>
      }
    >
      <div className="relative overflow-hidden rounded-[22px]">
        <div className="game-field relative overflow-hidden rounded-[22px]">
          <MoleField moles={game?.moles ?? Array.from({ length: HOLES }, () => null)} swing={swing} onHit={hit} disabled={!question} />
          {question && game ? (
            <TaskBanner
              tag="Даалгавар"
              prompt={question.prompt}
              marks={Array.from({ length: TO_FIND }, (_, i) => (i < game.found.length ? true : undefined))}
            />
          ) : null}
          {!game ? (
            <StartOverlay
              title="Мэнгэ цохих"
              steps={[
                { icon: <PixelIcon name="hammer" className="size-6" />, text: "Тохирох хариулттай мэнгийг цохи" },
                { icon: <PixelIcon name="heart" className="size-6" />, text: `Буруу цохивол −1 амь (${HEARTS})` },
                { icon: <PixelIcon name="timer" className="size-6" />, text: `${SECONDS} секунд` },
              ]}
              buttonLabel="Цохиж эхлэх"
              onStart={start}
              onTick={tick}
            />
          ) : null}
          <ExplainCard card={explain} onContinue={() => undefined} />
        </div>

        <p className="mt-3 text-sm text-[var(--game-muted)]">
          Даалгаварт тохирох 3 хариултыг олж цохи. Цаг өнгөрөх тусам мэнгэ хурдан болно.
          {game && game.combo >= 2 ? <b className="text-[var(--game-gold)]"> Комбо x{game.combo}!</b> : null}
        </p>

        {result ? (
          <ResultPanel result={result} onAgain={start} otherHref="/games">
            <p className="text-sm font-extrabold text-[var(--game-gold)]">
              {game && game.hearts <= 0 ? "Амь дууслаа. Дахиад нэг үз!" : `Хугацаа дууслаа! ${game?.right ?? 0} мэнгэ зөв цохилоо.`}
            </p>
          </ResultPanel>
        ) : null}
      </div>
    </GameShell>
  );
}
