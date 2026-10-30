import type { Metadata } from "next";
import { chooseClass } from "@/lib/class-actions";
import { cn } from "@/lib/cn";
import { getStudentClasses, getStudentSubject } from "@/lib/data";
import { GRADES, OPEN_GRADES, TEACHER_SUBJECTS, subjectTitle } from "@/lib/subjects";
import { PracticePicker } from "./PracticePicker";

export const metadata: Metadata = {
  title: "Хичээл сонгох · LevelUp",
};

/**
 * A student in classes picks which one (subject) to study in: its videos,
 * assignments and game questions. A student in no class picks a subject and
 * grade to practise on their own.
 */
export default async function SubjectPage() {
  const [classes, current] = await Promise.all([getStudentClasses(), getStudentSubject()]);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 pb-16 md:px-[clamp(16px,4vw,40px)] md:pt-8">
      <h1 className="type-page-title">Хичээл сонгох</h1>

      {classes.length ? (
        <>
          <p className="mt-2 text-base font-semibold text-ink-muted">
            Сонгосон хичээлд тохирох видео, даалгавар, тоглоомын асуултууд харагдана.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => {
              const selected = c.code === current?.class?.code;
              return (
                <li key={c.id}>
                  <form action={chooseClass.bind(null, c.id)} className="h-full">
                    <button
                      type="submit"
                      aria-current={selected || undefined}
                      className={cn(
                        "flex h-full min-h-32 w-full cursor-pointer flex-col items-start justify-between gap-3 rounded-panel border-3 bg-card p-6 text-left shadow-card transition-colors",
                        selected ? "border-primary" : "border-transparent hover:border-line",
                      )}
                    >
                      <span className="text-2xl font-bold">{subjectTitle(c.subject)}</span>
                      <span className="text-sm font-semibold text-ink-muted">
                        {c.name} анги{c.teacherName ? ` · Багш: ${c.teacherName}` : ""}
                        {selected ? " · одоо сонгосон" : ""}
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <>
          <p className="mt-4 rounded-card bg-surface px-5 py-4 text-base font-semibold">
            Та ангид бүртгэлгүй байна. Багшдаа хэлж ангидаа бүртгүүлнэ үү. Тэр болтол хүссэн хичээл, ангиа
            сонгоод тоглоом тоглож болно.
          </p>
          <PracticePicker
            subjects={TEACHER_SUBJECTS.map(({ id, title }) => ({ id, title }))}
            grades={GRADES.map((g) => ({ grade: g, open: OPEN_GRADES.includes(g) }))}
            initial={current ? { subject: current.subject, grade: current.grade } : undefined}
          />
        </>
      )}
    </div>
  );
}
