import type {
  ClassGoal,
  ClassOverview,
  HeatmapRow,
  HeatmapStatus,
  TeacherNotification,
} from "@/lib/types";

export const classOverview: ClassOverview = {
  code: "7А",
  topicId: "fractions",
  studentCount: 32,
  testedCount: 28,
  weakestSubtopicId: "different-denominator",
  weakestCount: 12,
};

// One letter per student №01–№32: W weak, L learning, M good, N untested.
const codes: Record<string, HeatmapStatus> = {
  W: "weak",
  L: "learning",
  M: "good",
  N: "untested",
};
const row = (subtopicId: string, s: string): HeatmapRow => ({
  subtopicId,
  cells: s.split("").map((c) => codes[c]),
});

export const heatmap: HeatmapRow[] = [
  row("different-denominator", "MWWMNLWMWMWLMNMWMMWMWLMWMNWMWMNW"),
  row("simplify", "MMWMNMMWLMWMMNMMWMLWMMMWMNMWMWNM"),
  row("mixed-numbers", "MWMMNMLMMMWMMNMMMWMMMMMWMNMMWMNM"),
  row("same-denominator", "MMMMNMMMMMWMMNMMMMMMMMMWMNMMMMNM"),
];

export const notifications: TeacherNotification[] = [
  {
    id: "n1",
    kind: "failed",
    title: "№11 · 2 удаа тэнцээгүй",
    subtopicId: "different-denominator",
    time: "09:42",
  },
  {
    id: "n2",
    kind: "failed",
    title: "№24 · 2 удаа тэнцээгүй",
    subtopicId: "mixed-numbers",
    time: "Өчигдөр",
  },
  {
    id: "n3",
    kind: "common-mistake",
    title: "12 сурагч: 1/2 + 1/3 = 2/5",
    subtopicId: "different-denominator",
    time: "Өнөөдөр",
  },
  {
    id: "n4",
    kind: "mastered",
    title: "№17 · Эзэмшсэн",
    subtopicId: "different-denominator",
    time: "10:15",
  },
];

export const classGoal: ClassGoal = {
  classCode: "7А",
  name: "7А",
  targetXp: 5000,
  currentXp: 3200,
  reward: "Ангиараа шинэ тэжээвэр нээнэ",
};
