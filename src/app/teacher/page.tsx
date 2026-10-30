import type { Metadata } from "next";
import { ClassGoalCard } from "@/components/ClassGoalCard";
import {
  getAnonQuestions,
  getClassGoal,
  getClassOverview,
  getCurrentUser,
  getHeatmap,
  getQuestionGroups,
  getLessonDaySignals,
  getTodaySignals,
  getSubtopics,
} from "@/lib/data";
import { topicTitle } from "@/lib/lesson-topics";
import { Heatmap } from "./Heatmap";
import { PeerApproval } from "./PeerApproval";
import { QuestionGroups } from "./QuestionGroups";
import { SignalPanel } from "./SignalPanel";
import { SubjectPrompt } from "./SubjectPrompt";

export const metadata: Metadata = {
  title: "Багшийн самбар · LevelUp",
};

export default async function TeacherPage({ searchParams }: PageProps<"/teacher">) {
  // «Хичээлийн дохио» week: ?week=1 is last week.
  const { week } = await searchParams;
  const overview = await getClassOverview();
  const [
    subtopics,
    heatmap,
    signals,
    weekSignals,
    groups,
    questions,
    classGoal,
    user,
  ] = await Promise.all([
    getSubtopics(overview.topicId),
    getHeatmap(),
    getTodaySignals(),
    getLessonDaySignals({ weeksBack: Number(week) || 0, beforeToday: true }),
    getQuestionGroups(),
    getAnonQuestions(),
    getClassGoal(),
    getCurrentUser(),
  ]);

  const subtopicById = new Map(subtopics.map((s) => [s.id, s]));
  const rows = heatmap.map((row) => ({
    ...row,
    title: subtopicById.get(row.subtopicId)?.title ?? row.subtopicId,
    lessonTitle:
      subtopicById.get(row.subtopicId)?.lessonTitle ?? row.subtopicId,
  }));
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const questionGroups = groups.map((g) => ({
    ...g,
    subtopicTitle: subtopicById.get(g.subtopicId)?.title ?? g.subtopicId,
    questions: g.questionIds.flatMap((id) => questionById.get(id) ?? []),
  }));
  const pendingAnswers = questions
    .filter((q) => q.answer?.by === "peer" && !q.answer.approved)
    .map((q) => ({
      ...q,
      subtopicTitle: subtopicById.get(q.subtopicId)?.title ?? q.subtopicId,
    }));

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pt-1 md:block md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <h1 className="type-page-title md:mb-8">
        Багшийн самбар
      </h1>
      {user && !user.subject ? <SubjectPrompt className="md:mt-5" /> : null}
      <Heatmap
        rows={rows}
        testedCount={overview.testedCount}
      />
      <SignalPanel
        today={signals.map((s) => ({
          ...s,
          // Class lesson topics too, not only the app lessons.
          title: subtopicById.get(s.subtopicId)?.title ?? topicTitle(s.subtopicId) ?? s.subtopicId,
        }))}
        signals={weekSignals}
        className="md:mt-5"
      />
      <QuestionGroups groups={questionGroups} className="md:mt-5" />
      <PeerApproval questions={pendingAnswers} className="md:mt-5" />
      {classGoal && <ClassGoalCard goal={classGoal} className="md:mt-5" />}
    </div>
  );
}
