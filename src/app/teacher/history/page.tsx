import type { Metadata } from "next";
import Link from "next/link";
import { PetSprite } from "@/components/pet/PetSprite";
import { Card, ProgressBar, buttonClass } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getBattleLog, getBosses } from "@/lib/data";
import type { BattleStatus } from "@/lib/types";
import { classLabel } from "@/lib/class-label";

export const metadata: Metadata = {
  title: "Тулааны түүх · LevelUp",
};

const STATUS: Record<BattleStatus, string> = {
  lobby: "Нэгдэхийг хүлээж байна",
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

const percent = (correct: number, total: number) => (total > 0 ? Math.round((correct / total) * 100) : 0);

/**
 * The teacher's class boss battles and how the class answered each question.
 * Students are counted or numbered, never named, so it can go on the projector.
 */
export default async function BattleHistoryPage({ searchParams }: PageProps<"/teacher/history">) {
  const { class: asked, battle } = await searchParams;
  const classCode = typeof asked === "string" ? asked.trim().slice(0, 10) : "";
  const [log, bosses] = await Promise.all([
    getBattleLog(classCode || undefined, typeof battle === "string" ? battle : undefined),
    getBosses(),
  ]);
  const bossOf = (id: string) => bosses.find((b) => b.id === id);
  const selected = log.selected;
  const query = (battleId: string) =>
    `/teacher/history?${new URLSearchParams({ ...(classCode ? { class: classCode } : {}), battle: battleId })}`;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="type-page-title">Тулааны түүх</h1>
          <p className="mt-3 max-w-160 text-ink-muted md:text-lg">
            Ангийн тулаан бүрийн оролцоо, асуулт тус бүрийн хариултын дүнг харуулна. Сурагчдын нэрийг харуулахгүй.
          </p>
        </div>
        <form className="flex items-end gap-2">
          <label className="flex flex-col gap-1.5 font-bold">
            Анги
            <input
              name="class"
              defaultValue={classCode}
              maxLength={10}
              placeholder="Бүх анги"
              autoComplete="off"
              className="h-12 w-36 rounded-tile border-2 border-lavender bg-white px-3 text-base font-bold text-ink uppercase placeholder:font-medium placeholder:normal-case focus:border-primary focus:outline-none"
            />
          </label>
          <button type="submit" className={buttonClass({ variant: "secondary", size: "sm" })}>
            Харах
          </button>
        </form>
      </div>

      {log.battles.length === 0 ? (
        <Card className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-bold">Тулаан алга</h2>
          <p className="text-ink-muted">Багшийн самбараас ангийн тулаан үүсгэсний дараа үр дүн нь энд харагдана.</p>
          <Link href="/teacher" className="font-bold">
            Багшийн самбар руу →
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
          <nav aria-label="Тулаанууд">
            <ul className="flex flex-col gap-2">
              {log.battles.map((b) => {
                const boss = bossOf(b.bossId);
                const current = b.id === selected?.id;
                return (
                  <li key={b.id}>
                    <Link
                      href={query(b.id)}
                      aria-current={current ? "page" : undefined}
                      scroll={false}
                      className={cn(
                        "flex items-center gap-3 rounded-card bg-white p-3 text-ink no-underline shadow-card hover:text-ink",
                        current ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-lavender",
                      )}
                    >
                      {boss ? <PetSprite stage={{ name: boss.name, sprite: boss.sprite }} size={48} className="shrink-0" /> : null}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-bold">
                          {b.subjectTitle} · {classLabel(b.classCode)}
                        </span>
                        <span className="text-sm text-ink-muted">
                          {when.format(new Date(b.date))} · {STATUS[b.status]}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm">
                        <span className="block font-bold">{b.answers ? `${percent(b.correct, b.answers)}%` : "–"}</span>
                        <span className="text-ink-muted">{b.students} сур.</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {selected ? (
            <div className="flex flex-col gap-5">
              <Card className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-bold text-ink-muted">
                    {classLabel(selected.classCode)} анги · {when.format(new Date(selected.date))} · {STATUS[selected.status]}
                  </p>
                  <h2 className="mt-1 type-section-title">
                    {selected.subjectTitle}
                    {bossOf(selected.bossId) ? ` · ${bossOf(selected.bossId)!.name}` : ""}
                  </h2>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Сурагч", selected.students],
                    ["Хариулт", selected.answers],
                    ["Зөв", selected.answers ? `${percent(selected.correct, selected.answers)}%` : "–"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-tile bg-surface px-2 py-3">
                      <dt className="text-sm text-ink-muted">{label}</dt>
                      <dd className="text-3xl font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card className="flex flex-col gap-3">
                <h3 className="type-section-title">Асуулт бүрээр</h3>
                {selected.questions.length === 0 ? (
                  <p className="text-ink-muted">Энэ тулаанд хариулт ирээгүй байна.</p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {selected.questions.map((q) => {
                      const p = percent(q.correct, q.answers);
                      return (
                        <li key={q.questionId} className="flex flex-col gap-2 rounded-card bg-surface p-3 md:p-4">
                          <div className="flex items-start justify-between gap-3">
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="font-bold">{q.prompt}</span>
                              {q.display && <span className="text-sm">{q.display}</span>}
                              <span className="text-sm text-ink-muted">Зөв хариулт: {q.expected}</span>
                            </span>
                            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold", p < 50 ? "bg-pink" : p < 80 ? "bg-lavender" : "bg-sky")}>
                              {p}%
                            </span>
                          </div>
                          <ProgressBar value={p} label={`${q.prompt}: зөв хувь`} size="sm" track="white" />
                          <p className="text-sm text-ink-muted">
                            {q.answers} хариулт · {q.correct} зөв · {q.answers - q.correct} буруу · {q.students} сурагч зөв хариулсан
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Card>

              {selected.perStudent.length > 0 && (
                <Card className="flex flex-col gap-3">
                  <h3 className="type-section-title">Сурагч бүрээр</h3>
                  <p className="text-sm text-ink-muted">Оролцогчдыг нэгдсэн дарааллаар дугаарласан. Нэр болон онооны эрэмбийг харуулахгүй.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left">
                      <thead>
                        <tr className="text-sm text-ink-muted">
                          <th scope="col" className="py-2 pr-3 font-bold">Сурагч</th>
                          <th scope="col" className="py-2 pr-3 font-bold">Зөв</th>
                          <th scope="col" className="py-2 pr-3 font-bold">Буруу</th>
                          <th scope="col" className="py-2 pr-3 font-bold">Зөв хариултын хувь</th>
                          <th scope="col" className="py-2 font-bold">Хохирол</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.perStudent.map((s, i) => (
                          <tr key={i} className="border-t border-line">
                            <th scope="row" className="py-2 pr-3 font-bold">Сурагч {i + 1}</th>
                            <td className="py-2 pr-3">{s.correct}</td>
                            <td className="py-2 pr-3">{s.wrong}</td>
                            <td className="py-2 pr-3">{s.correct + s.wrong ? `${percent(s.correct, s.correct + s.wrong)}%` : "–"}</td>
                            <td className="py-2">{s.damage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              <Link href={`/teacher/english${classCode ? `?class=${encodeURIComponent(classCode)}` : ""}`} className="w-fit font-bold">
                Англи хэлний ур чадварын нэгтгэл →
              </Link>
            </div>
          ) : (
            <Card>
              <p className="text-ink-muted">Одоогоор сурагч оролцсон тулаан алга.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
