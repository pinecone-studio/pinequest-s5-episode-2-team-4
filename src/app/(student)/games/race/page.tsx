import type { Metadata } from "next";
import { getRaceQuestions } from "@/lib/data";
import { HorseRace } from "./HorseRace";

export const metadata: Metadata = {
  title: "Морин уралдаан · LevelUp",
};

export default async function HorseRacePage() {
  const questions = await getRaceQuestions();

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 pb-10 md:px-[clamp(16px,4vw,40px)]">
      <h1 className="text-[40px] leading-none font-bold tracking-[-0.03em] md:text-[56px]">
        Морин уралдаан
      </h1>
      <p className="mt-2 mb-5 font-bold text-ink-muted md:mb-8 md:text-lg">
        {questions.length} асуулт. Зөв хариулт бүрт морь чинь нэг нүүдэл
        урагшилна.
      </p>
      <HorseRace questions={questions} />
    </div>
  );
}
