import Link from "next/link";
import { PetSprite } from "@/components/pet/PetSprite";
import { ButtonLink, buttonClass } from "@/components/ui";
import { createClassBossBattle } from "@/lib/battle-actions";
import { cn } from "@/lib/cn";
import type { Boss, ClassBattleSummary } from "@/lib/types";
import { classLabel } from "@/lib/class-label";

type ClassBattleCardProps = {
  bosses: Boss[];
  /** Subjects the questions can come from (the teacher's subject's topics). */
  subjects: { id: string; title: string }[];
  /** The subject the teacher teaches, e.g. "Математик". */
  teacherSubjectTitle?: string;
  /** The teacher's unfinished class battle, if any. */
  open: ClassBattleSummary | undefined;
  /** The class to suggest. */
  classCode: string;
  className?: string;
};

const STATUS = { lobby: "Сурагчид нэгдэж байна", active: "Тулаан явагдаж байна", paused: "Түр зогссон" };

/** Opens a boss battle for the whole class, or goes back to the one already open. */
export function ClassBattleCard({ bosses, subjects, teacherSubjectTitle, open, classCode, className }: ClassBattleCardProps) {
  const openBoss = open && bosses.find((b) => b.id === open.bossId);
  return (
    <section
      aria-labelledby="class-battle-title"
      className={cn("rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:px-8 md:py-6", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="class-battle-title" className="type-section-title">
          Ангийн босс тулаан
        </h2>
        <Link href={`/teacher/history?class=${encodeURIComponent(open?.classCode ?? classCode)}`} className="font-bold">
          Тулааны түүх →
        </Link>
      </div>

      {open ? (
        <div className="mt-4 flex flex-col gap-4 rounded-card bg-surface p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {openBoss ? <PetSprite stage={{ name: openBoss.name, sprite: openBoss.sprite }} size={64} /> : null}
            <div>
              <p className="text-lg font-bold">
                {classLabel(open.classCode)} анги · {open.subjectTitle}{openBoss ? ` · ${openBoss.name}` : ""}
              </p>
              <p className="text-ink-muted">
                {STATUS[open.status]} · {open.students} сурагч
              </p>
            </div>
          </div>
          <ButtonLink href={`/teacher/battle/${open.id}`} size="sm">
            Тулааныг нээх
          </ButtonLink>
        </div>
      ) : (
        <form action={createClassBossBattle} className="mt-3">
          <p className="text-ink-muted">
            Бүх анги нэг боссыг хамтдаа ялна. Боссоо сонгоод тулааныг нээгээрэй: асуултууд зөвхөн таны заадаг
            хичээлээс гарна. Сурагчид ангийн кодоороо эсвэл дэлгэц дээрх кодоор нэгдэнэ.
          </p>
          <fieldset className="mt-4">
            <legend className="mb-2 font-bold">Босс</legend>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {bosses.map((boss, i) => (
                <label
                  key={boss.id}
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-tile border-2 border-lavender bg-white p-2 text-sm font-bold transition-colors hover:border-primary has-checked:border-primary has-checked:bg-surface has-focus-visible:ring-2 has-focus-visible:ring-primary"
                >
                  <input type="radio" name="boss" value={boss.id} defaultChecked={i === 0} className="sr-only" />
                  <PetSprite stage={{ name: boss.name, sprite: boss.sprite }} size={56} />
                  {boss.name}
                  <span aria-label={`Хүндийн зэрэг ${boss.difficulty}/5`} className="text-xs tracking-widest text-magenta">
                    {"★".repeat(boss.difficulty)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            {subjects.length === 1 ? (
              <p className="flex flex-col gap-1.5 font-bold">
                Хичээл
                <span className="flex h-12 items-center rounded-tile bg-surface px-3 md:w-60">{subjects[0].title}</span>
                <input type="hidden" name="subject" value={subjects[0].id} />
              </p>
            ) : (
              <label className="flex flex-col gap-1.5 font-bold">
                {teacherSubjectTitle ? `${teacherSubjectTitle}: сэдэв` : "Хичээл"}
                <select
                  name="subject"
                  defaultValue={subjects[0]?.id}
                  className="h-12 w-full rounded-tile border-2 border-lavender bg-white px-3 text-base text-ink focus:border-primary focus:outline-none md:w-60"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1.5 font-bold">
              Ангийн код
              <input
                name="classCode"
                defaultValue={classCode}
                required
                maxLength={10}
                autoComplete="off"
                className="h-12 w-full rounded-tile border-2 border-lavender bg-white px-3 text-base text-ink focus:border-primary focus:outline-none md:w-40"
              />
            </label>
            <button type="submit" className={buttonClass({ size: "sm" })}>
              Тулаан нээх
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
