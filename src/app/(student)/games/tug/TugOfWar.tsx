"use client";

import { PixelIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameQuestion } from "@/lib/types";
import { ChoiceGrid } from "../_components/ChoiceGrid";
import { ExplainCard } from "../_components/ExplainCard";
import { GameShell } from "../_components/GameShell";
import { ResultPanel } from "../_components/ResultPanel";
import { StartOverlay } from "../_components/StartOverlay";
import { SubjectSelect } from "../_components/SubjectSelect";
import { RopeScene } from "./RopeScene";
import { LIMIT } from "./rules";
import { useTugOfWar } from "./useTugOfWar";

type TugOfWarProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
};

/** One line of commentary from the flag position. */
function commentary(rope: number, started: boolean) {
  if (!started) return "Хоёр баг олсоо барьж бэлэн байна…";
  if (rope > LIMIT * 0.6)
    return (
      <>
        Ялалт ойрхон байна! Нэг л татчих <PixelIcon name="fire" className="inline-block size-4 align-[-0.15em]" />
      </>
    );
  if (rope > 10) return "Чиний баг давуу байна. Үргэлжлүүл!";
  if (rope >= -10) return "Тэнцүү байна. Хэн нь хүчтэй вэ?";
  if (rope >= -LIMIT * 0.6) return "Ботууд татаж байна. Хурдан, зөв хариул!";
  return (
    <>
      Аюул! Туг ботуудын шугамд ойртлоо <PixelIcon name="worried" className="inline-block size-4 align-[-0.15em]" />
    </>
  );
}

/** Real-time tug of war: the bot team never stops pulling; every right answer pulls the rope back. */
export function TugOfWar({ subjects, subjectId, questions }: TugOfWarProps) {
  const { tug, round, picked, explain, result, won, soundOn, start, choose, next, tick, toggleSound } = useTugOfWar(questions);
  const rope = tug?.rope ?? 0;
  // 0% at the bots' line, 100% at the player's.
  const meter = ((rope + LIMIT) / (2 * LIMIT)) * 100;

  return (
    <GameShell
      title="Олс таталт"
      score={tug?.score ?? 0}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/tug" />
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-[var(--game-gold)]">Чи</span>
            <span
              role="meter"
              aria-label="Олсны байрлал"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(meter)}
              className="game-chip relative h-3 flex-1 overflow-hidden rounded-full"
            >
              <span className="absolute inset-y-0 left-0 bg-linear-to-r from-[var(--game-gold)] to-[#ffe39a] transition-[width] duration-300" style={{ width: `${meter}%` }} />
              <span className="absolute inset-y-0 left-1/2 w-0.5 bg-white/60" />
            </span>
            <span className="text-sm font-bold text-[#ff7ccf]">Бот</span>
          </div>
        </>
      }
    >
      <div className="relative flex min-h-[460px] flex-col gap-3 overflow-hidden rounded-[22px]">
        <div className="game-field relative overflow-hidden rounded-[22px]">
          <RopeScene rope={rope} heaves={tug?.heaves ?? 0} running={tug !== null && !result} />
          {!tug ? (
            <StartOverlay
              title="Олс таталт"
              steps={[
                { icon: <PixelIcon name="check" className="size-6" />, text: "Зөв хариулбал олсыг татна" },
                { icon: <PixelIcon name="robot" className="size-6" />, text: "Ботууд зогсохгүй татна" },
                { icon: <PixelIcon name="flag" className="size-6" />, text: "Тугийг шугамаас давуул" },
              ]}
              buttonLabel="Татаж эхлэх"
              onStart={start}
              onTick={tick}
            />
          ) : null}
        </div>

        <p aria-live="polite" className={cn("game-glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold", rope < -LIMIT * 0.6 && "border-[var(--game-bad)]")}>
          <PixelIcon name="megaphone" className="size-5" />
          {commentary(rope, tug !== null)}
          {tug && tug.combo >= 2 ? <b className="ml-auto text-[var(--game-gold)]">x{tug.combo}</b> : null}
        </p>

        {round ? (
          <ChoiceGrid round={round} picked={picked} onChoose={choose} roundKey={tug?.index ?? 0} />
        ) : (
          <p className="text-sm text-[var(--game-muted)]">
            Ботууд олсыг тасралтгүй татна. Зөв хариулт бүрт чиний баг олсыг эргүүлж татна, дараалсан зөв хариулт улам хүчтэй татна.
          </p>
        )}

        <ExplainCard card={explain} onContinue={next} />

        {result ? (
          <ResultPanel result={result} onAgain={start} otherHref="/games">
            <p className="text-sm font-extrabold text-[var(--game-gold)]">
              {won ? (
                <>
                  <PixelIcon name="trophy" className="inline-block size-4 align-[-0.15em]" /> Чиний баг яллаа!
                </>
              ) : "Ботууд энэ удаа яллаа. Дахиад нэг үз!"}
            </p>
          </ResultPanel>
        ) : null}
      </div>
    </GameShell>
  );
}
