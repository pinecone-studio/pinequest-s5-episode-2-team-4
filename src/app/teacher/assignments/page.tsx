import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getTeacherAssignments } from "@/lib/data";
import { gameTitle } from "@/lib/gamefit";
import { subjectLabel } from "../_content/ui";
import { formatDay } from "../_content/format";

export const metadata: Metadata = {
  title: "Даалгавар · LevelUp",
};

/** The teacher's game assignments, newest first. */
export default async function AssignmentsPage() {
  const assignments = await getTeacherAssignments();

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="type-page-title">Тоглоомон даалгавар</h1>
          <p className="mt-3 max-w-160 text-ink-muted md:text-lg">
            Сэдэв эсвэл өөрийн материалаас асуулт гаргаад сурагчдын тоглодог тоглоомоор даалгавар өгнө.
          </p>
        </div>
        <ButtonLink href="/teacher/assignments/new" className="self-start md:self-auto">
          + Шинэ даалгавар
        </ButtonLink>
      </div>

      {assignments.length === 0 ? (
        <Card className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-bold">Даалгавар алга</h2>
          <p className="text-ink-muted">Эхний даалгавраа үүсгэхэд 2–3 минут болно.</p>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/teacher/assignments/${a.id}`}
                className="flex h-full flex-col gap-2 rounded-card bg-white p-4 text-ink no-underline shadow-card hover:text-ink hover:ring-2 hover:ring-primary md:p-5"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold">{a.classCode}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-bold",
                      a.status === "published" ? "bg-sky" : "border-2 border-dashed border-line",
                    )}
                  >
                    {a.status === "published" ? "Нийтэлсэн" : "Ноорог"}
                  </span>
                </span>
                <span className="text-lg leading-snug font-bold">{a.title}</span>
                <span className="text-sm text-ink-muted">
                  {subjectLabel(a.subject)} · {a.gameMode === "interest" ? "Сонирхлоор" : a.games.map(gameTitle).join(", ")}
                </span>
                {a.dueAt && <span className="text-sm font-semibold">Хугацаа: {formatDay(a.dueAt)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
