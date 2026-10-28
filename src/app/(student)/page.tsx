import { notFound } from "next/navigation";
import { ClassGoalCard } from "@/components/ClassGoalCard";
import { StreakCard } from "@/components/StreakCard";
import {
  getClassGoal,
  getClassVideos,
  getLearningStreak,
  getCurrentPet,
  getPetLines,
  getProgress,
  getStudentAssignments,
  getStudentClasses,
  getSubtopics,
  getTopic,
} from "@/lib/data";
import { ClassNotice } from "./_home/ClassNotice";
import { HomeHero } from "./_home/HomeHero";
import { TeacherCard } from "./_home/TeacherCard";
import { TopicMap } from "./_home/TopicMap";

const TOPIC_ID = "fractions";
const ORBIT_PET_IDS = ["dollfin", "agnite", "anoleaf", "tweesher", "cardiling"];

export default async function HomePage() {
  const [topic, subtopics, progress, pet, petLines, classGoal, streak, assignments, videos, classes] =
    await Promise.all([
      getTopic(TOPIC_ID),
      getSubtopics(TOPIC_ID),
      getProgress(),
      getCurrentPet(),
      getPetLines(),
      getClassGoal(),
      getLearningStreak(),
      getStudentAssignments(),
      getClassVideos(),
      getStudentClasses(),
    ]);
  if (!topic || !pet) notFound();

  // No progress means the diagnostic test hasn't been taken yet.
  const testTaken = progress.length > 0;
  const nodes = subtopics.map((s) => ({
    ...s,
    status: progress.find((p) => p.subtopicId === s.id)?.status ?? ("untested" as const),
    href: testTaken ? `/lesson/${topic.id}?sub=${s.id}` : "/test",
  }));
  const orbitPets = ORBIT_PET_IDS.flatMap((id) => {
    const line = petLines.find((l) => l.id === id);
    return line ? [{ stage: line.stages[0], element: line.element }] : [];
  });

  return (
    // The animated background runs up under the transparent header.
    <div className="relative -mt-18 animate-flow overflow-hidden bg-flow pt-18 pb-16 md:-mt-22 md:pt-22">
      <div className="mx-auto max-w-7xl px-4 md:px-[clamp(16px,4vw,40px)]">
        <HomeHero
          pet={{ stage: pet.stage, level: pet.level }}
          testTaken={testTaken}
          orbitPets={orbitPets}
        />
        <StreakCard streak={streak} />
        {classes.length ? (
          <TeacherCard
            assignmentsLeft={assignments.filter((a) => !a.done).length}
            videoCount={videos.length}
          />
        ) : (
          <ClassNotice />
        )}
        <TopicMap
          title={topic.title}
          nodes={nodes}
          pet={pet.stage}
        />
        {classes.length > 0 && classGoal && <ClassGoalCard goal={classGoal} className="mt-6 md:mt-10" />}
      </div>
    </div>
  );
}
