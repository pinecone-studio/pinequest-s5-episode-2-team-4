import type { Metadata } from "next";
import { DiagnosticTest } from "./DiagnosticTest";
import { getTestQuestions } from "./questions";

export const metadata: Metadata = {
  title: "Оношлох тест — LevelUp",
};

export default function TestPage() {
  return <DiagnosticTest questions={getTestQuestions()} />;
}
