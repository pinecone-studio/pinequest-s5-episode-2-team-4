import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { SliceGame } from "./SliceGame";
import { AssignmentProvider } from "../_components/AssignmentContext";
import { loadGameRound } from "../_lib/load";

export const metadata: Metadata = {
  title: "Мэдлэгийн зүсэлт · LevelUp",
};

export default function SlicePage({ searchParams }: PageProps<"/games/slice">) {
  return (
    <div className="px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      {/* The subject comes from the URL, so it is read behind Suspense. */}
      <Suspense fallback={<PageLoading />}>
        <SliceLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SliceLoader({ searchParams }: Pick<PageProps<"/games/slice">, "searchParams">) {
  const [round] = await Promise.all([loadGameRound(searchParams, "slice")]);
  const { subjects, subjectId, questions } = round;
  // Keyed by subject so switching subjects starts a fresh session.
  return (
    <AssignmentProvider assignment={round.assignment}>
      <SliceGame key={round.assignment?.id ?? subjectId} subjects={subjects} subjectId={subjectId} questions={questions} />
    </AssignmentProvider>
  );
}
