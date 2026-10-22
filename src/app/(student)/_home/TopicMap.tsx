import Link from "next/link";
import { Fragment } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { StatusBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PetStage, Subtopic, SubtopicStatus } from "@/lib/types";

/** "untested": the diagnostic test hasn't been taken yet. */
export type MapStatus = SubtopicStatus | "untested";
export type MapNode = Subtopic & {
  status: MapStatus;
  /** The subtopic's lesson, or the test before it is taken */
  href: string;
};

const STATUS_LABELS: Record<MapStatus, string> = {
  untested: "шалгаагүй",
  weak: "сул",
  learning: "нөхөж буй",
  good: "сайн",
  mastered: "эзэмшсэн",
  new: "эзэмшсэн",
};

// Circle look per status; the current node overrides it.
const circleStyles: Record<MapStatus, string> = {
  untested: "bg-surface shadow-[0_8px_0_var(--color-lavender)]",
  mastered: "bg-sky shadow-[0_8px_0_var(--color-sky-dark)]",
  new: "bg-sky shadow-[0_8px_0_var(--color-sky-dark)]",
  weak: "border-4 border-magenta bg-pink shadow-[0_8px_0_#f3b8e0]",
  learning: "bg-line shadow-[0_8px_0_var(--color-lavender)]",
  good: "bg-lavender shadow-[0_8px_0_var(--color-line)]",
};
const currentStyle = "bg-primary text-white animate-pulse-ring";

const CheckIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-10 md:size-12">
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BookIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-4"
  >
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z" />
    <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
  </svg>
);

type TopicMapProps = {
  title: string;
  nodes: MapNode[];
  pet: PetStage;
};

/** Path of subtopics: horizontal on desktop, vertical on phones. */
export function TopicMap({ title, nodes, pet }: TopicMapProps) {
  const done = nodes.filter((n) => n.status === "mastered" || n.status === "new").length;
  // The pet stands on the first subtopic that still needs work.
  const currentId = nodes.find((n) => n.status === "weak" || n.status === "learning")?.id;

  return (
    <section
      aria-labelledby="map-title"
      className="mt-7 rounded-[25px] bg-white px-5 py-6 shadow-card md:mt-6 md:rounded-panel md:px-10 md:pt-8 md:pb-10"
    >
      <div className="flex items-center justify-between gap-3 md:justify-start md:gap-3.5">
        <h2 id="map-title" className="text-[26px] leading-tight font-bold md:text-[32px]">
          {title}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.25 text-sm font-bold md:px-3.5 md:py-1.5 md:text-[15px]">
          {BookIcon}
          {done} / {nodes.length}
        </span>
      </div>

      <ol className="mt-6 flex flex-col md:mt-18 md:flex-row md:items-start">
        {nodes.map((node, i) => {
          const current = node.id === currentId;
          const finished = node.status === "mastered" || node.status === "new";
          return (
            <Fragment key={node.id}>
              {i > 0 && (
                <li
                  aria-hidden="true"
                  className="ml-8.5 h-7 border-l-4 border-dashed border-line md:mt-13.5 md:ml-0 md:h-auto md:flex-auto md:border-t-4 md:border-l-0"
                />
              )}
              <li className="md:flex-none">
                <Link
                  href={node.href}
                  aria-label={`${node.order}. ${node.lessonTitle}, ${STATUS_LABELS[node.status]}${current ? ", одоо энд байна" : ""}`}
                  className="relative flex min-h-18 items-center gap-4 text-ink no-underline transition-transform hover:text-ink md:w-42 md:flex-col md:gap-3 md:hover:-translate-y-1"
                >
                  {current && (
                    <PetSprite
                      stage={pet}
                      className="order-last ml-auto animate-bob md:absolute md:-top-15 md:left-13 md:z-10 md:ml-0"
                    />
                  )}
                  <span
                    className={cn(
                      "flex size-18 flex-none items-center justify-center rounded-full text-3xl font-bold md:size-28 md:text-[44px]",
                      current ? currentStyle : circleStyles[node.status],
                    )}
                  >
                    {finished ? CheckIcon : node.order}
                  </span>
                  <span className="flex flex-col items-start gap-1 md:items-center md:gap-3">
                    <span className="text-[17px] font-bold">{node.title}</span>
                    {!finished && node.status !== "untested" && (
                      <StatusBadge status={node.status} />
                    )}
                  </span>
                </Link>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </section>
  );
}
