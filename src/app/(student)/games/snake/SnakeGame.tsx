"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { GameQuestion } from "@/lib/types";
import { ExplainCard } from "../_components/ExplainCard";
import { GameShell } from "../_components/GameShell";
import { ResultPanel } from "../_components/ResultPanel";
import { RoundProgress } from "../_components/RoundProgress";
import { StartOverlay } from "../_components/StartOverlay";
import { SubjectSelect } from "../_components/SubjectSelect";
import { TaskBanner } from "../_components/TaskBanner";
import { ROUNDS } from "../_lib/session";
import { DEFAULT_SKIN_STATE, readSkinState, subscribeSkinState, writeSkinState } from "./engine/skins";
import { SkinPicker } from "./SkinPicker";
import { useSnakeGame } from "./useSnakeGame";

type SnakeGameProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
};

const STEPS = [
  { icon: "👆", text: "Хуруугаараа чиглүүл" },
  { icon: "✅", text: "Таарах 3-ыг ид" },
  { icon: "💡", text: "Буруу бол тайлбар" },
];

/** Knowledge snake: steer to the 3 answers that fit the task; a wrong bite pauses on its explanation. */
export function SnakeGame({ subjects, subjectId, questions }: SnakeGameProps) {
  const saved = useSyncExternalStore(subscribeSkinState, readSkinState, () => DEFAULT_SKIN_STATE);
  const { canvasRef, bannerRef, hud, card, finish, soundOn, start, tick, resume, again, toggleSound } = useSnakeGame(
    questions,
    saved.skin,
  );
  const [playing, setPlaying] = useState(false);
  const onStart = useCallback(() => {
    setPlaying(true);
    start();
  }, [start]);

  return (
    <GameShell
      title="Мэдлэгийн могой"
      score={hud.score}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/snake" />
          <RoundProgress current={finish ? ROUNDS : hud.round} total={ROUNDS} />
        </>
      }
    >
      <div className="game-field relative aspect-[4/5] overflow-hidden rounded-[22px]">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-label="Могойн тоглоомын талбар. Хуруу эсвэл сумаар чиглүүлнэ." />
        <TaskBanner ref={bannerRef} tag="Ид" prompt={hud.prompt} marks={[0, 1, 2].map((i) => (i < hud.found ? true : undefined))} />
        {hud.combo >= 2 && !finish ? (
          <p className="game-pop absolute top-[84px] right-4 text-sm font-extrabold text-[var(--game-gold)] [text-shadow:0_2px_0_#000]">КОМБО x{hud.combo}</p>
        ) : null}
        <ExplainCard card={card} onContinue={resume} />
        {!playing ? (
          <StartOverlay title={<>Зөвийг нь ид,<br />могойгоо томруул</>} steps={STEPS} buttonLabel="Тоглох" onStart={onStart} onTick={tick}>
            <SkinPicker stars={saved.stars} value={saved.skin} onChange={(skin) => writeSkinState({ ...saved, skin })} />
          </StartOverlay>
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
            <p className="text-sm font-extrabold text-[var(--game-gold)]">
              {finish.unlocked ? `Шинэ могой нээгдлээ: ${finish.unlocked}!` : `Нийт ★${saved.stars}`}
            </p>
          </ResultPanel>
        ) : null}
      </div>
    </GameShell>
  );
}
