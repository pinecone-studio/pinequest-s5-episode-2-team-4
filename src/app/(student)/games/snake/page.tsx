import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { SnakeGame } from "./SnakeGame";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

export const metadata: Metadata = {
  title: "Мэдлэгийн могой · LevelUp",
};

export default function SnakePage({ searchParams }: PageProps<"/games/snake">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <SnakeLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SnakeLoader({ searchParams }: Pick<PageProps<"/games/snake">, "searchParams">) {
  const [round] = await Promise.all([loadGameRound(searchParams, "snake")]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh session.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <SnakeGame key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />
    </AssignmentProvider>
  );
}
