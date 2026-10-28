import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookView } from "@/components/BookView";
import { ButtonLink } from "@/components/ui";
import { getTeacherVideo } from "@/lib/data";
import { ReelLab } from "./ReelLab";

export const metadata: Metadata = {
  title: "Хичээлийн видео засах · LevelUp",
};

export default async function VideoPage({ params }: PageProps<"/teacher/videos/[id]">) {
  const { id } = await params;
  const video = await getTeacherVideo(id);
  if (!video) notFound();

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <Link href="/teacher/videos" className="w-fit font-bold">
        ← Хичээлийн видео
      </Link>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="type-page-title">{video.script.title}</h1>
        {video.materialId && (
          <ButtonLink href={`/teacher/assignments/new?video=${video.id}`} variant="secondary" size="sm" className="shrink-0 self-start md:self-auto">
            🎮 Энэ видеоноос даалгавар үүсгэх
          </ButtonLink>
        )}
      </div>
      {/* Remount after a save so the editor starts from what was stored. */}
      <ReelLab key={video.updatedAt} video={video} />
      {video.book && (
        <details className="group">
          <summary className="min-h-11 cursor-pointer py-2 text-lg font-bold">Номын хэлбэрээр (сурагчид харагдана)</summary>
          <BookView book={video.book} title={video.script.title} />
        </details>
      )}
    </div>
  );
}
