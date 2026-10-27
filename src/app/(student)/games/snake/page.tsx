import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { getGameQuestions, getGameSubjects } from "@/lib/data";
import { SnakeGame } from "./SnakeGame";

export const metadata: Metadata = {
  title: "Мэдлэгийн могой · LevelUp",
};

export default function SnakePage({ searchParams }: PageProps<"/games/snake">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <SnakeLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SnakeLoader({ searchParams }: Pick<PageProps<"/games/snake">, "searchParams">) {
  const [{ subject }, subjects] = await Promise.all([searchParams, getGameSubjects()]);
  const subjectId = typeof subject === "string" ? subject : subjects[0].id;
  const questions = await getGameQuestions(subjectId);
  if (!questions?.length) notFound();
  // Keyed by subject so switching subjects starts a fresh session.
  return <SnakeGame key={subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />;
}
