import { buttonClass } from "@/components/ui";
import { switchDemoTour } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { gameTitle } from "@/lib/gamefit";
import type { StudentAssignment } from "@/lib/data";

type Step = { title: string; text: string; state: "done" | "now" | "next" };

/**
 * The assignment demo, student side: what the teacher did, what to do now,
 * and a way over to the teacher's results.
 */
export function DemoTour({ assignment }: { assignment?: StudentAssignment }) {
  const done = Boolean(assignment?.done);
  const steps: Step[] = [
    {
      title: "Багш асуулт бэлдэв",
      text: "Сэдвээ бичээд (эсвэл номын хуудсаа оруулаад) AI-аар асуулт гаргаж, тус бүрийг шалгаж засав.",
      state: "done",
    },
    {
      title: "Тоглоом сонгоод ангидаа нийтлэв",
      text: assignment
        ? `${assignment.games.map(gameTitle).join(", ")} · ${assignment.classCode} анги`
        : "Ангийн бүх сурагчид нэг дор очно.",
      state: "done",
    },
    {
      title: "Сурагч тоглоомоор биелүүлнэ",
      text: done
        ? "Биелүүллээ! Тэжээвэр чинь XP авсан."
        : "Чи одоо энэ ангийн сурагч. Доорх даалгаврын «Тоглох» дээр дар: асуултууд нь багшийн бэлдсэнээр солигдсон байна. Дор хаяж нэг асуултад зөв хариулбал биелнэ.",
      state: done ? "done" : "now",
    },
    {
      title: "Багш үр дүнг харна",
      text: "Хэдэн сурагч биелүүлсэн, дундаж зөв хувь, хамгийн их алдсан асуулт. Сурагчийн нэр гарахгүй.",
      state: done ? "now" : "next",
    },
  ];

  return (
    <section aria-labelledby="demo-tour-title" className="rounded-panel border-2 border-dashed border-primary bg-surface p-5 md:p-7">
      <p className="text-sm font-bold text-primary">Демо</p>
      <h2 id="demo-tour-title" className="mt-1 type-section-title">
        Багшийн даалгавар сурагчид хэрхэн ирдэг вэ
      </h2>
      <ol className="mt-5 grid gap-3 md:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className={cn(
              "flex gap-3 rounded-card p-3 md:flex-col",
              s.state === "now" ? "bg-white shadow-card ring-2 ring-primary" : "bg-white/60",
              s.state === "next" && "opacity-70",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full font-bold",
                s.state === "done" ? "bg-sky" : s.state === "now" ? "bg-primary text-white" : "bg-lavender",
              )}
            >
              {s.state === "done" ? "✓" : i + 1}
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-bold">
                {s.title}
                <span className="sr-only">{s.state === "done" ? " (болсон)" : s.state === "now" ? " (одоо)" : ""}</span>
              </span>
              <span className="text-sm text-ink-muted">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <form action={switchDemoTour} className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" className={buttonClass({ variant: done ? "primary" : "white", size: "sm" })}>
          Багшийн талаас харах →
        </button>
        <span className="text-sm text-ink-muted">
          {done ? "Чиний тоглолт багшийн хуудсанд гарсан байгаа." : "Тоглосны дараа үзвэл үр дүн чинь харагдана."}
        </span>
      </form>
    </section>
  );
}
