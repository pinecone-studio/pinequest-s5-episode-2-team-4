import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Celebration } from "./Celebration";
import { getMasteredResult, getSubtopicSlugs } from "./data";
import { PetProgressCard } from "./PetProgressCard";
import { TopicProgressCard } from "./TopicProgressCard";

export const metadata: Metadata = {
  title: "Эзэмшсэн · LevelUp",
};

export function generateStaticParams() {
  return getSubtopicSlugs().map((topic) => ({ topic }));
}

export default async function MasteredPage({
  params,
}: PageProps<"/mastered/[topic]">) {
  const { topic } = await params;
  const result = getMasteredResult(topic);
  if (!result) notFound();

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 md:flex-row md:flex-wrap md:items-start md:gap-7 md:px-[clamp(16px,4vw,40px)] md:pt-4">
      <Celebration result={result} />
      <aside
        aria-label="Миний явц"
        className="flex min-w-0 flex-col gap-4 md:flex-[1_1_320px] md:gap-5"
      >
        <PetProgressCard pet={result.pet} />
        <TopicProgressCard
          title={result.topicTitle}
          subtopics={result.subtopics}
        />
      </aside>
    </div>
  );
}
