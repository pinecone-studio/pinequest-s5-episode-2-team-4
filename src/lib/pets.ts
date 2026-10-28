import type { PetElement, PetLine, PetStage, UserPet } from "./types";

/** Levels where a pet evolves: 1–2 → stage 0, 3–5 → stage 1, 6+ → stage 2. */
export const EVOLVE_LEVELS = [3, 6] as const;

export function stageIndex(level: number): 0 | 1 | 2 {
  if (level >= EVOLVE_LEVELS[1]) return 2;
  if (level >= EVOLVE_LEVELS[0]) return 1;
  return 0;
}

/** The next level where the pet evolves, or undefined at the last stage. */
export function nextEvolutionLevel(level: number): number | undefined {
  return EVOLVE_LEVELS.find((l) => l > level);
}

/** Pets a new student can pick: the common ones. Rarer pets hatch from boss eggs. */
export function isStarterPet(line: PetLine): boolean {
  return line.rarity === "common";
}

/** XP that fills one level; mastering a subtopic is a whole level. */
export const XP_PER_LEVEL = 100;

/** Adds XP, levelling up every XP_PER_LEVEL. */
export function addXp(pet: UserPet, xp: number): UserPet {
  const total = pet.xp + xp;
  return {
    ...pet,
    level: pet.level + Math.floor(total / XP_PER_LEVEL),
    xp: total % XP_PER_LEVEL,
  };
}

/** The pet's look and name at a given level. */
export function petStage(line: PetLine, level: number): PetStage {
  return line.stages[stageIndex(level)];
}

export const STAGE_LEVEL_LABELS = ["Түвшин 1–2", "Түвшин 3–5", "Түвшин 6+"] as const;

/** How the pet feels, from the learning streak. Pets never look hurt. */
export type PetMood = "happy" | "awake" | "sleepy";

export const PET_MOOD_LABELS: Record<PetMood, string> = {
  happy: "Баяртай",
  awake: "Сэргэлэн",
  sleepy: "Нойрмог",
};

/**
 * Learned today: happy. The streak is still alive (learned yesterday): awake.
 * Otherwise sleepy, until the student learns again.
 */
export function petMood(streak: { activeToday: boolean; current: number }): PetMood {
  if (streak.activeToday) return "happy";
  return streak.current > 0 ? "awake" : "sleepy";
}

export const ELEMENT_LABELS: Record<PetElement, string> = {
  water: "Ус",
  fire: "Гал",
  wood: "Мод",
  ice: "Мөс",
  sky: "Тэнгэр",
  metal: "Төмөр",
  earth: "Шороо",
  shadow: "Сүүдэр",
};
