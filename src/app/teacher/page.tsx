import type { Metadata } from "next";
import { aiEnabled } from "@/lib/ai";
import {
  getAssignment,
  getClassReport,
  getDraftExercises,
  getNotifications,
  getSubtopics,
  getTeacherClasses,
} from "@/lib/data";
import { AssignmentDraftCard } from "./AssignmentDraftCard";
import { ClassBar, FirstClassCard } from "./ClassPanel";
import { ClassTopicChart } from "./ClassTopicChart";
import { NotificationList } from "./NotificationList";
import { StatCards } from "./StatCards";

export const metadata: Metadata = {
  title: "Багшийн самбар · LevelUp",
};

export default async function TeacherPage({ searchParams }: PageProps<"/teacher">) {
  const query = await searchParams;
  const classes = await getTeacherClasses();

  const title = (
    <h1 className="text-[40px] leading-none font-bold tracking-[-0.03em] md:mb-8 md:text-[64px]">
      Багшийн самбар
    </h1>
  );
  if (classes.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-1 md:px-[clamp(16px,4vw,40px)] md:pt-2">
        {title}
        <FirstClassCard />
      </div>
    );
  }

  const current = classes.find((c) => c.code === query.class) ?? classes[classes.length - 1];
  const report = await getClassReport(current.code);
  if (!report) return null;

  const [subtopics, notifications] = await Promise.all([
    getSubtopics(current.topicId),
    getNotifications(),
  ]);
  const subtopicById = new Map(subtopics.map((s) => [s.id, s]));
  // Weakest subtopic unless the teacher picked one in the chart.
  const selectedId =
    report.subtopics.find((s) => s.subtopicId === query.sub)?.subtopicId ??
    report.subtopics[0].subtopicId;
  const selected = report.subtopics.find((s) => s.subtopicId === selectedId)!;

  const [assignment, draftItems] = await Promise.all([
    getAssignment(current.code, selectedId),
    getDraftExercises(selectedId),
  ]);

  const rows = report.subtopics.map((row) => ({
    ...row,
    title: subtopicById.get(row.subtopicId)?.title ?? row.subtopicId,
    lessonTitle: subtopicById.get(row.subtopicId)?.lessonTitle ?? row.subtopicId,
    href: `/teacher?class=${current.code}&sub=${row.subtopicId}#draft-title`,
    selected: row.subtopicId === selectedId,
  }));
  const weakest = report.subtopics[0];
  // "Mastered" notifications are good news; the rest need the teacher.
  const alertCount = notifications.filter((n) => n.kind !== "mastered").length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pt-1 md:block md:px-[clamp(16px,4vw,40px)] md:pt-2">
      {title}
      <ClassBar classes={classes} current={current} joinedCount={report.joinedCount} />
      <StatCards
        testedCount={report.testedCount}
        studentCount={report.studentCount}
        weakestCount={weakest.weak + weakest.learning}
        weakestTitle={subtopicById.get(weakest.subtopicId)?.title ?? ""}
        notificationCount={alertCount}
      />
      <ClassTopicChart rows={rows} studentCount={report.studentCount} />
      <div className="flex flex-col gap-4 md:mt-5 md:flex-row md:flex-wrap md:items-start md:gap-5">
        <AssignmentDraftCard
          // A different class or subtopic starts a fresh draft.
          key={`${current.code}-${selectedId}`}
          classCode={current.code}
          subtopicId={selectedId}
          subtopicTitle={subtopicById.get(selectedId)?.lessonTitle ?? ""}
          initialItems={assignment?.items ?? draftItems}
          published={Boolean(assignment)}
          initialDue={assignment?.due ?? ""}
          targetCount={selected.weak + selected.learning}
          aiEnabled={aiEnabled()}
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
