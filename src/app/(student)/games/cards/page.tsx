import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { getCurrentPet } from "@/lib/data";
import { CardBattle } from "./CardBattle";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

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
  const [round, pet] = await Promise.all([loadGameRound(searchParams, "cards"), getCurrentPet()]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh battle.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <CardBattle key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} petSprite={pet?.stage.sprite} />
    </AssignmentProvider>
  );
}
