// TODO(#9): replace with the shared pet data once it lands in src/lib.

export type PetElement =
  | "water"
  | "fire"
  | "wood"
  | "ice"
  | "sky"
  | "metal"
  | "earth"
  | "shadow";

export type PetLine = {
  id: string;
  element: PetElement;
  /** Names of the 3 evolutions: levels 1–2, 3–5, 6+ */
  stages: [string, string, string];
};

const PET_LINES: PetLine[] = [
  { id: "dollfin", element: "water", stages: ["Dollfin", "Bigfin", "Sharpfin"] },
  { id: "agnite", element: "fire", stages: ["Agnite", "Agnidon", "Agnigon"] },
  { id: "anoleaf", element: "wood", stages: ["Anoleaf", "Gectile", "Velocitile"] },
  { id: "tweesher", element: "ice", stages: ["Tweesher", "Heronquak", "Eaglace"] },
  { id: "cardiling", element: "sky", stages: ["Cardiling", "Cardiwing", "Cardinale"] },
  { id: "wrougon", element: "metal", stages: ["Wrougon", "Allagon", "Ferricran"] },
  { id: "rockitten", element: "earth", stages: ["Rockitten", "Rockat", "Jemuar"] },
  { id: "kroki", element: "water", stages: ["Kroki", "Krokivip", "Leviadile"] },
  { id: "elofly", element: "sky", stages: ["Elofly", "Elowind", "Elostorm"] },
  { id: "helipi", element: "wood", stages: ["Helipi", "Coppi", "Parappi"] },
  { id: "cackleen", element: "shadow", stages: ["Cackleen", "Brumi", "Bewhich"] },
  { id: "nut", element: "metal", stages: ["Nut", "Bolt", "Arthrobolt"] },
];

export const STAGE_LEVELS = ["1–2", "3–5", "6+"] as const;

export async function getPetLines(): Promise<PetLine[]> {
  return PET_LINES;
}

/** Which evolution a pet of this level is in: 0, 1 or 2. */
export function stageForLevel(level: number) {
  if (level >= 6) return 2;
  if (level >= 3) return 1;
  return 0;
}
