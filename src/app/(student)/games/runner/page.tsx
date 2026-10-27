import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { getGameQuestions, getGameSubjects } from "@/lib/data";
import { LaneRunner } from "./LaneRunner";

export const metadata: Metadata = {
  title: "Боссын зам · LevelUp",
};

export default function RunnerPage({ searchParams }: PageProps<"/games/runner">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <RunnerLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RunnerLoader({ searchParams }: Pick<PageProps<"/games/runner">, "searchParams">) {
  const [{ subject }, subjects] = await Promise.all([searchParams, getGameSubjects()]);
  const subjectId = typeof subject === "string" ? subject : subjects[0].id;
  const questions = await getGameQuestions(subjectId);
  if (!questions?.length) notFound();
  // Keyed by subject so switching subjects starts a fresh game.
  return <LaneRunner key={subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />;
}
