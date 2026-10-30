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
import { BOSS_POWER, GATES, useLaneRunner } from "./useLaneRunner";

type LaneRunnerProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
};

/** 3-lane runner: run through the right answer's gate to grow; beat the boss at the end of the road. */
export function LaneRunner({ subjects, subjectId, questions }: LaneRunnerProps) {
  const { canvasRef, run, round, next, explain, result, soundOn, start, move, tick, toggleSound } = useLaneRunner(questions);
  const power = run?.power ?? 10;
  const strong = power >= BOSS_POWER;

  return (
    <GameShell
      title="Боссын зам"
      score={run?.score ?? 0}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/runner" />
          <div className="flex items-center gap-2.5">
            <b className="w-14 text-sm tabular-nums" style={{ color: strong ? "var(--game-gold)" : undefined }}>
              <PixelIcon name="lightning" className="inline-block size-4 align-[-0.15em]" /> {power}
            </b>
            <span
              role="meter"
              aria-label="Боссын эсрэг хүч"
              aria-valuemin={0}
              aria-valuemax={BOSS_POWER}
              aria-valuenow={Math.min(power, BOSS_POWER)}
              className="game-chip h-3 flex-1 overflow-hidden rounded-full"
            >
              <span
                className="block h-full bg-linear-to-r from-[var(--color-primary)] to-[var(--game-gold)] transition-[width] duration-500"
                style={{ width: `${Math.min(100, (100 * power) / BOSS_POWER)}%` }}
              />
            </span>
            <b className="w-14 text-right text-sm text-[var(--game-bad)] tabular-nums">
              <PixelIcon name="ogre" className="inline-block size-4 align-[-0.15em]" /> {BOSS_POWER}
            </b>
          </div>
          <RoundProgress current={run ? (next < 0 ? GATES : next) : 0} total={GATES} label={next < 0 ? "Босс!" : undefined} />
        </>
      }
    >
      <div className="relative overflow-hidden rounded-[22px]">
        <div className="game-field relative aspect-[400/520] overflow-hidden rounded-[22px]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 size-full touch-none"
            aria-label="Баатар 3 замтай замаар гүйж байна. Сум товч эсвэл гулсуулж зам солино."
          />
          {round ? (
            <TaskBanner tag={`Хаалга ${next + 1}`} prompt={round.question.prompt} marks={[]} />
          ) : run && !result ? (
            <TaskBanner tag="Босс" prompt={strong ? "Хангалттай хүчтэй боллоо! Боссыг дийл!" : "Босс хүлээж байна…"} marks={[]} highlight />
          ) : null}
          {!run ? (
            <StartOverlay
              title="Боссын зам"
              steps={[
                { icon: <PixelIcon name="arrows" className="size-6" />, text: "Зам солиод зөв хаалгаар ор" },
                { icon: <PixelIcon name="dumbbell" className="size-6" />, text: "Зөв бүрт томорч хүчтэй болно" },
                { icon: <PixelIcon name="ogre" className="size-6" />, text: `Төгсгөлд ${BOSS_POWER}-ийн хүчтэй босс` },
              ]}
              buttonLabel="Гүйж эхлэх"
              onStart={start}
              onTick={tick}
            />
          ) : null}
          <ExplainCard card={explain} onContinue={() => undefined} />
        </div>

        {run && !result ? (
          <div className="mt-3 grid grid-cols-2 gap-2 md:hidden">
            <button type="button" onClick={() => move(-1)} aria-label="Зүүн зам" className="game-chip min-h-14 cursor-pointer rounded-xl text-2xl font-extrabold">
              <PixelIcon name="play-left" className="mx-auto size-6" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Баруун зам" className="game-chip min-h-14 cursor-pointer rounded-xl text-2xl font-extrabold">
              <PixelIcon name="play" className="mx-auto size-6" />
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--game-muted)]">
            ← → (эсвэл A, D) товчоор, утсан дээр гулсуулж эсвэл товшиж зам солино. Зөв хариулттай хаалгаар орвол хүч нэмэгдэнэ.
          </p>
        )}

        {result ? (
          <ResultPanel result={result} onAgain={start} otherHref="/games">
            <p className="text-sm font-extrabold text-[var(--game-gold)]">
              {result.won ? (
                <>
                  <PixelIcon name="trophy" className="inline-block size-4 align-[-0.15em]" /> {run?.power} хүчээр боссыг дийллээ!
                </>
              ) : `Босс ${BOSS_POWER}, чи ${run?.power}. Дахиад оролдоод томор!`}
            </p>
          </ResultPanel>
        ) : null}
      </div>
    </GameShell>
  );
}
