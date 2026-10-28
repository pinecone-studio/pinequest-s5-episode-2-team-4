import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { HorseRace } from "./HorseRace";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

export const metadata: Metadata = {
  title: "Морин уралдаан · LevelUp",
};

export default function RacePage({ searchParams }: PageProps<"/games/race">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <RaceLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RaceLoader({ searchParams }: Pick<PageProps<"/games/race">, "searchParams">) {
  const [round] = await Promise.all([loadGameRound(searchParams, "race")]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh race.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <HorseRace key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />
    </AssignmentProvider>
  );
}
