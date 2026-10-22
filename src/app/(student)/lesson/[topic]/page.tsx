import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLesson } from "@/lib/data";
import { ExplanationSection } from "./ExplanationSection";
import { ResultsSection } from "./ResultsSection";
import { getLessonResult, getLessonTopicIds } from "./results";

export const metadata: Metadata = {
  title: "Үр дүн ба хичээл — LevelUp",
};

export function generateStaticParams() {
  return getLessonTopicIds().map((topic) => ({ topic }));
}

export default async function LessonPage({
  params,
}: PageProps<"/lesson/[topic]">) {
  const { topic } = await params;
  const result = await getLessonResult(topic);
  if (!result) notFound();

  // The lesson is for the weakest subtopic, which the results list first.
  const lesson = await getLesson(result.subtopics[0].subtopicId);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 md:px-[clamp(16px,4vw,40px)]">
      <ResultsSection result={result} />
      {lesson ? <ExplanationSection lesson={lesson} /> : null}
      {/* Practice (#23) and AI helper (#24) go below. */}
    </div>
  );
}
