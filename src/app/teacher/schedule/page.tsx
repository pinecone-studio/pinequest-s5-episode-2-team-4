import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { getClassSchedule } from "@/lib/data";
import { ScheduleEditor } from "./ScheduleEditor";

export const metadata: Metadata = {
  title: "Хичээлийн хуваарь · LevelUp",
};

/**
 * The open class's lesson days and the topic of each, set once ahead. On a
 * lesson day students are asked «Ойлгосон уу?» about it, even when the
 * teacher doesn't open the app.
 */
export default async function SchedulePage() {
  const schedule = await getClassSchedule();

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-[clamp(16px,4vw,40px)]">
      <h1 className="type-page-title">Хичээлийн хуваарь</h1>
      <p className="mt-2 max-w-160 text-base font-semibold text-ink-muted">
        Хичээл орох гарагуудаа нэг удаа тэмдэглээд, ирэх хичээлүүдийн сэдвийг урьдчилан оруулна. Тэр өдрүүдэд сурагчдаас
        «Ойлгосон уу?» гэж асууна. Сэдэв оруулаагүй өдөр сурагчид өөрсдөө сонгоно.
      </p>
      {schedule ? (
        <ScheduleEditor schedule={schedule} />
      ) : (
        <section className="glass-panel mt-6 flex flex-col items-start gap-3 rounded-panel bg-card p-5 shadow-card md:p-7">
          <h2 className="text-xl font-bold">Анги сонгоогүй байна</h2>
          <p className="text-ink-muted">Хуваарь ангид хамаардаг тул эхлээд ангиа сонгоорой.</p>
          <ButtonLink href="/classes" size="sm">
            Анги сонгох
          </ButtonLink>
        </section>
      )}
    </div>
  );
}
