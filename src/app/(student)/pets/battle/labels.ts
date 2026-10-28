import type { EnglishSkill, Rarity } from "@/lib/types";

/** Kept in English, like rarities in games; show them with `lang="en"`. */
export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** Badge colours per rarity, from plain to gold. */
export const RARITY_STYLES: Record<Rarity, string> = {
  common: "bg-line text-ink",
  uncommon: "bg-sky text-ink",
  rare: "bg-primary text-white",
  epic: "bg-magenta text-white",
  legendary: "bg-[#ffd166] text-ink",
};

/** Egg shell colours per rarity (pixel-art egg). */
export const EGG_COLORS: Record<Rarity, { shell: string; spots: string }> = {
  common: { shell: "#f3efe0", spots: "#cac4f4" },
  uncommon: { shell: "#bfefff", spots: "#3fa3c9" },
  rare: { shell: "#b9a6ff", spots: "#5b00ed" },
  epic: { shell: "#ff9bd8", spots: "#e30ba6" },
  legendary: { shell: "#ffd166", spots: "#f08a24" },
};

export const SKILL_LABELS: Record<EnglishSkill, string> = {
  grammar: "Дүрэм",
  pronunciation: "Дуудлага",
  spelling: "Зөв бичих",
  translation: "Орчуулга",
};
