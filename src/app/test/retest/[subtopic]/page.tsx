import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { submitRetest } from "@/lib/actions";
import {
  getCurrentPet,
  getRetestQuestions,
  getSubtopic,
  getTestResult,
} from "@/lib/data";
import { DiagnosticTest } from "../../DiagnosticTest";

export const metadata: Metadata = {
  title: "Дахин шалгалт — LevelUp",
};

/** The short retest that masters one subtopic. */
export default async function RetestPage({
  params,
}: PageProps<"/test/retest/[subtopic]">) {
  const { subtopic: subtopicId } = await params;
  const [subtopic, questions, result, pet] = await Promise.all([
    getSubtopic(subtopicId),
    getRetestQuestions(subtopicId),
    getTestResult(),
    getCurrentPet(),
  ]);
  if (!subtopic || questions.length === 0) notFound();
  if (!result) redirect("/test");

  const lessonHref = `/lesson/${subtopic.topicId}?sub=${subtopic.id}`;

  return (
    <>
      <p className="mx-auto max-w-240 px-4 pt-4 text-center text-sm font-bold text-ink-muted md:px-[clamp(16px,4vw,40px)] md:pt-6 md:text-base">
        Дахин шалгалт · {subtopic.lessonTitle} · {questions.length - 1}/
        {questions.length} зөв бол эзэмшинэ
      </p>
      {/* submitRetest redirects to the mastered page or back to the lesson. */}
      <DiagnosticTest
        questions={questions}
        petStage={pet?.stage}
        submit={submitRetest.bind(null, subtopic.id)}
        exitHref={lessonHref}
      />
    </>
  );
}
