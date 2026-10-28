import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser, getCurriculum, getSubtopics, getTeacherAssignment, getTeacherClassOptions } from "@/lib/data";
import { AssignmentEditor } from "../../AssignmentEditor";

export const metadata: Metadata = {
  title: "Даалгавар засах · LevelUp",
};

export default async function EditAssignmentPage({ params }: PageProps<"/teacher/assignments/[id]/edit">) {
  const { id } = await params;
  const [found, curriculum, classes, subtopics, user] = await Promise.all([
    getTeacherAssignment(id),
    getCurriculum(),
    getTeacherClassOptions(),
    getSubtopics("fractions"),
    getCurrentUser(),
  ]);
  if (!found) notFound();

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-1 md:gap-6 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <Link href={`/teacher/assignments/${id}`} className="w-fit font-bold">
        ← Даалгавар
      </Link>
      <h1 className="type-page-title">Даалгавар засах</h1>
      <AssignmentEditor curriculum={curriculum} classes={classes} subtopics={subtopics} initial={found} teacherSubject={user?.subject} />
    </div>
  );
}
