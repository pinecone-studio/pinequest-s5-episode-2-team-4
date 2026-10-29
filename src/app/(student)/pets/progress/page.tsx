import type { Metadata } from "next";
import { ButtonLink, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getEnglishProgress } from "@/lib/data";
import { SKILL_LABELS } from "../battle/labels";

export const metadata: Metadata = {
  title: "Англи хэлний ахиц · LevelUp",
};

const percent = (correct: number, attempts: number) =>
  attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

export default async function EnglishProgressPage() {
  const progress = await getEnglishProgress();

  return (
    <div className="mx-auto max-w-5xl px-4 pt-2 md:px-[clamp(16px,4vw,40px)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="type-page-title">
            Англи хэлний ахиц
          </h1>
          <p className="mt-3 text-ink-muted md:text-lg">
            Боссын тулаанд өгсөн хариултаас тооцоолно.
          </p>
        </div>
        <ButtonLink href="/pets/battle" size="sm">
          Тулалдах
        </ButtonLink>
      </div>

      {!progress || progress.attempts === 0 ? (
        <p className="mt-8 rounded-panel bg-surface px-6 py-10 text-center text-lg font-bold">
          Одоогоор хариулт алга. Боссын тулаанд оролцоод ахицаа эндээс хараарай.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-5 md:mt-8 md:gap-6">
          {/* Overall */}
          <section aria-label="Нийт" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              ["Хариулсан", progress.attempts],
              ["Зөв", progress.correct],
              ["Нарийвчлал", `${percent(progress.correct, progress.attempts)}%`],
              ["Сурсан үг", `${progress.vocabulary.learned.length}/${progress.vocabulary.total}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-card bg-white p-4 shadow-card">
                <p className="text-sm text-ink-muted">{label}</p>
                <p className="text-3xl font-bold">{value}</p>
              </div>
            ))}
          </section>

          {progress.weakestSkill ? (
            <p className="rounded-card bg-pink px-5 py-4 font-bold">
              Дараагийн зорилго: {SKILL_LABELS[progress.weakestSkill]}. Тулаанд энэ төрлийн асуулт
              илүү олон гарна.
            </p>
          ) : null}

          {/* By skill */}
          <section aria-labelledby="skills-title" className="rounded-panel bg-white p-5 shadow-card md:p-7">
            <h2 id="skills-title" className="text-2xl font-bold">
              Ур чадвар
            </h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4">
              {progress.bySkill.map((s) => {
                const weakest = s.skill === progress.weakestSkill;
                return (
                  <li
                    key={s.skill}
                    className={cn("rounded-card p-4", weakest ? "border-2 border-magenta bg-pink" : "bg-surface")}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-bold">{SKILL_LABELS[s.skill]}</p>
                      <p className="text-sm text-ink-muted">
                        {s.attempts > 0 ? `${s.correct}/${s.attempts} · ${percent(s.correct, s.attempts)}%` : "Шинэ"}
                      </p>
                    </div>
                    <ProgressBar
                      value={percent(s.correct, s.attempts)}
                      label={`${SKILL_LABELS[s.skill]} нарийвчлал`}
                      size="sm"
                      track="white"
                      className="mt-2"
                    />
                    {weakest ? <p className="mt-2 text-sm font-bold">Илүү дасгал хэрэгтэй</p> : null}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* By unit */}
          <section aria-labelledby="units-title" className="rounded-panel bg-white p-5 shadow-card md:p-7">
            <h2 id="units-title" className="text-2xl font-bold">
              Бүлэг тус бүрээр
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {progress.byUnit.map((u) => (
                <li key={u.unitId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                  <p lang="en" className="font-bold">
                    {u.title}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {u.attempts > 0 ? `${percent(u.correct, u.attempts)}%` : "Шинэ"}
                  </p>
                  <ProgressBar
                    value={percent(u.correct, u.attempts)}
                    label={`${u.title} нарийвчлал`}
                    size="sm"
                    className="col-span-2"
                  />
                </li>
              ))}
            </ul>
          </section>

          {/* Vocabulary */}
          <section aria-labelledby="vocab-title" className="rounded-panel bg-white p-5 shadow-card md:p-7">
            <h2 id="vocab-title" className="text-2xl font-bold">
              Сурсан үгс{" "}
              <span className="text-base font-semibold text-ink-muted">
                {progress.vocabulary.learned.length}/{progress.vocabulary.total}
              </span>
            </h2>
            {progress.vocabulary.learned.length > 0 ? (
              <ul lang="en" className="mt-4 flex flex-wrap gap-2">
                {progress.vocabulary.learned.map((word) => (
                  <li key={word} className="rounded-full bg-sky px-3 py-1 font-bold">
                    {word}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-ink-muted">Зөв бичих, орчуулгын асуултад зөв хариулахад энд нэмэгдэнэ.</p>
            )}
          </section>

          {/* Recent mistakes */}
          <section aria-labelledby="mistakes-title" className="rounded-panel bg-white p-5 shadow-card md:p-7">
            <h2 id="mistakes-title" className="text-2xl font-bold">
              Сүүлийн алдаанууд
            </h2>
            {progress.mistakes.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-3">
                {progress.mistakes.map((m) => (
                  <li key={m.questionId} className="rounded-card border-2 border-lavender p-4">
                    <p className="text-xs font-bold text-ink-muted">
                      {SKILL_LABELS[m.skill]} · <span lang="en">{m.unitTitle}</span>
                    </p>
                    <p lang="en" className="mt-1 font-bold">
                      {m.prompt}
                      {m.display ? <span className="ml-1 text-ink-muted">{m.display}</span> : null}
                    </p>
                    <p className="mt-1">
                      Зөв хариулт: <span lang="en" className="font-bold">{m.expected}</span>
                    </p>
                    <p lang="en" className="mt-1 text-sm text-ink-muted">
                      {m.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-ink-muted">Засаагүй алдаа алга. Сайн байна!</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
