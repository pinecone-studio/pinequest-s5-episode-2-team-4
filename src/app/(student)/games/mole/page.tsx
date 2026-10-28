import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { WhackAMole } from "./WhackAMole";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

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
  const [round] = await Promise.all([loadGameRound(searchParams, "mole")]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh game.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <WhackAMole key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />
    </AssignmentProvider>
  );
}
