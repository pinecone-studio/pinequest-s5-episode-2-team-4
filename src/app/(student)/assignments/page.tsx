import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getDemoTour, getStudentAssignments } from "@/lib/data";
import { gameTitle, isAssignmentGame } from "@/lib/gamefit";
import { DemoTour } from "./DemoTour";

export const metadata: Metadata = {
  title: "Даалгавар · LevelUp",
};

const day = new Intl.DateTimeFormat("mn-MN", { month: "long", day: "numeric", timeZone: "Asia/Ulaanbaatar" });

/** Game assignments from the student's teacher; unfinished first. */
export default async function StudentAssignmentsPage() {
  const [assignments, tour] = await Promise.all([getStudentAssignments(), getDemoTour()]);
  const sorted = [...assignments].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5 px-4 py-6 md:gap-7 md:px-[clamp(16px,4vw,40px)] md:py-10">
      <div>
        <h1 className="type-page-title">Даалгавар</h1>
        <p className="mt-3 text-ink-muted md:text-lg">Багшийн өгсөн асуултуудаар тоглоод тэжээвэртээ XP цуглуул.</p>
      </div>

      {tour && <DemoTour assignment={assignments.find((a) => a.id === tour.assignmentId)} />}

      {sorted.length === 0 ? (
        <section className="glass-panel rounded-panel border border-line bg-white p-6 text-center shadow-card">
          <p className="text-4xl" aria-hidden="true">
            🎉
          </p>
          <h2 className="mt-2 text-xl font-bold">Одоогоор даалгавар алга</h2>
          <p className="mt-1 text-ink-muted">Багш даалгавар өгөхөөр энд гарна.</p>
          <ButtonLink href="/games" variant="secondary" size="sm" className="mt-4">
            Тоглоомууд руу
          </ButtonLink>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((a) => {
            const others = a.gameMode === "interest" ? a.games.filter((g) => g !== a.playGame && isAssignmentGame(g)) : [];
            return (
              <li
                key={a.id}
                className={cn(
                  "glass-panel flex flex-col gap-3 rounded-panel border border-line bg-white p-4 shadow-card md:flex-row md:items-center md:justify-between md:p-5",
                  a.done && "opacity-80",
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cn("flex size-12 shrink-0 items-center justify-center rounded-card text-2xl", a.done ? "bg-sky" : "bg-pink")}
                  >
                    {a.done ? "✓" : "🎮"}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg leading-snug font-bold">{a.title}</h2>
                    <p className="text-sm text-ink-muted">
                      {gameTitle(a.playGame)}
                      {a.dueAt && ` · ${day.format(new Date(a.dueAt))} хүртэл`}
                      {a.done && " · Биелсэн"}
                    </p>
                    {others.length > 0 && (
                      <p className="mt-1 text-sm">
                        Өөр тоглоомоор:{" "}
                        {others.map((g, i) => (
                          <span key={g}>
                            {i > 0 && ", "}
                            <Link href={`/games/${g}?assignment=${a.id}`} className="font-bold">
                              {gameTitle(g)}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </div>
                <ButtonLink
                  href={`/games/${a.playGame}?assignment=${a.id}`}
                  variant={a.done ? "secondary" : "primary"}
                  size="sm"
                  className="self-start md:self-auto"
                >
                  {a.done ? "Дахин тоглох" : "Тоглох"}
                </ButtonLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
