import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, getCurriculum, getSubtopics, getTeacherClassCodes } from "@/lib/data";
import { AssignmentEditor } from "../AssignmentEditor";

export const metadata: Metadata = {
  title: "Шинэ даалгавар · LevelUp",
};

export default async function NewAssignmentPage() {
  const [curriculum, classCodes, subtopics, user] = await Promise.all([
    getCurriculum(),
    getTeacherClassCodes(),
    getSubtopics("fractions"),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <Link href="/teacher/assignments" className="w-fit font-bold">
        ← Даалгаврууд
      </Link>
      <h1 className="type-page-title">Шинэ даалгавар</h1>
      <AssignmentEditor curriculum={curriculum} classCodes={classCodes} subtopics={subtopics} teacherSubject={user?.subject} />
    </div>
  );
}
