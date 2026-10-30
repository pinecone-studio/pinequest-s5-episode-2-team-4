import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { getClassVideos, getSeenVideoIds } from "@/lib/data";

export const metadata: Metadata = {
  title: "Хичээлийн видео · LevelUp",
};

/** Lesson reels the student's teacher published for the class. */
export default async function StudentVideosPage() {
  const [videos, seenIds] = await Promise.all([getClassVideos(), getSeenVideoIds()]);
  const seen = new Set(seenIds);

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5 px-4 py-6 md:gap-7 md:px-[clamp(16px,4vw,40px)] md:py-10">
      <div>
        <h1 className="type-page-title">Хичээлийн видео</h1>
        <p className="mt-3 text-ink-muted md:text-lg">Багшийн бэлдсэн 1 минутын видео. Номын хэлбэрээр уншиж ч болно.</p>
      </div>

      {videos.length === 0 ? (
        <section className="glass-panel rounded-panel border border-line bg-white p-6 text-center shadow-card">
          <h2 className="text-xl font-bold">Одоогоор видео алга</h2>
          <p className="mt-1 text-ink-muted">Багш видео нийтлэхээр энд гарна.</p>
          <ButtonLink href="/" variant="secondary" size="sm" className="mt-4">
            Нүүр хуудас
          </ButtonLink>
        </section>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {videos.map((v) => (
            <li key={v.id}>
              <Link
                href={`/videos/${v.id}`}
                className="glass-panel flex h-full items-center gap-4 rounded-panel border border-line bg-white p-4 text-ink no-underline shadow-card hover:text-ink hover:ring-2 hover:ring-primary"
              >
                <span aria-hidden="true" className="flex h-20 w-12 shrink-0 items-center justify-center rounded-tile bg-linear-to-b from-primary to-primary-dark text-xl text-white">
                  ▶
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2 text-lg leading-snug font-bold">
                    {v.script.title}
                    {!seen.has(v.id) && (
                      <span className="rounded-full bg-magenta px-2 py-0.5 text-xs font-bold text-white">Шинэ</span>
                    )}
                  </span>
                  <span className="text-sm text-ink-muted">{v.script.sections.length} хэсэг</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
