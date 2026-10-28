import { SiteFooter } from "@/components/layout/SiteFooter";
import { requireTeacher } from "@/lib/auth";
import { TeacherHeader } from "./TeacherHeader";
import { TeacherNav } from "./TeacherNav";
import "./teacher.css";

export default async function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  await requireTeacher();

  return (
    <>
      <TeacherHeader />
      <TeacherNav />
      <main className="flex-1">{children}</main>
      <div className="mt-10 md:mt-16">
        <SiteFooter />
      </div>
    </>
  );
}
