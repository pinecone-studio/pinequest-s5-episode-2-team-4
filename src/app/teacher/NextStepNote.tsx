import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MIN_TESTED, type NextStep } from "@/lib/class-results";

const ADVICE: Record<NextStep, { text: string; className: string }> = {
  few: {
    text: `Зөвлөмж гаргахад тестийн дүн хангалтгүй байна. Дор хаяж ${MIN_TESTED} сурагч тест өгсний дараа зөвлөмж харагдана.`,
    className: "bg-surface text-ink-muted",
  },
  reexplain: {
    text: "Энэ сэдвийг дахин тайлбарлах шаардлагатай сурагч олон байна. Дараагийн хичээлээр гол ойлголтыг тайлбарлаж, 2–3 дасгалыг ангиараа хамт бодоорой.",
    className: "bg-status-weak text-status-weak-ink",
  },
  review: {
    text: "Энэ сэдвийг бататгах шаардлагатай сурагч олон байна. Богино давтлага хийж, нэмэлт дасгал эсвэл тайлбар материал өгөөрэй.",
    className: "bg-status-mid text-status-mid-ink",
  },
  next: {
    text: "Тестийн дүнгээр ихэнх сурагч энэ сэдвийг сайн эзэмшсэн байна. Дараагийн сэдэв рүү шилжих боломжтой.",
    className: "bg-status-good text-status-good-ink",
  },
};

type NextStepNoteProps = {
  step: NextStep;
  className?: string;
};

/** What the teacher could do next for a subtopic, with links to act on it. */
export function NextStepNote({ step, className }: NextStepNoteProps) {
  const advice = ADVICE[step];
  const act = step === "reexplain" || step === "review";
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className={cn("rounded-tile px-4 py-2.5 text-sm font-bold md:text-base", advice.className)}>
        {advice.text}
      </p>
      {act ? (
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/teacher/assignments/new" size="sm">
            Даалгавар өгөх
          </ButtonLink>
          <ButtonLink href="/teacher/videos/new" size="sm" variant="secondary">
            Тайлбар видео бэлтгэх
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
