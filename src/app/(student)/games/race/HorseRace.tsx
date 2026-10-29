"use client";

import { PixelIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameQuestion } from "@/lib/types";
import { ChoiceGrid } from "../_components/ChoiceGrid";
import { ExplainCard } from "../_components/ExplainCard";
import { GameShell } from "../_components/GameShell";
import { ResultPanel } from "../_components/ResultPanel";
import { RoundProgress } from "../_components/RoundProgress";
import { StartOverlay } from "../_components/StartOverlay";
import { SubjectSelect } from "../_components/SubjectSelect";
import { HorseSprite } from "./HorseSprite";
import { Track } from "./Track";
import { FINISH, HORSES, PLAYER, standings, useHorseRace } from "./useHorseRace";

type HorseRaceProps = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
};

const MEDALS = ["🥇", "🥈", "🥉"];
const CONFETTI = ["🎉", "⭐", "🎊", "✨", "🏆", "⭐", "🎉", "✨"];

/** One line of race commentary from the standings. */
function commentary(ranking: ReturnType<typeof standings>) {
  const leaders = ranking.filter((h) => h.place === 1);
  const me = ranking.find((h) => h.id === PLAYER)!;
  if (leaders[0].pos === 0) return "Морьд гарааны хашаанд бэлэн байна…";
  if (me.place === 1 && leaders.length === 1) return "Чи тэргүүлж байна! Ингээд л давхи 🔥";
  if (me.place === 1) return `Чи ${leaders.filter((h) => h.id !== PLAYER).map((h) => h.name).join(", ")}-тэй мөр зэрэгцэж байна!`;
  const gap = leaders[0].pos - me.pos;
  return `${leaders.map((h) => h.name).join(", ")} тэргүүлж байна. Чи ${gap} нүүдлээр хоцорч байна.`;
}

/** Real-time horse race: the bots gallop on their own; answer right to step forward. Keys 1–4 pick an answer. */
export function HorseRace({ subjects, subjectId, questions }: HorseRaceProps) {
  const { race, round, picked, explain, result, soundOn, start, choose, next, tick, toggleSound } = useHorseRace(questions);
  const positions = race?.positions ?? HORSES.map(() => 0);
  const ranking = standings(positions);
  const place = ranking.find((h) => h.id === PLAYER)?.place ?? 1;

  return (
    <GameShell
      title="Морин уралдаан"
      score={race?.score ?? 0}
      soundOn={soundOn}
      onToggleSound={toggleSound}
      controls={
        <>
          <SubjectSelect subjects={subjects} value={subjectId} basePath="/games/race" />
          <RoundProgress
            current={positions[PLAYER]}
            total={FINISH}
            label={race ? `${place}-р байр` : `0/${FINISH}`}
          />
        </>
      }
    >
      <div className="relative flex min-h-[460px] flex-col gap-3 overflow-hidden rounded-[22px]">
        <div className="game-field relative overflow-hidden rounded-[22px]">
          <Track horses={HORSES} positions={positions} steps={FINISH} player={PLAYER} />
          {!race ? (
            <StartOverlay
              title="Морин уралдаан"
              steps={[
                { icon: <PixelIcon name="check" className="size-6" />, text: "Зөв хариулбал +1 нүүдэл" },
                { icon: <HorseSprite silk="#ffcf5a" coat="#8a5a34" number={1} className="h-8 w-10" />, text: "Ботууд зогсохгүй давхина" },
                { icon: <PixelIcon name="finish" className="size-6" />, text: `${FINISH} нүүдэлд түрүүлж хүр` },
              ]}
              buttonLabel="Уралдаан эхлэх"
              onStart={start}
              onTick={tick}
            />
          ) : null}
        </div>

        <p aria-live="polite" className="game-glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold">
          <span aria-hidden="true">📣</span>
          {commentary(ranking)}
        </p>

        {round ? (
          <ChoiceGrid round={round} picked={picked} onChoose={choose} roundKey={race?.index ?? 0} />
        ) : (
          <p className="text-sm text-[var(--game-muted)]">
            Ботууд өөрсдөө давхина. Чи хурдан, зөв хариулж морио урагшлуул. Финишд хамгийн түрүүнд хүрсэн нь ялна.
          </p>
        )}

        <ExplainCard card={explain} onContinue={next} />

        {result ? (
          <ResultPanel result={result} onAgain={start} otherHref="/games">
            {place === 1
              ? CONFETTI.map((c, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="race-confetti pointer-events-none absolute top-0 text-2xl"
                    style={{ left: `${6 + i * 12}%`, animationDelay: `${i * 0.15}s` }}
                  >
                    {c}
                  </span>
                ))
              : null}
            <p className="text-sm font-extrabold text-[var(--game-gold)]">
              {place === 1 ? "🏆 Чи түрүүлж финишд хүрлээ!" : `${ranking[0].name} түрүүллээ. Чи ${place}-р байр.`}
            </p>
            <ol className="flex flex-wrap justify-center gap-1.5 text-xs">
              {ranking.map((h) => (
                <li
                  key={h.id}
                  className={cn("game-chip rounded-full px-2.5 py-1 font-bold", h.id === PLAYER && "border-[var(--game-gold)]")}
                >
                  {MEDALS[h.place - 1] ?? `${h.place}.`} {h.name} · {h.pos}
                </li>
              ))}
            </ol>
          </ResultPanel>
        ) : null}
      </div>
    </GameShell>
  );
}
