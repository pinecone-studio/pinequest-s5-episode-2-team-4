import type { BossRarity, EnglishSkill } from "@/lib/types";

export const RARITY_LABELS: Record<BossRarity, string> = {
  common: "Энгийн",
  uncommon: "Ховордуу",
  rare: "Ховор",
  epic: "Эрхэм",
  legendary: "Домогт",
};

export const SKILL_LABELS: Record<EnglishSkill, string> = {
  grammar: "Дүрэм",
  pronunciation: "Дуудлага",
  spelling: "Зөв бичих",
  translation: "Орчуулга",
};
