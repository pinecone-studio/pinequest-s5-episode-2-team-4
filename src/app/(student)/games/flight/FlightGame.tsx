"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameQuestion } from "@/lib/types";
import { ExplainCard } from "../_components/ExplainCard";
import { GameShell } from "../_components/GameShell";
import { ResultPanel } from "../_components/ResultPanel";
import { RoundProgress } from "../_components/RoundProgress";
import { StartOverlay } from "../_components/StartOverlay";
import { SubjectSelect } from "../_components/SubjectSelect";
import { TaskBanner } from "../_components/TaskBanner";
import { ROUNDS } from "../_lib/session";
import { useFlightGame } from "./useFlightGame";

type FlightGameProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
};

const STEPS = [
  { icon: "👆", text: "Товшиж дүүл" },
  { icon: "🚪", text: "Зөв хариулттай завсраар нис" },
  { icon: "💡", text: "Буруу бол тайлбар" },
];

/** Knowledge flight: flap a falcon through the gap with the right answer; a wrong gap pauses on its explanation. */
export function FlightGame({ subjects, subjectId, questions }: FlightGameProps) {
  const { canvasRef, bannerRef, hud, card, finish, soundOn, start, tick, resume, again, toggleSound } = useFlightGame(questions, subjectId);
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState(false);
  const onStart = useCallback(() => {
    setPlaying(true);
    setHint(true);
    start();
  }, [start]);
  // "Tap to flap" for the first seconds of a game.
  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(false), 3000);
    return () => clearTimeout(timer);
  }, [hint]);

  return (
    <GameShell
      title="Мэдлэгийн нислэг"
      score={hud.score}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/flight" />
          <RoundProgress current={finish ? ROUNDS : hud.round} total={ROUNDS} />
        </>
      }
    >
      <div className="game-field relative aspect-[4/5] touch-none overflow-hidden rounded-[22px]">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-label="Нислэгийн тоглоомын талбар. Товших эсвэл Space дарж дүүлнэ." />
        <TaskBanner ref={bannerRef} tag="Нис" prompt={hud.prompt} marks={[0, 1, 2].map((i) => hud.marks[i])} />
        {hud.combo >= 2 && !finish ? (
          <p className="game-pop absolute top-[84px] right-4 text-sm font-extrabold text-[var(--game-gold)] [text-shadow:0_2px_0_#000]">КОМБО x{hud.combo}</p>
        ) : null}
        {hint && !card ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-16 text-center font-extrabold text-white [text-shadow:0_2px_0_#000]">Товшоод дүүл ▲</p>
        ) : null}
        <ExplainCard card={card} onContinue={resume} />
        {!playing ? (
          <StartOverlay title={<>Шонхороо<br />зөв хаалгаар нисгэ</>} steps={STEPS} buttonLabel="Нисэх" onStart={onStart} onTick={tick} />
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
            <p className="text-sm font-extrabold text-[var(--game-gold)]">{finish.record ? "Шинэ рекорд!" : `Рекорд: ${finish.best} оноо`}</p>
          </ResultPanel>
        ) : null}
      </div>
      <p className="text-center text-xs text-[var(--game-muted)]">Хаалга бүр 3 завсартай. Аль нь зөв болохыг бодож ол. Хана мөргөхөд унахгүй.</p>
    </GameShell>
  );
}
