import { SiteFooter } from "@/components/layout/SiteFooter";
import { TeacherHeader } from "./TeacherHeader";
import "./teacher.css";

export default function TeacherLayout({ children }: LayoutProps<"/teacher">) {
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
