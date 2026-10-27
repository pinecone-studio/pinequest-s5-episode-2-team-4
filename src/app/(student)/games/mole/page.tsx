import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { getGameQuestions, getGameSubjects } from "@/lib/data";
import { WhackAMole } from "./WhackAMole";

export const metadata: Metadata = {
  title: "Мэнгэ цохих · LevelUp",
};

export default function MolePage({ searchParams }: PageProps<"/games/mole">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <MoleLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MoleLoader({ searchParams }: Pick<PageProps<"/games/mole">, "searchParams">) {
  const [{ subject }, subjects] = await Promise.all([searchParams, getGameSubjects()]);
  const subjectId = typeof subject === "string" ? subject : subjects[0].id;
  const questions = await getGameQuestions(subjectId);
  if (!questions?.length) notFound();
  // Keyed by subject so switching subjects starts a fresh game.
  return <WhackAMole key={subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />;
}
