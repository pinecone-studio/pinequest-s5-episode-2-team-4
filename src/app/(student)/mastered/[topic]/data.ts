// TODO(#8): move these types to src/lib/types.ts and the data to src/lib/mock/
// once the shared mock data lands.

export type SubtopicStatus = "weak" | "good" | "mastered" | "new";

export type Subtopic = {
  slug: string;
  title: string;
  /** Lesson title shown under "Эзэмшсэн!". */
  heading: string;
  status: SubtopicStatus;
};

export type PetLevelUp = {
  from: { name: string; level: number };
  to: { name: string; level: number };
  mood: string;
  xp: number;
  xpMax: number;
  xpGained: number;
  nextEvolutionLevel: number;
};

export type MasteredResult = {
  topicTitle: string;
  subtopic: Subtopic;
  subtopics: Subtopic[];
  score: { correct: number; total: number };
  pet: PetLevelUp;
  /** Where "Дараагийн түвшин" leads. */
  nextHref: string;
};

const SUBTOPICS: Subtopic[] = [
  {
    slug: "unlike-denominators",
    title: "Ялгаатай хуваарь",
    heading: "Ялгаатай хуваарьтай нэмэх",
    status: "weak",
  },
  {
    slug: "like-denominators",
    title: "Ижил хуваарь",
    heading: "Ижил хуваарьтай нэмэх",
    status: "mastered",
  },
  {
    slug: "mixed-numbers",
    title: "Холимог тоо",
    heading: "Холимог тоо",
    status: "good",
  },
  {
    slug: "simplifying",
    title: "Хураах",
    heading: "Бутархай хураах",
    status: "weak",
  },
];

const PET: PetLevelUp = {
  from: { name: "Wrougon", level: 2 },
  to: { name: "Allagon", level: 3 },
  mood: "Баяртай",
  xp: 60,
  xpMax: 100,
  xpGained: 100,
  nextEvolutionLevel: 6,
};

export function getSubtopicSlugs() {
  return SUBTOPICS.map((subtopic) => subtopic.slug);
}

/** Result of the retest that mastered `slug`, or null for an unknown slug. */
export function getMasteredResult(slug: string): MasteredResult | null {
  const subtopic = SUBTOPICS.find((s) => s.slug === slug);
  if (!subtopic) return null;

  const subtopics = SUBTOPICS.map((s) =>
    s.slug === slug ? { ...s, status: "new" as const } : s,
  );
  const next =
    subtopics.find((s) => s.status === "weak") ??
    subtopics.find((s) => s.status === "good");

  return {
    topicTitle: "Бутархай",
    subtopic: { ...subtopic, status: "new" },
    subtopics,
    score: { correct: 4, total: 5 },
    pet: PET,
    nextHref: next ? `/lesson/${next.slug}` : "/",
  };
}
