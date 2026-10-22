import { notFound } from "next/navigation";
import {
  getCurrentPet,
  getPetLines,
  getProgress,
  getSubtopics,
  getTopic,
} from "@/lib/data";
import { HomeHero } from "./_home/HomeHero";
import { TopicMap } from "./_home/TopicMap";

const TOPIC_ID = "fractions";
const ORBIT_PET_IDS = ["dollfin", "agnite", "anoleaf", "tweesher", "cardiling"];

export default async function HomePage() {
  const [topic, subtopics, progress, pet, petLines] = await Promise.all([
    getTopic(TOPIC_ID),
    getSubtopics(TOPIC_ID),
    getProgress(),
    getCurrentPet(),
    getPetLines(),
  ]);
  if (!topic || !pet) notFound();

  const nodes = subtopics.map((s) => ({
    ...s,
    status: progress.find((p) => p.subtopicId === s.id)?.status ?? "weak",
  }));
  const orbitPets = ORBIT_PET_IDS.flatMap((id) => {
    const line = petLines.find((l) => l.id === id);
    return line ? [line.stages[0]] : [];
  });

  return (
    // The animated background runs up under the transparent header.
    <div className="relative -mt-18 animate-flow overflow-hidden bg-flow pt-18 pb-16 md:-mt-22 md:pt-22">
      <div className="mx-auto max-w-7xl px-4 md:px-[clamp(16px,4vw,40px)]">
        <HomeHero pet={{ stage: pet.stage, level: pet.level }} orbitPets={orbitPets} />
        <TopicMap
          title={topic.title}
          href={`/lesson/${topic.id}`}
          nodes={nodes}
          pet={pet.stage}
        />
      </div>
    </div>
  );
}
