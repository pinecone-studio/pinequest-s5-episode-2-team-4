"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import { ExplainCard } from "../_components/ExplainCard";
import { GameShell } from "../_components/GameShell";
import { ResultPanel } from "../_components/ResultPanel";
import { RetryNote } from "../_components/RetryNote";
import { RoundProgress } from "../_components/RoundProgress";
import { StartOverlay } from "../_components/StartOverlay";
import { SubjectSelect } from "../_components/SubjectSelect";
import { TaskBanner } from "../_components/TaskBanner";
import { ROUNDS } from "../_lib/session";
import { useSliceGame } from "./useSliceGame";

type SliceGameProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
};

const STEPS = [
  { icon: "👆", text: "Хуруугаараа шудар" },
  { icon: "✅", text: "Таарах 3-ыг зүс" },
  { icon: "💡", text: "Буруу бол тайлбар" },
];

/** Knowledge slice: swipe the tossed answers that fit the task; a wrong slice pauses on its explanation. */
export function SliceGame({ subjects, subjectId, questions }: SliceGameProps) {
  const { canvasRef, hud, card, slow, finish, soundOn, start, tick, resume, again, toggleSound } = useSliceGame(questions, subjectId);
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState(false);
  const onStart = useCallback(() => {
    setPlaying(true);
    setHint(true);
    start();
  }, [start]);
  // "Slice the right ones" for the first seconds of a game.
  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(false), 3200);
    return () => clearTimeout(timer);
  }, [hint]);

  return (
    <GameShell
      title="Мэдлэгийн зүсэлт"
      score={hud.score}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/slice" />
          <RoundProgress current={finish ? ROUNDS : hud.step} total={ROUNDS} />
        </>
      }
    >
      <div className="game-field relative aspect-[4/5] touch-none overflow-hidden rounded-[22px]">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-label="Зүсэлтийн тоглоомын талбар. Хуруугаараа шудрахад зүснэ." />
        <TaskBanner tag={hud.retry ? "Давталт" : "Зүс"} highlight={hud.retry} prompt={hud.prompt} marks={[0, 1, 2].map((i) => hud.marks[i])} />
        {hud.combo >= 2 && !finish ? (
          <p className="game-pop absolute top-[84px] right-4 text-sm font-extrabold text-[var(--game-gold)] [text-shadow:0_2px_0_#000]">КОМБО x{hud.combo}</p>
        ) : null}
        {slow && !finish ? (
          <p className="absolute top-[84px] left-4 rounded-full bg-[rgb(255_207_90/0.15)] px-3 py-1 text-xs font-extrabold text-[var(--game-gold)]">Анхааралтай горим · удаан</p>
        ) : null}
        {hint && !card ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-16 text-center font-extrabold text-white [text-shadow:0_2px_0_#000]">Зөвийг нь хуруугаараа зүс ✦</p>
        ) : null}
        <ExplainCard card={card} onContinue={resume} />
        {!playing ? (
          <StartOverlay title={<>Зөвийг нь зүс,<br />бурууг нь орхи</>} steps={STEPS} buttonLabel="Эхлэх" onStart={onStart} onTick={tick} />
        ) : null}
        {finish ? (
          <ResultPanel
            result={finish}
            otherHref="/games"
            onAgain={() => {
              again();
              setPlaying(false);
            }}
          >
            <RetryNote stats={finish.retry}>{finish.guesses ? ` · таамаглах шинж ${finish.guesses} удаа` : null}</RetryNote>
            <p className="text-sm font-extrabold text-[var(--game-gold)]">{finish.record ? "Шинэ рекорд!" : `Рекорд: ${finish.best} оноо`}</p>
          </ResultPanel>
        ) : null}
      </div>
      <p className="text-center text-xs text-[var(--game-muted)]">Бүх хариулт ижил харагдана. Бодож байж зүс: таамаглавал удаан горим руу шилжинэ.</p>
    </GameShell>
  );
}
