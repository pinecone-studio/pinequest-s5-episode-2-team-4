import { notFound } from "next/navigation";
import {
  getCurrentPet,
  getCurrentUser,
  getStudentAssignments,
  getPetLines,
  getProgress,
  getRoadmap,
  getSubtopics,
  getTopic,
} from "@/lib/data";
import { subjectLabel } from "@/lib/school";
import { AssignmentCard } from "./_home/AssignmentCard";
import { HomeHero } from "./_home/HomeHero";
import { GameMap } from "./_home/GameMap";
import { buildMapStops, currentSubtopicId } from "./_home/mapStops";

const TOPIC_ID = "fractions";
const ORBIT_PET_IDS = ["dollfin", "agnite", "anoleaf", "tweesher", "cardiling"];

export default async function HomePage() {
  const [topic, subtopics, progress, pet, petLines, user, assignments, roadmap] = await Promise.all([
    getTopic(TOPIC_ID),
    getSubtopics(TOPIC_ID),
    getProgress(),
    getCurrentPet(),
    getPetLines(),
    getCurrentUser(),
    getStudentAssignments(),
    getRoadmap(),
  ]);
  if (!topic || !pet) notFound();

  // No progress means the diagnostic test hasn't been taken yet.
  const testTaken = progress.length > 0;
  const nodes = subtopics.map((s) => ({
    ...s,
    status: progress.find((p) => p.subtopicId === s.id)?.status ?? ("untested" as const),
    href: testTaken ? `/lesson/${topic.id}?sub=${s.id}` : "/test",
  }));
  // Before the test the button starts it; after, it opens the lesson the pet
  // stands on; with everything mastered it shows the year's map.
  const currentId = currentSubtopicId(nodes);
  const cta = !testTaken
    ? { href: "/test", label: "Тест эхлэх" }
    : currentId
      ? { href: `/lesson/${topic.id}?sub=${currentId}`, label: "Үргэлжлүүлэх" }
      : { href: "#map-title", label: "Жилийн зам" };
  const school = [
    `${user?.grade}-р анги`,
    subjectLabel(user?.subject),
    user?.classCode && `${user.classCode} анги`,
  ]
    .filter(Boolean)
    .join(" · ");
  const orbitPets = ORBIT_PET_IDS.flatMap((id) => {
    const line = petLines.find((l) => l.id === id);
    return line ? [line.stages[0]] : [];
  });

  return (
    // The animated background runs up under the transparent header.
    <div className="relative -mt-18 animate-flow overflow-hidden bg-flow pt-18 pb-16 md:-mt-22 md:pt-22">
      <div className="mx-auto max-w-7xl px-4 md:px-[clamp(16px,4vw,40px)]">
        <HomeHero
          pet={{ stage: pet.stage, level: pet.level }}
          cta={cta}
          school={school}
          orbitPets={orbitPets}
        />
        {assignments.map((a) => (
          <AssignmentCard
            key={a.id}
            id={a.id}
            subtopicTitle={subtopics.find((s) => s.id === a.subtopicId)?.lessonTitle ?? ""}
            questions={a.items.map((item) => item.question)}
            due={a.due}
          />
        ))}
        <GameMap
          title={`${user?.grade}-р анги · ${subjectLabel(user?.subject)}`}
          stops={buildMapStops(roadmap, nodes)}
          pet={pet.stage}
          wildPets={orbitPets}
        />
      </div>
    </div>
  );
}
