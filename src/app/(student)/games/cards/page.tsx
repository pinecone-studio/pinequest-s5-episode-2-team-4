import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { getCurrentPet, getGameQuestions, getGameSubjects } from "@/lib/data";
import { CardBattle } from "./CardBattle";

export const metadata: Metadata = {
  title: "Картын тулаан · LevelUp",
};

export default function CardsPage({ searchParams }: PageProps<"/games/cards">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <CardsLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CardsLoader({ searchParams }: Pick<PageProps<"/games/cards">, "searchParams">) {
  const [{ subject }, subjects, pet] = await Promise.all([searchParams, getGameSubjects(), getCurrentPet()]);
  const subjectId = typeof subject === "string" ? subject : subjects[0].id;
  const questions = await getGameQuestions(subjectId);
  if (!questions?.length) notFound();
  // Keyed by subject so switching subjects starts a fresh battle.
  return <CardBattle key={subjectId} subjects={subjects} subjectId={subjectId} questions={questions} petSprite={pet?.stage.sprite} />;
}
