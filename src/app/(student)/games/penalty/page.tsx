import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { getGameQuestions, getGameSubjects } from "@/lib/data";
import { Shootout } from "./Shootout";

export const metadata: Metadata = {
  title: "Пенальти · LevelUp",
};

export default function PenaltyPage({ searchParams }: PageProps<"/games/penalty">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <PenaltyLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PenaltyLoader({ searchParams }: Pick<PageProps<"/games/penalty">, "searchParams">) {
  const [{ subject }, subjects] = await Promise.all([searchParams, getGameSubjects()]);
  const subjectId = typeof subject === "string" ? subject : subjects[0].id;
  const questions = await getGameQuestions(subjectId);
  if (!questions?.length) notFound();
  // Keyed by subject so switching subjects starts a fresh game.
  return <Shootout key={subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />;
}
