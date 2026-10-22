import type { PetElement, PetLine, PetStage } from "./types";

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

/** The pet's look and name at a given level. */
export function petStage(line: PetLine, level: number): PetStage {
  return line.stages[stageIndex(level)];
}

export const STAGE_LEVEL_LABELS = ["Түвшин 1–2", "Түвшин 3–5", "Түвшин 6+"] as const;

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
