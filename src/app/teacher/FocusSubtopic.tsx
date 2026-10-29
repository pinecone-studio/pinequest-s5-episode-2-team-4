import { share, type SubtopicResult } from "@/lib/class-results";
import { NextStepNote } from "./NextStepNote";

type FocusSubtopicProps = {
  result: SubtopicResult;
  title: string;
};

/** The subtopic most of the class finds hard, at the top of the test results. */
export function FocusSubtopic({ result, title }: FocusSubtopicProps) {
  const { weak, learning } = result.counts;
  const struggling = weak + learning;
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-card border-2 border-magenta bg-pink p-4 md:p-5">
      <p className="text-sm font-bold text-status-weak-ink">
        <span aria-hidden="true">⚠️ </span>Анхаарах сэдэв
      </p>
      <h3 className="text-lg font-bold md:text-xl">{title}</h3>
      <p className="font-semibold">
        {struggling} сурагч ({share(struggling, result.tested)}%) хүндэрч байна: {weak} сул, {learning} нөхөж буй.
      </p>
      <NextStepNote step={result.step} className="mt-1" />
    </div>
  );
}
