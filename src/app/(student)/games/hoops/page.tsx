import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { Hoops } from "./Hoops";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

export const metadata: Metadata = {
  title: "Сагсан бөмбөг · LevelUp",
};

export default function HoopsPage({ searchParams }: PageProps<"/games/hoops">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <HoopsLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function HoopsLoader({ searchParams }: Pick<PageProps<"/games/hoops">, "searchParams">) {
  const [round] = await Promise.all([loadGameRound(searchParams, "hoops")]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh game.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <Hoops key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />
    </AssignmentProvider>
  );
}
