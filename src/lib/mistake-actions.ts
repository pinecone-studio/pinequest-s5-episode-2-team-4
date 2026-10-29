"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkNotebookAnswer, notebookItem, notebookRecords } from "./mistakes";
import { recordMistake } from "./mistake-records";
import { readSession, writeSession } from "./session";
import { recordLearningDay } from "./streak";

export async function reviewMistake(id: string, answer: number | string) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "student") redirect("/teacher");
  if (typeof id !== "string" || id.length > 120 || (typeof answer !== "number" && typeof answer !== "string")) return { error: "Хариултаа шалгаад дахин оролдоорой." };
  const records = await notebookRecords(session);
  const record = records[id];
  if (!Object.hasOwn(records, id) || !record) return { error: "Энэ асуулт алдааны дэвтэрт алга." };
  const correct = checkNotebookAnswer(record, answer);
  if (correct === undefined) return { error: "Хариултаа сонгох эсвэл бичнэ үү." };
  const item = notebookItem(record);
  await writeSession({
    ...session,
    mistakes: recordMistake(records, record.source, record.questionId, answer, correct),
    streak: recordLearningDay(session.streak),
  });
  revalidatePath("/mistakes");
  return { correct, expected: item?.expected, explanation: item?.explanation };
}
