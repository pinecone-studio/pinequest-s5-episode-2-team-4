import { ButtonLink, PixelIcon } from "@/components/ui";

type TeacherCardProps = {
  /** Assignments not finished yet */
  assignmentsLeft: number;
  videoCount: number;
};

/** What the teacher has sent: assignments to play and lesson videos to watch. */
export function TeacherCard({ assignmentsLeft, videoCount }: TeacherCardProps) {
  if (assignmentsLeft === 0 && videoCount === 0) return null;
  return (
    <section
      aria-labelledby="teacher-card-title"
      className="glass-panel mb-6 flex flex-col gap-4 rounded-panel border border-line bg-white p-5 shadow-card md:mb-10 md:flex-row md:items-center md:justify-between md:p-7"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-card bg-lavender">
          <PixelIcon name="mail" className="size-8" />
        </span>
        <div>
          <h2 id="teacher-card-title" className="text-xl font-bold">
            Багшийн өгсөн хичээл, даалгавар
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {assignmentsLeft > 0 ? `${assignmentsLeft} даалгавар хүлээж байна` : "Одоогоор дутуу даалгавар алга"}
            {videoCount > 0 && ` · ${videoCount} хичээлийн видео`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {videoCount > 0 && (
          <ButtonLink href="/videos" variant="secondary" size="sm">
            Видео үзэх
          </ButtonLink>
        )}
        <ButtonLink href="/assignments" variant={assignmentsLeft > 0 ? "primary" : "secondary"} size="sm">
          Даалгавар
        </ButtonLink>
      </div>
    </section>
  );
}
