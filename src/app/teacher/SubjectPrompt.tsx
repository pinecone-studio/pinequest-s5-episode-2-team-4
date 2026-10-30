import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/cn";
import { TEACHER_SUBJECTS } from "@/lib/subjects";
import { chooseTeacherSubject } from "@/lib/teacher-actions";

/** Asks a teacher whose account predates subjects which one they teach. */
export function SubjectPrompt({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="subject-prompt-title"
      className={cn("rounded-panel border-2 border-dashed border-primary bg-surface p-5 md:p-7", className)}
    >
      <h2 id="subject-prompt-title" className="type-section-title">
        Заадаг хичээлээ сонгоно уу
      </h2>
      <p className="mt-1 text-ink-muted">
        Таны сонгосон хичээлд тохирсон тулааны асуулт, даалгавар, тайлбар видео бэлтгэх боломжтой болно. Хичээлийг нэг удаа сонгох тул баталгаажуулахаасаа өмнө нягтална уу.
      </p>
      <form action={chooseTeacherSubject} className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex flex-col gap-1.5 font-bold">
          Хичээл
          <select
            name="subject"
            required
            defaultValue=""
            className="h-12 w-full rounded-tile border-2 border-lavender bg-white px-3 text-base text-ink focus:border-primary focus:outline-none md:w-64"
          >
            <option value="" disabled>
              Хичээлээ сонгоно уу
            </option>
            {TEACHER_SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonClass({ size: "sm" })}>
          Хичээлийг баталгаажуулах
        </button>
      </form>
    </section>
  );
}
