import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getTeacherVideos } from "@/lib/data";
import { formatDay } from "../_content/format";
import { VIDEO_STATUS } from "../_content/ui";
import { classLabel } from "@/lib/class-label";

export const metadata: Metadata = {
  title: "Хичээлийн видео · LevelUp",
};

/** The teacher's lesson reels, newest first. */
export default async function VideosPage() {
  const videos = await getTeacherVideos();

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="type-page-title">Хичээлийн видео</h1>
          <p className="mt-3 max-w-160 text-ink-muted md:text-lg">
            Номын хуудас, тэмдэглэлээсээ 1 минутын босоо видео бэлдэнэ. Та зөвшөөрч нийтэлсэн видеог л сурагчид харна.
          </p>
        </div>
        <ButtonLink href="/teacher/videos/new" className="self-start md:self-auto">
          + Шинэ видео
        </ButtonLink>
      </div>

      {videos.length === 0 ? (
        <Card className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-bold">Видео алга</h2>
          <p className="text-ink-muted">Номын хуудасны зураг эсвэл текстээ оруулаад эхлээрэй.</p>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <li key={v.id}>
              <Link
                href={`/teacher/videos/${v.id}`}
                className="flex h-full flex-col gap-2 rounded-card bg-white p-4 text-ink no-underline shadow-card hover:text-ink hover:ring-2 hover:ring-primary md:p-5"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold">{classLabel(v.classCode)}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", VIDEO_STATUS[v.status].className)}>
                    {VIDEO_STATUS[v.status].label}
                  </span>
                </span>
                <span className="text-lg leading-snug font-bold">{v.title}</span>
                <span className="text-sm text-ink-muted">
                  {v.script.sections.length} хэсэг · {formatDay(v.publishedAt ?? v.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
