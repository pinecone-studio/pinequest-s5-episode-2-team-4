import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCurrentPet,
  getLesson,
  getSubtopics,
  getTestResult,
  getTopics,
} from "@/lib/data";
import { ExplanationSection } from "./ExplanationSection";
import { ResultsSection } from "./ResultsSection";

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
  const [result, subtopics, pet] = await Promise.all([
    getTestResult(),
    getSubtopics(topic),
    getCurrentPet(),
  ]);
  if (result.topicId !== topic) notFound();

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
      {lesson ? <ExplanationSection lesson={lesson} /> : null}
      {/* Practice (#23) and AI helper (#24) go below. */}
    </div>
  );
}
