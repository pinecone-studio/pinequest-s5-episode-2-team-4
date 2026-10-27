"use client";

import { cn } from "@/lib/cn";
import type { GameQuestion } from "@/lib/types";
import { ChoiceGrid } from "../_components/ChoiceGrid";
import { ExplainCard } from "../_components/ExplainCard";
import { GameShell } from "../_components/GameShell";
import { ResultPanel } from "../_components/ResultPanel";
import { StartOverlay } from "../_components/StartOverlay";
import { SubjectSelect } from "../_components/SubjectSelect";
import { TaskBanner } from "../_components/TaskBanner";
import { DEFEND_SECONDS, KICKS, useShootout } from "./useShootout";

type ShootoutProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
};

/** One dot per kick: gold a goal, dim a miss, empty still to come. */
function Kicks({ kicks, color }: { kicks: boolean[]; color: string }) {
  const slots = Math.max(KICKS, kicks.length);
  return (
    <span className="flex gap-1">
      {Array.from({ length: slots }, (_, i) => (
        <i
          key={i}
          className={cn("size-2.5 rounded-full border", i < kicks.length ? (kicks[i] ? "border-transparent" : "border-[var(--game-line)] bg-white/10") : "border-[var(--game-line)]")}
          style={i < kicks.length && kicks[i] ? { background: color } : undefined}
        />
      ))}
    </span>
  );
}

/** Penalty shootout against a bot team: kick at the right corner, then keep goal by answering in time. */
export function Shootout({ subjects, subjectId, questions }: ShootoutProps) {
  const { canvasRef, game, turn, explain, result, won, goals, soundOn, start, save, tick, toggleSound } = useShootout(questions);
  const defending = turn?.side === "defend";

  return (
    <GameShell
      title="Пенальти"
      score={game?.score ?? 0}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/penalty" />
          <div className="game-chip flex items-center justify-between gap-2 rounded-2xl px-3 py-2" aria-label={`Чи ${goals.you}, бот ${goals.bot}`}>
            <span className="flex items-center gap-2">
              <b className="text-[var(--game-gold)]">Чи</b>
              <Kicks kicks={game?.you ?? []} color="var(--game-gold)" />
            </span>
            <b className="text-xl tabular-nums">
              {goals.you} : {goals.bot}
            </b>
            <span className="flex items-center gap-2">
              <Kicks kicks={game?.bot ?? []} color="var(--color-magenta)" />
              <b className="text-[#ff7ccf]">Бот</b>
            </span>
          </div>
        </>
      }
    >
      <div className="relative overflow-hidden rounded-[22px]">
        <div className="game-field relative aspect-[400/520] overflow-hidden rounded-[22px]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 size-full touch-none"
            aria-label="Пенальтийн цэг. Зөв хариулттай булан руу товшиж эсвэл гулсуулж өшиглөнө."
          />
          {turn ? (
            <TaskBanner
              tag={defending ? "Хамгаал!" : "Өшиглө"}
              prompt={turn.round.question.prompt}
              marks={[]}
              highlight={defending}
            />
          ) : null}
          {!game ? (
            <StartOverlay
              title="Пенальти"
              steps={[
                { icon: "⚽", text: "Зөв булан руу өшиглө" },
                { icon: "🧤", text: `${DEFEND_SECONDS} секундэд хариулж хамгаал` },
                { icon: "🏆", text: `${KICKS} өшиглөлтөөр бот багийг ял` },
              ]}
              buttonLabel="Тоглолт эхлэх"
              onStart={start}
              onTick={tick}
            />
          ) : null}
          <ExplainCard card={explain} onContinue={() => undefined} />
        </div>

        <div className="mt-3 min-h-[148px]">
          {defending && turn ? (
            <div className="flex flex-col gap-2">
              <span className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                {turn.picked === null ? (
                  <span
                    key={turn.n}
                    style={{ "--game-timer": `${DEFEND_SECONDS}s` } as React.CSSProperties}
                    className="game-timer block h-full bg-[var(--game-gold)]"
                  />
                ) : null}
              </span>
              <ChoiceGrid round={turn.round} picked={turn.picked} onChoose={save} roundKey={turn.n} />
            </div>
          ) : (
            <p className="text-sm text-[var(--game-muted)]">
              {turn
                ? "Хаалганы 4 буланд хариулт бичигдсэн. Зөв хариулттай булан руу товшиж, гулсуулж эсвэл 1–4 товчоор өшиглө."
                : "Ээлжлэн өшиглөж, хамгаална. Бот өшиглөхөөс өмнө зөв хариулбал хаалгач чинь барина."}
            </p>
          )}
        </div>

        {result ? (
          <ResultPanel result={result} onAgain={start} otherHref="/games">
            <p className="text-sm font-extrabold text-[var(--game-gold)]">
              {won ? `🏆 ${goals.you} : ${goals.bot}. Чи яллаа!` : goals.you === goals.bot ? `${goals.you} : ${goals.bot}. Тэнцлээ!` : `${goals.you} : ${goals.bot}. Бот баг яллаа. Дахиад нэг!`}
            </p>
          </ResultPanel>
        ) : null}
      </div>
    </GameShell>
  );
}
