import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { getInviteClass } from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";
import { JoinButton } from "./JoinButton";

export const metadata: Metadata = {
  title: "Ангид нэгдэх · LevelUp",
};

/** Opened from the QR a teacher shows in class; joining takes a tap, never just a visit. */
export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;
  const found = await getInviteClass(token);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 pt-10 pb-16 text-center md:pt-16">
      {found ? (
        <>
          <p className="text-sm font-bold text-ink-muted">Таныг ангид урьж байна</p>
          <h1 className="mt-2 type-page-title">{found.name} анги</h1>
          <p className="mt-3 text-lg font-semibold text-ink-muted">
            {subjectTitle(found.subject)}
            {found.teacherName ? ` · Багш: ${found.teacherName}` : ""}
          </p>
          <JoinButton token={token} />
        </>
      ) : (
        <>
          <h1 className="type-page-title">Урилга хүчингүй байна</h1>
          <p className="mt-3 text-base font-semibold text-ink-muted">
            QR зөвхөн багшийн дэлгэц дээр харагдаж байх үед ажилладаг. Багшаасаа дахин харуулахыг хүсээрэй.
          </p>
          <ButtonLink href="/" variant="secondary" className="mt-8">
            Нүүр хуудас
          </ButtonLink>
        </>
      )}
    </div>
  );
}
