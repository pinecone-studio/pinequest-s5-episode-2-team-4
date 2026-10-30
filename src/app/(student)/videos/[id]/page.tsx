import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookmarkedVideoIds, getClassVideo } from "@/lib/data";
import { VideoBookmarkButton } from "@/components/VideoBookmarkButton";
import { MarkSeen } from "./MarkSeen";
import { VideoTabs } from "./VideoTabs";

export const metadata: Metadata = {
  title: "Хичээлийн видео · LevelUp",
};

export default async function StudentVideoPage({ params }: PageProps<"/videos/[id]">) {
  const { id } = await params;
  const [video, bookmarks] = await Promise.all([getClassVideo(id), getBookmarkedVideoIds()]);
  if (!video) notFound();

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 py-6 md:gap-6 md:py-10">
      <Link href="/videos" className="w-fit font-bold">
        ← Бүх видео
      </Link>
      <h1 className="type-page-title">{video.script.title}</h1>
      <VideoBookmarkButton videoId={video.id} saved={bookmarks.includes(video.id)} />
      <VideoTabs video={video} />
      <MarkSeen videoId={video.id} />
    </div>
  );
}
