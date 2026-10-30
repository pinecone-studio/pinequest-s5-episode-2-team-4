import type { Metadata } from "next";
import { getActiveClass, getClassMembers } from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";
import { AddStudentForm } from "./AddStudentForm";
import { LiveJoinQr } from "../LiveJoinQr";
import { InviteQr } from "./InviteQr";
import { MemberList } from "./MemberList";

export const metadata: Metadata = {
  title: "Сурагчид · LevelUp",
};

/** The current class's students, and the ways to add more: email, phone or a QR shown in class. */
export default async function StudentsPage() {
  const [active, members] = await Promise.all([getActiveClass(), getClassMembers()]);
  const demo = active?.id === "demo";

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-[clamp(16px,4vw,40px)]">
      <h1 className="type-page-title">Сурагчид</h1>
      <p className="mt-2 text-base font-semibold text-ink-muted">
        {active?.name} анги · {active && subjectTitle(active.subject)} · {demo ? active?.studentCount : members.length} сурагч
      </p>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="members-title" className="rounded-panel bg-card p-5 shadow-card md:p-7">
          <h2 id="members-title" className="type-section-title">
            Ангийн сурагчид
          </h2>
          {demo ? (
            <p className="mt-4 text-sm font-semibold text-ink-muted">
              Демо горимд жинхэнэ сурагчийн жагсаалт харагдахгүй.
            </p>
          ) : (
            <MemberList members={members} />
          )}
        </section>

        <section aria-labelledby="add-title" className="flex flex-col gap-5 rounded-panel bg-card p-5 shadow-card md:p-7">
          <h2 id="add-title" className="type-section-title">
            Сурагч нэмэх
          </h2>
          <AddStudentForm disabled={demo} />
          <p className="flex items-center gap-3 text-sm font-semibold text-ink-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
            эсвэл
          </p>
          <InviteQr classTitle={active?.name ?? ""} disabled={demo} />
          {demo && <p className="text-sm font-semibold text-ink-muted">Демо горимд сурагч нэмэх боломжгүй.</p>}
        </section>
        {/* Without an account: just a name (e.g. judges at a pitch). */}
        {!demo && <LiveJoinQr className="lg:col-start-2" />}
      </div>
    </div>
  );
}
