import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCurrentPet,
  getHelperConversation,
  getLesson,
  getSubtopics,
  getTestResult,
  getTopics,
} from "@/lib/data";
import { ExplanationSection } from "./ExplanationSection";
import { HelperPanel } from "./HelperPanel";
import { LessonSection } from "./LessonSection";
import { PracticeSection } from "./PracticeSection";
import { ResultsSection } from "./ResultsSection";
import { RetestCard } from "./RetestCard";

export const metadata: Metadata = {
  title: "Үр дүн ба хичээл — LevelUp",
};

export async function generateStaticParams() {
  const topics = await getTopics();
  return topics.map((t) => ({ topic: t.id }));
}

export default async function LessonPage({
  params,
}: PageProps<"/lesson/[topic]">) {
  const { topic } = await params;
  const [result, subtopics, pet, helper] = await Promise.all([
    getTestResult(),
    getSubtopics(topic),
    getCurrentPet(),
    getHelperConversation(),
  ]);
  // TODO(#60): send users who haven't taken the test to /test.
  if (!result || result.topicId !== topic) notFound();

  const titles = new Map(subtopics.map((s) => [s.id, s.title]));
  const scores = result.subtopics.map((s) => ({
    ...s,
    title: titles.get(s.subtopicId) ?? s.subtopicId,
  }));

  // The lesson is for the weakest subtopic, which the results list first.
  const lesson = await getLesson(result.subtopics[0].subtopicId);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 md:px-[clamp(16px,4vw,40px)]">
      <ResultsSection result={result} subtopics={scores} petStage={pet?.stage} />
      {lesson ? (
        <LessonSection
          lesson={lesson}
          helper={
            <HelperPanel
              initialMessages={helper.messages}
              suggestions={helper.suggestions}
            />
          }
          footer={
            <RetestCard
              href={`/mastered/${lesson.subtopicId}`}
              petStage={pet?.stage}
            />
          }
        >
          <ExplanationSection lesson={lesson} />
          <PracticeSection questions={lesson.practice} />
        </LessonSection>
      ) : null}
    </div>
  );
}
