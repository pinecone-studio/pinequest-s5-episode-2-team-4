import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { submitTest } from "@/lib/actions";
import {
  getCurrentPet,
  getSampleTestAnswers,
  getTestQuestions,
  getTestResult,
} from "@/lib/data";
import { DiagnosticTest } from "./DiagnosticTest";

export const metadata: Metadata = {
  title: "Оношлох тест — LevelUp",
};

// TODO: pick the topic once there is more than one.
const TOPIC_ID = "fractions";
const LESSON_HREF = `/lesson/${TOPIC_ID}`;

export default async function TestPage({ searchParams }: PageProps<"/test">) {
  const [questions, pet, result, sampleAnswers, { retake, fill }] = await Promise.all([
    getTestQuestions(TOPIC_ID),
    getCurrentPet(),
    getTestResult(),
    getSampleTestAnswers(),
    searchParams,
  ]);

  // Already taken: continue the lessons, or retake on purpose.
  if (result && retake !== "1") {
    return (
      <section
        aria-labelledby="taken-title"
        className="mx-auto mt-6 flex max-w-160 flex-col items-center gap-5 rounded-panel bg-white px-6 py-8 text-center shadow-float md:mt-10 md:px-12 md:py-10"
      >
        <h1 id="taken-title" className="text-2xl leading-tight font-bold md:text-3xl">
          Тестээ өгсөн байна
        </h1>
        <p
          aria-label={`${result.total}-аас ${result.correct} зөв`}
          className="text-6xl leading-none font-bold"
        >
          {result.correct}
          <span className="text-3xl text-ink-muted">/{result.total}</span>
        </p>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <ButtonLink href={LESSON_HREF}>Хичээл үргэлжлүүлэх</ButtonLink>
          <ButtonLink href="/test?retake=1" variant="secondary">
            Дахин өгөх
          </ButtonLink>
        </div>
        <p className="text-sm font-semibold text-ink-muted">
          Дахин өгвөл энэ дүн шинэ дүнгээр солигдоно. Эзэмшсэн сэдвүүд хэвээр үлдэнэ.
        </p>
        {/* Demo accounts: retake with the sample answers already filled in. */}
        {sampleAnswers && (
          <Link
            href="/test?retake=1&fill=1"
            className="inline-flex min-h-12 items-center px-4 text-sm font-semibold text-ink-muted underline underline-offset-4 md:min-h-11"
          >
            Жишээ хариултаар бөглөх
          </Link>
        )}
      </section>
    );
  }

  return (
    <DiagnosticTest
      questions={questions}
      petStage={pet?.stage}
      submit={submitTest}
      resultsHref={LESSON_HREF}
      sampleAnswers={sampleAnswers}
      startFilled={fill === "1"}
    />
  );
}
