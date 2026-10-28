import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { Shootout } from "./Shootout";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

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
  const [round] = await Promise.all([loadGameRound(searchParams, "penalty")]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh game.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <Shootout key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />
    </AssignmentProvider>
  );
}
