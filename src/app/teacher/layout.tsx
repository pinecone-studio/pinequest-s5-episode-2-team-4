import { SiteFooter } from "@/components/layout/SiteFooter";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getActiveClass } from "@/lib/data";
import { TeacherHeader } from "./TeacherHeader";
import "./teacher.css";

export default async function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  await requireTeacher();
  // Every teacher page is about one class: pick it first.
  if (!(await getActiveClass())) redirect("/classes");

  return (
    <>
      <TeacherHeader />
      <main className="flex-1">{children}</main>
      <div className="mt-10 md:mt-16">
        <SiteFooter />
      </div>
    </>
  );
}
