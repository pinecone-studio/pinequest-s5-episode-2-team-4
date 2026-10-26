import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getAnonQuestions,
  getCurrentPet,
  getLastRetest,
  getLesson,
  getPeerQuestions,
  getProgress,
  getSolvedPractice,
  getSubtopics,
  getTestResult,
  getTopics,
} from "@/lib/data";
import { ExplanationSection } from "./ExplanationSection";
import { HelpClassmates } from "./HelpClassmates";
import { LessonSection } from "./LessonSection";
import { PracticeSection } from "./PracticeSection";
import { QuestionPanel } from "./QuestionPanel";
import { ResultsSection } from "./ResultsSection";
import { RetestCard } from "./RetestCard";
import { SignalCheck } from "./SignalCheck";

export const metadata: Metadata = {
  title: "Үр дүн ба хичээл — LevelUp",
};

export async function generateStaticParams() {
  const topics = await getTopics();
  return topics.map((t) => ({ topic: t.id }));
}

export default async function LessonPage({
  params,
  searchParams,
}: PageProps<"/lesson/[topic]">) {
  const [{ topic }, query] = await Promise.all([params, searchParams]);
  const [result, progress, subtopics, pet, solvedIds, lastRetest] =
    await Promise.all([
      getTestResult(),
      getProgress(),
      getSubtopics(topic),
      getCurrentPet(),
      getSolvedPractice(),
      getLastRetest(),
    ]);
  // No result yet: lessons are picked from the test, so take it first.
  if (!result) redirect("/test");
  if (result.topicId !== topic) notFound();

  // ?sub= picks the lesson; otherwise the weakest subtopic not mastered yet,
  // in the results' weakest-first order.
  const status = new Map(progress.map((p) => [p.subtopicId, p.status]));
  const sub = typeof query.sub === "string" ? query.sub : undefined;
  const selectedId =
    result.subtopics.find((s) => s.subtopicId === sub)?.subtopicId ??
    result.subtopics.find((s) => status.get(s.subtopicId) !== "mastered")?.subtopicId ??
    result.subtopics[0].subtopicId;

  const titles = new Map(subtopics.map((s) => [s.id, s.title]));
  const scores = result.subtopics.map((s) => ({
    ...s,
    status: status.get(s.subtopicId) ?? s.status,
    title: titles.get(s.subtopicId) ?? s.subtopicId,
    href: `/lesson/${topic}?sub=${s.subtopicId}`,
    selected: s.subtopicId === selectedId,
  }));

  const [lesson, questions, peerQuestions] = await Promise.all([
    getLesson(selectedId),
    getAnonQuestions(selectedId),
    getPeerQuestions(),
  ]);
  const failedRetest =
    query.retest === "failed" &&
    lastRetest?.subtopicId === selectedId &&
    !lastRetest.passed
      ? lastRetest
      : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 md:px-[clamp(16px,4vw,40px)]">
      <ResultsSection result={result} subtopics={scores} petStage={pet?.stage} />
      {failedRetest ? (
        <p
          role="status"
          className="mt-4 rounded-card border-2 border-magenta bg-pink px-5 py-4 font-bold md:mt-6"
        >
          Шалгалт: {failedRetest.correct}/{failedRetest.total}. Эзэмшихэд{" "}
          {failedRetest.total - 1} зөв хэрэгтэй. Дасгалаа давтаад дахин оролдоорой.
        </p>
      ) : null}
      {lesson ? (
        <LessonSection
          lesson={lesson}
          helper={
            <QuestionPanel key={lesson.subtopicId} questions={questions} />
          }
          footer={
            <RetestCard
              href={`/test/retest/${lesson.subtopicId}`}
              petStage={pet?.stage}
            />
          }
        >
          {/* key: a different lesson starts with fresh practice state */}
          <ExplanationSection lesson={lesson} />
          <SignalCheck key={`signal-${lesson.subtopicId}`} />
          <PracticeSection
            key={lesson.subtopicId}
            questions={lesson.practice}
            solvedIds={solvedIds}
          />
          <HelpClassmates
            key={`help-${lesson.subtopicId}`}
            questions={peerQuestions.filter((q) => q.subtopicId === selectedId)}
          />
        </LessonSection>
      ) : (
        <p className="mt-6 rounded-panel bg-surface px-6 py-8 text-center text-lg font-bold md:mt-14">
          {titles.get(selectedId) ?? "Энэ сэдэв"}-ийн хичээл удахгүй нэмэгдэнэ.
        </p>
      )}
    </div>
  );
}
