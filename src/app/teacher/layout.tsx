import { LandscapeBackdrop } from "@/components/layout/LandscapeBackdrop";
import { PageTransition } from "@/components/layout/PageTransition";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getActiveClass } from "@/lib/data";
import { TeacherHeader } from "./TeacherHeader";
import { TeacherDock } from "./TeacherNav";
import "./teacher.css";

export default async function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  await requireTeacher();
  // Every teacher page is about one class: pick it first.
  if (!(await getActiveClass())) redirect("/classes");

  return (
    <>
      <LandscapeBackdrop />
      <TeacherHeader />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <div className="mt-10 md:mt-16">
        <SiteFooter />
      </div>
      <TeacherDock />
    </>
  );
}
