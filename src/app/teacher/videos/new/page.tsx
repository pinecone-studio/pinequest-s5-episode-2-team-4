import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, getCurriculum, getTeacherClassOptions } from "@/lib/data";
import { NewVideoFlow } from "./NewVideoFlow";

export const metadata: Metadata = {
  title: "Шинэ хичээлийн видео · LevelUp",
};

export default async function NewVideoPage() {
  const [curriculum, classes, user] = await Promise.all([getCurriculum(), getTeacherClassOptions(), getCurrentUser()]);
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <Link href="/teacher/videos" className="w-fit font-bold">
        ← Хичээлийн видео
      </Link>
      <h1 className="type-page-title">Шинэ хичээлийн видео</h1>
      <NewVideoFlow curriculum={curriculum} classes={classes} teacherSubject={user?.subject} />
    </div>
  );
}
