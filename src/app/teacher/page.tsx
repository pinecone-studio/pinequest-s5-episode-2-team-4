import type { Metadata } from "next";
import {
  getAssignmentDraft,
  getClassOverview,
  getHeatmap,
  getNotifications,
  getSignalSummary,
  getSubtopics,
} from "@/lib/data";
import { AssignmentDraftCard } from "./AssignmentDraftCard";
import { Heatmap } from "./Heatmap";
import { NotificationList } from "./NotificationList";
import { SignalPanel } from "./SignalPanel";
import { StatCards } from "./StatCards";

export const metadata: Metadata = {
  title: "Багшийн самбар · LevelUp",
};

// The demo student (student-17) is outlined in the heatmap.
const HIGHLIGHTED_STUDENT = 17;

export default async function TeacherPage() {
  const overview = await getClassOverview();
  const [subtopics, heatmap, notifications, draft, signals] = await Promise.all([
    getSubtopics(overview.topicId),
    getHeatmap(),
    getNotifications(),
    getAssignmentDraft(),
    getSignalSummary(),
  ]);

  const subtopicById = new Map(subtopics.map((s) => [s.id, s]));
  const rows = heatmap.map((row) => ({
    ...row,
    title: subtopicById.get(row.subtopicId)?.title ?? row.subtopicId,
    lessonTitle:
      subtopicById.get(row.subtopicId)?.lessonTitle ?? row.subtopicId,
  }));
  // "Mastered" notifications are good news; the rest need the teacher.
  const alertCount = notifications.filter((n) => n.kind !== "mastered").length;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pt-1 md:block md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <h1 className="text-[40px] leading-none font-bold tracking-[-0.03em] md:mb-8 md:text-[64px]">
        Багшийн самбар
      </h1>
      <StatCards
        testedCount={overview.testedCount}
        studentCount={overview.studentCount}
        weakestCount={overview.weakestCount}
        weakestTitle={subtopicById.get(overview.weakestSubtopicId)?.title ?? ""}
        notificationCount={alertCount}
      />
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
    </div>
  );
}
