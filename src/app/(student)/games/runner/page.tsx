import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { LaneRunner } from "./LaneRunner";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

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
  const [round] = await Promise.all([loadGameRound(searchParams, "runner")]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh game.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <LaneRunner key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />
    </AssignmentProvider>
  );
}
