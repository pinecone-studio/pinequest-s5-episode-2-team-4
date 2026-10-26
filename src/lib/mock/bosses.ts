import type { Boss } from "@/lib/types";

// Sprites: Bigfin, Djinnbo, Drokoro, Delfeco and Bugnin are from Tuxemon
// (see docs/boss-sprites.md for sources and licences). Dogeroid isn't a
// Tuxemon monster; its sprite is original art made for this project.
//
// Balance: harder bosses have more HP, attack more often and hit harder,
// but give more EXP and a better chance at rarer eggs. All values are a
// first guess to tune after playtesting.

export const bosses: Boss[] = [
  {
    id: "bigfin",
    name: "Bigfin",
    sprite: "/pets/bigfin.png",
    elements: ["water"],
    rarity: "common",
    difficulty: 1,
    description: "Далайн том загас. Анхан шатны дайсан.",
    maxHp: 300,
    hpPerExtraPlayer: 0.6,
    questionDifficulty: { min: 1, max: 1 },
    attack: { minIntervalSec: 16, maxIntervalSec: 20, warningSec: 3, damage: 8 },
    rewards: {
      exp: 50,
      eggChance: 0.5,
      eggPool: [
        { lineId: "dollfin", weight: 3 },
        { lineId: "kroki", weight: 2 },
        { lineId: "tweesher", weight: 1 },
      ],
    },
  },
  {
    id: "bugnin",
    name: "Bugnin",
    sprite: "/bosses/bugnin.png",
    elements: ["metal"],
    rarity: "uncommon",
    difficulty: 2,
    description: "Төмөр хуягтай шавж нинжа.",
    maxHp: 450,
    hpPerExtraPlayer: 0.6,
    questionDifficulty: { min: 1, max: 2 },
    attack: { minIntervalSec: 14, maxIntervalSec: 18, warningSec: 3, damage: 10 },
    rewards: {
      exp: 80,
      eggChance: 0.6,
      eggPool: [
        { lineId: "nut", weight: 3 },
        { lineId: "anoleaf", weight: 2 },
        { lineId: "helipi", weight: 1 },
      ],
    },
  },
  {
    id: "dogeroid",
    name: "Dogeroid",
    sprite: "/bosses/dogeroid.png",
    elements: ["metal"],
    rarity: "uncommon",
    difficulty: 2,
    description: "Робот нохой. Хурдан довтолдог.",
    maxHp: 500,
    hpPerExtraPlayer: 0.6,
    questionDifficulty: { min: 1, max: 2 },
    attack: { minIntervalSec: 13, maxIntervalSec: 17, warningSec: 3, damage: 11 },
    rewards: {
      exp: 90,
      eggChance: 0.6,
      eggPool: [
        { lineId: "wrougon", weight: 3 },
        { lineId: "rockitten", weight: 2 },
        { lineId: "nut", weight: 1 },
      ],
    },
  },
  {
    id: "delfeco",
    name: "Delfeco",
    sprite: "/bosses/delfeco.png",
    elements: ["water", "wood"],
    rarity: "rare",
    difficulty: 3,
    description: "Ус, ургамлын хүчтэй далайн луу.",
    maxHp: 700,
    hpPerExtraPlayer: 0.65,
    questionDifficulty: { min: 1, max: 3 },
    attack: { minIntervalSec: 12, maxIntervalSec: 16, warningSec: 3, damage: 13 },
    rewards: {
      exp: 130,
      eggChance: 0.7,
      eggPool: [
        { lineId: "dollfin", weight: 2 },
        { lineId: "anoleaf", weight: 2 },
        { lineId: "kroki", weight: 2 },
        { lineId: "elofly", weight: 1 },
      ],
    },
  },
  {
    id: "djinnbo",
    name: "Djinnbo",
    sprite: "/bosses/djinnbo.png",
    elements: ["fire", "shadow"],
    rarity: "epic",
    difficulty: 4,
    description: "Гал, сүүдрийн хүчтэй жинн.",
    maxHp: 900,
    hpPerExtraPlayer: 0.7,
    questionDifficulty: { min: 2, max: 3 },
    attack: { minIntervalSec: 11, maxIntervalSec: 15, warningSec: 3, damage: 15 },
    rewards: {
      exp: 180,
      eggChance: 0.8,
      eggPool: [
        { lineId: "cackleen", weight: 3 },
        { lineId: "agnite", weight: 2 },
        { lineId: "elofly", weight: 1 },
      ],
    },
  },
  {
    id: "drokoro",
    name: "Drokoro",
    sprite: "/bosses/drokoro.png",
    elements: ["fire"],
    rarity: "legendary",
    difficulty: 5,
    description: "Галт луу. Хамгийн хүчтэй дайсан.",
    maxHp: 1200,
    hpPerExtraPlayer: 0.75,
    questionDifficulty: { min: 2, max: 3 },
    attack: { minIntervalSec: 10, maxIntervalSec: 14, warningSec: 3, damage: 18 },
    rewards: {
      exp: 250,
      eggChance: 1,
      eggPool: [
        { lineId: "agnite", weight: 2 },
        { lineId: "cardiling", weight: 2 },
        { lineId: "cackleen", weight: 1 },
        { lineId: "tweesher", weight: 1 },
      ],
    },
  },
];
