import type { Metadata } from "next";
import Link from "next/link";
import {
  getCurrentUser,
  getCurriculum,
  getSubtopics,
  getTeacherClassOptions,
  getTeacherMaterial,
  getTeacherVideo,
} from "@/lib/data";
import { AssignmentEditor } from "../AssignmentEditor";

export const metadata: Metadata = {
  title: "Шинэ даалгавар · LevelUp",
};

/** `?video=<id>`: questions from that lesson video's material. */
export default async function NewAssignmentPage({ searchParams }: PageProps<"/teacher/assignments/new">) {
  const { video: videoId } = await searchParams;
  const [curriculum, classes, subtopics, user, video] = await Promise.all([
    getCurriculum(),
    getTeacherClassOptions(),
    getSubtopics("fractions"),
    getCurrentUser(),
    typeof videoId === "string" ? getTeacherVideo(videoId) : undefined,
  ]);
  const material = video?.materialId ? await getTeacherMaterial(video.materialId) : undefined;
  const fromVideo =
    video && material
      ? {
          videoTitle: video.script.title,
          materialId: material.id,
          topic: material.recognition?.topic || material.topicTitle,
          classCode: video.classCode,
        }
      : undefined;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <Link href="/teacher/assignments" className="w-fit font-bold">
        ← Даалгаврууд
      </Link>
      <h1 className="type-page-title">Шинэ даалгавар</h1>
      <AssignmentEditor
        curriculum={curriculum}
        classes={classes}
        subtopics={subtopics}
        teacherSubject={user?.subject}
        fromVideo={fromVideo}
      />
    </div>
  );
}
