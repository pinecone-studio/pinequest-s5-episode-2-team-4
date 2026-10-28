import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { FlightGame } from "./FlightGame";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

export const metadata: Metadata = {
  title: "Мэдлэгийн нислэг · LevelUp",
};

export default function FlightPage({ searchParams }: PageProps<"/games/flight">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <FlightLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FlightLoader({ searchParams }: Pick<PageProps<"/games/flight">, "searchParams">) {
  const [round] = await Promise.all([loadGameRound(searchParams, "flight")]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh session.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <FlightGame key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />
    </AssignmentProvider>
  );
}
