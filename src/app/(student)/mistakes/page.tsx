import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { notebookItem, notebookRecords } from "@/lib/mistakes";
import { readSession } from "@/lib/session";
import { MistakeNotebook } from "./MistakeNotebook";

export const metadata: Metadata = { title: "Алдааны дэвтэр · LevelUp" };

export default async function MistakesPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "student") redirect("/teacher");
  const records = await notebookRecords(session);
  const items = Object.values(records).flatMap((record) => {
    const item = notebookItem(record);
    return item ? [item] : [];
  });
  return <MistakeNotebook items={items} />;
}
