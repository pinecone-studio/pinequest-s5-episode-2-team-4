import type { Metadata } from "next";
import Link from "next/link";
import { PetSprite } from "@/components/pet/PetSprite";
import { ProgressBar, buttonClass } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { getBosses, getClassEnglish, getClassGoal } from "@/lib/data";
import type { BattleStatus } from "@/lib/types";
import { SKILL_LABELS } from "@/app/(student)/pets/battle/labels";

export const metadata: Metadata = {
  title: "Ангийн англи хэл · LevelUp",
};

const percent = (correct: number, attempts: number) => (attempts > 0 ? Math.round((correct / attempts) * 100) : 0);

const BATTLE_STATUS: Record<BattleStatus, string> = {
  lobby: "Лобби",
  active: "Явагдаж байна",
  paused: "Түр зогссон",
  won: "Ялалт",
  lost: "Ялагдсан",
  ended: "Дуусгасан",
};

const when = new Intl.DateTimeFormat("mn-MN", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ulaanbaatar",
});

/**
 * A class's English results from boss battles, for the teacher. Everything is
 * added up: no student is named or ranked, so it can go on the projector.
 */
export default async function ClassEnglishPage({ searchParams }: PageProps<"/teacher/english">) {
  await requireTeacher();
  const { class: asked } = await searchParams;
  const goal = await getClassGoal();
  const classCode = (typeof asked === "string" && asked.trim().slice(0, 10)) || goal.classCode;
  const [view, bosses] = await Promise.all([getClassEnglish(classCode), getBosses()]);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <Link href="/teacher" className="w-fit font-bold">
        ← Багшийн самбар
      </Link>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[40px] leading-none font-bold tracking-[-0.03em] md:text-[56px]">
            {view?.classCode ?? classCode} ангийн англи хэл
          </h1>
          <p className="mt-3 max-w-160 text-ink-muted md:text-lg">
            Боссын тулаанд өгсөн хариултаас ангиар нь нэгтгэсэн. Сурагчийн нэр, эрэмбэ энд гарахгүй.
          </p>
        </div>
        <form className="flex items-end gap-2">
          <label className="flex flex-col gap-1.5 font-bold">
            Анги
            <input
              name="class"
              defaultValue={view?.classCode ?? classCode}
              maxLength={10}
              autoComplete="off"
              className="h-12 w-28 rounded-tile border-2 border-lavender bg-white px-3 text-base text-ink focus:border-primary focus:outline-none"
            />
          </label>
          <button type="submit" className={buttonClass({ variant: "secondary", size: "sm" })}>
            Харах
          </button>
        </form>
      </div>

      {!view || (view.attempts === 0 && view.battles.length === 0) ? (
        <p className="rounded-panel bg-surface px-6 py-10 text-center text-lg font-bold">
          Энэ ангийн хариулт одоогоор алга. Ангийн тулаан нээгээд эхлээрэй.
        </p>
      ) : (
        <>
          <section aria-label="Нийт" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              ["Сурагч", view.students],
              ["Хариулсан сурагч", view.active],
              ["Хариулт", view.attempts],
              ["Нарийвчлал", `${percent(view.correct, view.attempts)}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-card bg-white p-4 shadow-card">
                <p className="text-sm text-ink-muted">{label}</p>
                <p className="text-3xl font-bold">{value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            <section aria-labelledby="skills-title" className="rounded-panel bg-white p-5 shadow-card md:p-7">
              <h2 id="skills-title" className="text-2xl font-bold">
                Ур чадвар
              </h2>
              <ul className="mt-4 flex flex-col gap-4">
                {view.bySkill.map((s) => (
                  <li key={s.skill}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-bold">{SKILL_LABELS[s.skill]}</p>
                      <p className="text-sm text-ink-muted">
                        {s.attempts > 0 ? `${percent(s.correct, s.attempts)}% · ${s.attempts} хариулт` : "Хариулт алга"}
                      </p>
                    </div>
                    <ProgressBar
                      value={percent(s.correct, s.attempts)}
                      label={`${SKILL_LABELS[s.skill]} нарийвчлал`}
                      size="sm"
                      className="mt-2"
                    />
                    {s.needPractice > 0 ? (
                      <p className="mt-1.5 text-sm font-bold text-magenta">
                        {s.needPractice} сурагчид илүү дасгал хэрэгтэй
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="units-title" className="rounded-panel bg-white p-5 shadow-card md:p-7">
              <h2 id="units-title" className="text-2xl font-bold">
                Бүлэг тус бүрээр
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {view.byUnit.map((u) => (
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
          </div>

          <section aria-labelledby="hard-title" className="rounded-panel bg-white p-5 shadow-card md:p-7">
            <h2 id="hard-title" className="text-2xl font-bold">
              Анги хамгийн их алдсан асуултууд
            </h2>
            <p className="mt-1 text-ink-muted">Дахин тайлбарлахад тустай.</p>
            {view.hardest.length === 0 ? (
              <p className="mt-4 rounded-card bg-surface px-4 py-3 font-bold">
                Хангалттай хариулт хуримтлагдаагүй байна.
              </p>
            ) : (
              <ol className="mt-4 flex flex-col gap-3">
                {view.hardest.map((q) => (
                  <li
                    key={q.questionId}
                    className="flex flex-col gap-2 rounded-card bg-surface p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold">
                        {SKILL_LABELS[q.skill]}
                      </span>
                      <p lang="en" className="mt-1.5 font-bold">
                        {q.prompt}
                        {q.display ? <span className="text-ink-muted"> {q.display}</span> : null}
                      </p>
                    </div>
                    <p className={cn("shrink-0 font-bold", percent(q.correct, q.attempts) < 50 && "text-magenta")}>
                      {percent(q.correct, q.attempts)}% зөв · {q.attempts} хариулт
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="class-battles-title" className="rounded-panel bg-white p-5 shadow-card md:p-7">
            <h2 id="class-battles-title" className="text-2xl font-bold">
              Ангийн тулаанууд
            </h2>
            {view.battles.length === 0 ? (
              <p className="mt-4 rounded-card bg-surface px-4 py-3 font-bold">Энэ ангид тулаан нээгээгүй байна.</p>
            ) : (
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {view.battles.map((b) => {
                  const boss = bosses.find((x) => x.id === b.bossId);
                  return (
                    <li key={b.id} className="flex items-center gap-3 rounded-card bg-surface p-3">
                      {boss ? <PetSprite stage={{ name: boss.name, sprite: boss.sprite }} size={48} /> : null}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">
                          {boss?.name ?? b.bossId} · {BATTLE_STATUS[b.status]}
                        </p>
                        <p className="text-sm text-ink-muted">
                          {when.format(new Date(b.date))} · {b.students} сурагч · {b.damage} хохирол
                        </p>
                      </div>
                      {b.status === "lobby" || b.status === "active" || b.status === "paused" ? (
                        <Link href={`/teacher/battle/${b.id}`} className="shrink-0 font-bold">
                          Нээх
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
