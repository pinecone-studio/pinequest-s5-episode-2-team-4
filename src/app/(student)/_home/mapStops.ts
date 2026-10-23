// Turns the year's chapters into the stops of the game map, in order:
// a signpost per chapter, then one level per textbook lesson (a lesson with
// playable subtopics becomes one level per subtopic).

import type { Chapter, ChapterStatus, Subtopic, SubtopicStatus } from "@/lib/types";

export type LevelState =
  | "done"
  | "mastered"
  | "weak"
  | "learning"
  | "good"
  | "untested"
  | "soon"
  | "locked";

export type MapStop =
  | { kind: "chapter"; id: string; order: number; title: string; status: ChapterStatus }
  | {
      kind: "level";
      id: string;
      /** Running level number across the whole map */
      number: number;
      title: string;
      state: LevelState;
      chapterStatus: ChapterStatus;
      href?: string;
      /** "You are here": the pet stands on it */
      current?: boolean;
    };

type PlayableNode = Subtopic & { status: SubtopicStatus | "untested"; href: string };

/**
 * Where the pet stands: the first weak subtopic, else the first one not
 * mastered yet (before the test that's the first one). Undefined when all
 * are mastered.
 */
export function currentSubtopicId(nodes: PlayableNode[]) {
  const notMastered = nodes.filter((n) => n.status !== "mastered" && n.status !== "new");
  return (
    notMastered.find((n) => n.status === "weak" || n.status === "learning")?.id ??
    notMastered[0]?.id
  );
}

/** Locked chapters only tease their first few lessons under the clouds. */
const LOCKED_PREVIEW = 3;

export function buildMapStops(
  chapters: (Chapter & { status: ChapterStatus })[],
  nodes: PlayableNode[],
): MapStop[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const currentId = currentSubtopicId(nodes);

  const stops: MapStop[] = [];
  let number = 0;
  const level = (stop: Omit<Extract<MapStop, { kind: "level" }>, "kind" | "number">) =>
    stops.push({ kind: "level", number: ++number, ...stop });

  for (const chapter of chapters) {
    stops.push({
      kind: "chapter",
      id: chapter.id,
      order: chapter.order,
      title: chapter.title,
      status: chapter.status,
    });

    const lessons =
      chapter.status === "locked" ? chapter.lessons.slice(0, LOCKED_PREVIEW) : chapter.lessons;
    for (const lesson of lessons) {
      const ids = chapter.lessonSubtopics?.[lesson];
      const playable = chapter.status !== "locked" && ids?.map((id) => byId.get(id)).filter(Boolean);
      if (playable && playable.length > 0) {
        for (const node of playable as PlayableNode[]) {
          level({
            id: node.id,
            title: node.title,
            state: node.status === "new" ? "mastered" : node.status,
            chapterStatus: chapter.status,
            href: node.href,
            current: node.id === currentId,
          });
        }
        continue;
      }
      level({
        id: `${chapter.id}-${lesson}`,
        title: lesson,
        state:
          chapter.status === "locked"
            ? "locked"
            : chapter.status === "done" && !chapter.topicId
              ? "done"
              : "soon",
        chapterStatus: chapter.status,
      });
    }
  }
  return stops;
}
