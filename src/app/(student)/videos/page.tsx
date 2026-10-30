import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { VideoBookmarkButton } from "@/components/VideoBookmarkButton";
import { ButtonLink, PixelIcon } from "@/components/ui";
import { getBookmarkedVideoIds, getClassVideos, getSeenVideoIds } from "@/lib/data";

export const metadata: Metadata = {
  title: "Хичээлийн видео · LevelUp",
};

/** Lesson reels the student's teacher published for the class. */
export default function StudentVideosPage({ searchParams }: PageProps<"/videos">) {
  return <Suspense fallback={<PageLoading />}><VideoList searchParams={searchParams} /></Suspense>;
}

async function VideoList({ searchParams }: Pick<PageProps<"/videos">, "searchParams">) {
  const [videos, seenIds, bookmarkedIds, params] = await Promise.all([getClassVideos(), getSeenVideoIds(), getBookmarkedVideoIds(), searchParams]);
  const seen = new Set(seenIds);
  const bookmarked = new Set(bookmarkedIds);
  const savedOnly = params.saved === "1";
  const savedVideos = videos.filter((video) => bookmarked.has(video.id));
  const visible = savedOnly ? savedVideos : videos;

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5 px-4 py-6 md:gap-7 md:px-[clamp(16px,4vw,40px)] md:py-10">
      <div>
        <h1 className="type-page-title">Хичээлийн видео</h1>
        <p className="mt-3 text-ink-muted md:text-lg">Багшийн бэлтгэсэн богино видео хичээлүүдийг үзээрэй. Тайлбарыг нь номын хэлбэрээр унших боломжтой.</p>
      </div>

      <nav aria-label="Хичээлийн жагсаалтын шүүлтүүр" className="flex flex-wrap gap-3">
        <ButtonLink href="/videos" size="sm" variant={savedOnly ? "secondary" : "primary"} aria-current={!savedOnly ? "page" : undefined}>Бүгд · {videos.length}</ButtonLink>
        <ButtonLink href="/videos?saved=1" size="sm" variant={savedOnly ? "primary" : "secondary"} aria-current={savedOnly ? "page" : undefined}>Хадгалсан · {savedVideos.length}</ButtonLink>
      </nav>

      {visible.length === 0 ? (
        <section className="glass-panel rounded-panel border border-line bg-white p-6 text-center shadow-card">
          <h2 className="text-xl font-bold">{savedOnly ? "Хадгалсан хичээл алга" : "Одоогоор видео алга"}</h2>
          <p className="mt-1 text-ink-muted">{savedOnly ? "Хичээлийн хадгалах товчийг дарахад энэ жагсаалтад нэмэгдэнэ. Зөвхөн таны ангид нийтлэгдсэн хичээлүүд харагдана." : "Багшийн нийтэлсэн видео хичээлүүд энд харагдана."}</p>
          <ButtonLink href={savedOnly ? "/videos" : "/"} variant="secondary" size="sm" className="mt-4">
            {savedOnly ? "Бүх хичээл" : "Нүүр хуудас"}
          </ButtonLink>
        </section>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((v) => (
            <li key={v.id} className="relative">
              <Link
                href={`/videos/${v.id}`}
                className="glass-panel flex h-full items-center gap-4 rounded-panel border border-line bg-white p-4 pr-18 text-ink no-underline shadow-card hover:text-ink hover:ring-2 hover:ring-primary"
              >
                <span aria-hidden="true" className="flex h-20 w-12 shrink-0 items-center justify-center rounded-tile bg-linear-to-b from-primary to-primary-dark text-white">
                  <PixelIcon name="play" className="size-6" />
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
              <div className="absolute top-3 right-3"><VideoBookmarkButton videoId={v.id} saved={bookmarked.has(v.id)} compact /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
