import type { Metadata } from "next";
import { ClassGoalCard } from "@/components/ClassGoalCard";
import {
  getAnonQuestions,
  getAssignmentDraft,
  getBattleSubjects,
  getBosses,
  getClassGoal,
  getClassOverview,
  getCurrentUser,
  getHeatmap,
  getNotifications,
  getQuestionGroups,
  getSignalSummary,
  getSubtopics,
  getTeacherClassBattle,
} from "@/lib/data";
import { subjectTitle } from "@/lib/subjects";
import { AssignmentDraftCard } from "./AssignmentDraftCard";
import { ClassBattleCard } from "./ClassBattleCard";
import { Heatmap } from "./Heatmap";
import { NotificationList } from "./NotificationList";
import { PeerApproval } from "./PeerApproval";
import { QuestionGroups } from "./QuestionGroups";
import { SignalPanel } from "./SignalPanel";
import { StatCards } from "./StatCards";
import { SubjectPrompt } from "./SubjectPrompt";

export const metadata: Metadata = {
  title: "Багшийн самбар · LevelUp",
};

// The demo student (student-17) is outlined in the heatmap.
const HIGHLIGHTED_STUDENT = 17;

export default async function TeacherPage() {
  const overview = await getClassOverview();
  const [
    subtopics,
    heatmap,
    notifications,
    draft,
    signals,
    groups,
    questions,
    classGoal,
    bosses,
    classBattle,
    battleSubjects,
    user,
  ] = await Promise.all([
    getSubtopics(overview.topicId),
    getHeatmap(),
    getNotifications(),
    getAssignmentDraft(),
    getSignalSummary(),
    getQuestionGroups(),
    getAnonQuestions(),
    getClassGoal(),
    getBosses(),
    getTeacherClassBattle(),
    getBattleSubjects(),
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
  // "Mastered" notifications are good news; the rest need the teacher.
  const alertCount = notifications.filter((n) => n.kind !== "mastered").length;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pt-1 md:block md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <h1 className="type-page-title md:mb-8">
        Багшийн самбар
      </h1>
      <StatCards
        testedCount={overview.testedCount}
        studentCount={overview.studentCount}
        weakestCount={overview.weakestCount}
        weakestTitle={subtopicById.get(overview.weakestSubtopicId)?.title ?? ""}
        notificationCount={alertCount}
      />
      {user && !user.subject ? <SubjectPrompt className="md:mt-5" /> : null}
      <ClassBattleCard bosses={bosses} subjects={battleSubjects} teacherSubjectTitle={user?.subject && subjectTitle(user.subject)} open={classBattle} classCode={user?.classCode ?? classGoal.classCode} className="md:mt-5" />
      <Heatmap
        rows={rows}
        testedCount={overview.testedCount}
        highlight={HIGHLIGHTED_STUDENT}
      />
      <SignalPanel
        rows={signals.map((s) => ({
          ...s,
          title: subtopicById.get(s.subtopicId)?.title ?? s.subtopicId,
        }))}
        className="md:mt-5"
      />
      <div className="flex flex-col gap-4 md:mt-5 md:flex-row md:flex-wrap md:items-start md:gap-5">
        <AssignmentDraftCard
          draft={draft}
          subtopicTitle={subtopicById.get(draft.subtopicId)?.title ?? ""}
          className="md:flex-[3_1_560px]"
        />
        <NotificationList
          notifications={notifications}
          subtopicTitles={new Map(subtopics.map((s) => [s.id, s.title]))}
          alertCount={alertCount}
          className="md:flex-[2_1_340px]"
        />
      </div>
      <QuestionGroups groups={questionGroups} className="md:mt-5" />
      <PeerApproval questions={pendingAnswers} className="md:mt-5" />
      <ClassGoalCard goal={classGoal} className="md:mt-5" />
    </div>
  );
}
