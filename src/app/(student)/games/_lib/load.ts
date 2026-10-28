// Loads a game's questions: a teacher's assignment when the URL has
// `?assignment=<id>`, otherwise the subject in `?subject=` (or the first).
// Server only; every game page calls this from its loader.

import "server-only";
import { notFound } from "next/navigation";
import { getAssignmentForPlay, getGameQuestions, getGameSubjects } from "@/lib/data";
import type { GameQuestion } from "@/lib/types";

export type GameRound = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
  /** Set when played for an assignment */
  assignment?: { id: string; title: string; game: string };
};

type Params = Promise<Record<string, string | string[] | undefined>>;

export async function loadGameRound(searchParams: Params, game: string): Promise<GameRound> {
  const { subject, assignment } = await searchParams;
  if (typeof assignment === "string") {
    const found = await getAssignmentForPlay(assignment);
    if (!found?.questions.length) notFound();
    // One "subject" so the picker shows the assignment and can't switch away.
    return {
      subjects: [{ id: "assignment", title: `Даалгавар: ${found.title}` }],
      subjectId: "assignment",
      questions: found.questions,
      assignment: { id: found.id, title: found.title, game },
    };
  }
  const subjects = await getGameSubjects();
  const subjectId = typeof subject === "string" ? subject : subjects[0].id;
  const questions = await getGameQuestions(subjectId);
  if (!questions?.length) notFound();
  return { subjects, subjectId, questions };
}
