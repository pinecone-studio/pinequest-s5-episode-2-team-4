import type { Metadata } from "next";
import { getInviteClass } from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";
import { NameJoinForm } from "./NameJoinForm";

export const metadata: Metadata = {
  title: "Ангид нэгдэх · LevelUp",
};

/**
 * Opened from the QR a teacher shows (e.g. to judges at a pitch): type your
 * name and you're in the class with an account of your own, no sign-up.
 */
export default async function NameJoinPage({ params }: PageProps<"/q/[token]">) {
  const { token } = await params;
  const found = await getInviteClass(token);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-4 pt-6 pb-16 text-center md:pt-12">
      {found ? (
        <>
          <p className="text-sm font-bold text-ink-muted">Таныг ангид урьж байна</p>
          <h1 className="mt-2 type-page-title">{found.name} анги</h1>
          <p className="mt-3 text-lg font-semibold text-ink-muted">
            {subjectTitle(found.subject)}
            {found.teacherName ? ` · Багш: ${found.teacherName}` : ""}
          </p>
          <NameJoinForm token={token} />
        </>
      ) : (
        <>
          <h1 className="type-page-title">QR-ын хугацаа дууссан</h1>
          <p className="mt-3 text-base font-semibold text-ink-muted">
            QR зөвхөн багшийн дэлгэц дээр харагдаж байх үед ажилладаг. Дэлгэц дээрх QR-ыг дахин уншуулаарай.
          </p>
        </>
      )}
    </div>
  );
}
