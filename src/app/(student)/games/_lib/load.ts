// Loads a game's questions: a teacher's assignment when the URL has
// `?assignment=<id>`, otherwise the subject in `?subject=` (or the first).
// Server only; every game page calls this from its loader.

import "server-only";
import { notFound } from "next/navigation";
import { getAssignmentForPlay, getCurrentUser, getGameQuestions, getGameSubjects } from "@/lib/data";
import type { GameQuestion } from "@/lib/types";

export type GameRound = {
  subjects: { id: string; title: string }[];
  subjectId: string;
  questions: GameQuestion[];
  /**
   * Set when played for an assignment: its questions explain the misses at
   * the end; `guest` (joined from a QR by name, e.g. a pitch judge) asks
   * about the pitch instead of the lesson.
   */
  assignment?: { id: string; title: string; game: string; questions: GameQuestion[]; guest: boolean };
};

type Params = Promise<Record<string, string | string[] | undefined>>;

export async function loadGameRound(searchParams: Params, game: string): Promise<GameRound> {
  const { subject, assignment } = await searchParams;
  if (typeof assignment === "string") {
    const [found, user] = await Promise.all([getAssignmentForPlay(assignment), getCurrentUser()]);
    if (!found?.questions.length) notFound();
    // One "subject" so the picker shows the assignment and can't switch away.
    return {
      subjects: [{ id: "assignment", title: `Даалгавар: ${found.title}` }],
      subjectId: "assignment",
      questions: found.questions,
      assignment: { id: found.id, title: found.title, game, questions: found.questions, guest: Boolean(user?.guest) },
    };
  }
  const subjects = await getGameSubjects();
  const subjectId = typeof subject === "string" ? subject : subjects[0].id;
  const questions = await getGameQuestions(subjectId);
  if (!questions?.length) notFound();
  return { subjects, subjectId, questions };
}
