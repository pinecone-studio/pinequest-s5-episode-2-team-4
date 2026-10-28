import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { TugOfWar } from "./TugOfWar";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

export const metadata: Metadata = {
  title: "Олс таталт · LevelUp",
};

export default function TugPage({ searchParams }: PageProps<"/games/tug">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <TugLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TugLoader({ searchParams }: Pick<PageProps<"/games/tug">, "searchParams">) {
  const [round] = await Promise.all([loadGameRound(searchParams, "tug")]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh game.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <TugOfWar key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />
    </AssignmentProvider>
  );
}
