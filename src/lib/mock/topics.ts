import type { Subtopic, Topic } from "@/lib/types";

export const topics: Topic[] = [
  {
    id: "fractions",
    title: "Бутархай",
    subtopicIds: [
      "same-denominator",
      "different-denominator",
      "simplify",
      "mixed-numbers",
    ],
  },
];

export const subtopics: Subtopic[] = [
  {
    id: "same-denominator",
    topicId: "fractions",
    order: 1,
    title: "Ижил хуваарь",
    lessonTitle: "Ижил хуваарьтай нэмэх",
  },
  {
    id: "different-denominator",
    topicId: "fractions",
    order: 2,
    title: "Ялгаатай хуваарь",
    lessonTitle: "Ялгаатай хуваарьтай нэмэх",
  },
  {
    id: "simplify",
    topicId: "fractions",
    order: 3,
    title: "Хураах",
    lessonTitle: "Бутархай хураах",
  },
  {
    id: "mixed-numbers",
    topicId: "fractions",
    order: 4,
    title: "Холимог тоо",
    lessonTitle: "Холимог тоо ба зөв биш бутархай",
  },
];
