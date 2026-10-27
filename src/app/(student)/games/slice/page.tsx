import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { getGameQuestions, getGameSubjects } from "@/lib/data";
import { SliceGame } from "./SliceGame";

export const metadata: Metadata = {
  title: "Мэдлэгийн зүсэлт · LevelUp",
};

export default function SlicePage({ searchParams }: PageProps<"/games/slice">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <SliceLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SliceLoader({ searchParams }: Pick<PageProps<"/games/slice">, "searchParams">) {
  const [{ subject }, subjects] = await Promise.all([searchParams, getGameSubjects()]);
  const subjectId = typeof subject === "string" ? subject : subjects[0].id;
  const questions = await getGameQuestions(subjectId);
  if (!questions?.length) notFound();
  // Keyed by subject so switching subjects starts a fresh session.
  return <SliceGame key={subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />;
}
