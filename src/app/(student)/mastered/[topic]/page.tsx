import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getMasteryResult,
  getPetLine,
  getSubtopic,
  getSubtopics,
  getTopic,
  getTopics,
} from "@/lib/data";
import { petStage } from "@/lib/pets";
import { Celebration } from "./Celebration";
import { PetProgressCard } from "./PetProgressCard";
import { TopicProgressCard } from "./TopicProgressCard";

export const metadata: Metadata = {
  title: "Эзэмшсэн · LevelUp",
};

export async function generateStaticParams() {
  const topics = await getTopics();
  return topics.flatMap((t) => t.subtopicIds.map((topic) => ({ topic })));
}

export default async function MasteredPage({
  params,
}: PageProps<"/mastered/[topic]">) {
  const { topic } = await params;
  const [result, subtopic] = await Promise.all([
    getMasteryResult(topic),
    getSubtopic(topic),
  ]);
  if (!result || !subtopic) notFound();

  const [parentTopic, subtopics, line] = await Promise.all([
    getTopic(subtopic.topicId),
    getSubtopics(subtopic.topicId),
    getPetLine(result.pet.lineId),
  ]);

  const statusById = new Map(result.progress.map((p) => [p.subtopicId, p.status]));
  const items = subtopics.flatMap((s) => {
    const status = statusById.get(s.id);
    return status ? [{ id: s.id, title: s.title, status }] : [];
  });
  // Next lesson: the weakest subtopic that is not mastered yet.
  const next =
    items.find((i) => i.status === "weak") ??
    items.find((i) => i.status === "learning" || i.status === "good");
  const { nextEvolutionLevel } = result.pet;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 md:flex-row md:flex-wrap md:items-start md:gap-7 md:px-[clamp(16px,4vw,40px)] md:pt-4">
      <Celebration
        score={result.score}
        pet={result.pet}
        heading={subtopic.lessonTitle}
        nextHref={next ? `/lesson/${next.id}` : "/"}
      />
      <aside
        aria-label="Миний явц"
        className="flex min-w-0 flex-col gap-4 md:flex-[1_1_320px] md:gap-5"
      >
        <PetProgressCard
          pet={result.pet}
          nextStage={
            line && nextEvolutionLevel
              ? petStage(line, nextEvolutionLevel)
              : undefined
          }
        />
        <TopicProgressCard title={parentTopic?.title ?? ""} items={items} />
      </aside>
    </div>
  );
}
