import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, ProgressBar, buttonClass } from "@/components/ui";
import { switchDemoTour } from "@/lib/actions";
import { getAssignmentReport, getClassSize, getDemoTour, getSubtopics } from "@/lib/data";
import { gameTitle } from "@/lib/gamefit";
import type { GameAnswer } from "@/lib/types";
import { formatDay } from "../../_content/format";
import { subjectLabel } from "../../_content/ui";
import { UnpublishButton } from "./UnpublishButton";

export const metadata: Metadata = {
  title: "Даалгаврын үр дүн · LevelUp",
};

const answerText = (a: GameAnswer) => (typeof a === "string" ? a : a.name);

/**
 * How the class did on an assignment. Only totals: no student is named, so
 * the teacher can show it to the class.
 */
export default async function AssignmentReportPage({ params }: PageProps<"/teacher/assignments/[id]">) {
  const { id } = await params;
  const report = await getAssignmentReport(id);
  if (!report) notFound();
  const { assignment: a, questions } = report;
  const [classSize, subtopics, tour] = await Promise.all([
    getClassSize(a.classCode),
    getSubtopics("fractions"),
    getDemoTour(),
  ]);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const topMissed = report.missed.filter((m) => byId.has(m.questionId)).slice(0, 5);
  const target = a.target === "weak" ? subtopics.find((s) => s.id === a.targetSubtopicId)?.title : undefined;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <Link href="/teacher/assignments" className="w-fit font-bold">
        ← Даалгаврууд
      </Link>
      {tour?.assignmentId === a.id && (
        <section className="flex flex-col gap-3 rounded-panel border-2 border-dashed border-primary bg-surface p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">Демо · 4. Багш үр дүнг харна</p>
            <p className="mt-1 max-w-2xl">
              Одоо багшийн харагдац. Сурагч тоглож дуусмагц энд шууд тоологдоно. Шинэ даалгаврыг «Даалгавар» цэсээс өөрөө ч үүсгэж болно.
            </p>
          </div>
          <form action={switchDemoTour}>
            <button type="submit" className={buttonClass({ variant: "white", size: "sm" })}>
              ← Сурагч руу буцах
            </button>
          </form>
        </section>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold text-ink-muted">
            {a.classCode} · {subjectLabel(a.subject)} · {a.status === "published" ? "Нийтэлсэн" : "Ноорог"}
          </p>
          <h1 className="mt-1 type-page-title">{a.title}</h1>
          <p className="mt-3 text-ink-muted">
            {a.gameMode === "interest" ? "Сурагчийн сонирхлоор: " : "Тоглоом: "}
            {a.games.map(gameTitle).join(", ")}
            {target && ` · Зөвхөн «${target}» дээр сул сурагчид`}
            {a.dueAt && ` · Хугацаа ${formatDay(a.dueAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {a.status === "published" && <UnpublishButton id={a.id} />}
          <ButtonLink href={`/teacher/assignments/${a.id}/edit`} variant={a.status === "published" ? "secondary" : "primary"} size="sm">
            {a.status === "published" ? "Засах" : "Засаад нийтлэх"}
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex flex-col gap-2">
          <span className="text-sm font-bold text-ink-muted">Биелүүлсэн</span>
          <span className="text-3xl font-bold">
            {report.doneCount}
            {classSize > 0 && <span className="text-lg text-ink-muted"> / {classSize}</span>}
          </span>
          {classSize > 0 && <ProgressBar value={Math.round((report.doneCount / classSize) * 100)} label="Биелүүлсэн хувь" />}
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-sm font-bold text-ink-muted">Дундаж зөв</span>
          <span className="text-3xl font-bold">{report.attemptCount ? `${report.averageAccuracy}%` : "–"}</span>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-sm font-bold text-ink-muted">Нийт тоглолт</span>
          <span className="text-3xl font-bold">{report.attemptCount}</span>
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="type-section-title">Хамгийн их алдсан асуулт</h2>
        {topMissed.length === 0 ? (
          <p className="text-ink-muted">{report.attemptCount ? "Алдсан асуулт алга." : "Одоохондоо хэн ч тоглоогүй байна."}</p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {topMissed.map((m) => {
              const q = byId.get(m.questionId)!;
              return (
                <li key={m.questionId} className="flex flex-col gap-1 rounded-card bg-surface p-3 md:flex-row md:items-start md:gap-4">
                  <span className="shrink-0 rounded-full bg-pink px-2.5 py-0.5 text-sm font-bold md:mt-0.5">{m.count} удаа</span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-bold">{q.prompt}</span>
                    <span className="text-sm">Зөв: {q.correct.map(answerText).join(", ")}</span>
                    {q.explanation && <span className="text-sm text-ink-muted">{q.explanation}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <p className="text-xs text-ink-muted">Сурагчийн нэр энд гарахгүй. Зөвхөн ангийн нийт дүн.</p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="type-section-title">Асуултууд ({questions.length})</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-6">
          {questions.map((q) => (
            <li key={q.id}>
              <span className="font-semibold">{q.prompt}</span>{" "}
              <span className="text-sm text-ink-muted">→ {q.correct.map(answerText).join(", ")}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
