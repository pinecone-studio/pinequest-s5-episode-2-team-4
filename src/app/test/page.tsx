import type { Metadata } from "next";
import { getCurrentPet, getTestQuestions } from "@/lib/data";
import { DiagnosticTest } from "./DiagnosticTest";

export const metadata: Metadata = {
  title: "Оношлох тест — LevelUp",
};

// TODO: pick the topic once there is more than one.
const TOPIC_ID = "fractions";

export default async function TestPage() {
  const [questions, pet] = await Promise.all([
    getTestQuestions(TOPIC_ID),
    getCurrentPet(),
  ]);

  return (
    <DiagnosticTest
      questions={questions}
      petStage={pet?.stage}
      resultsHref={`/lesson/${TOPIC_ID}`}
    />
  );
}
