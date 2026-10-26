import type { PetElement, PetLine, Rarity } from "@/lib/types";

// Sprites: front frames from the Tuxemon project (CC BY-SA 4.0),
// https://github.com/Tuxemon/Tuxemon, stored in public/pets/.
const line = (
  id: string,
  element: PetElement,
  rarity: Rarity,
  names: [string, string, string],
): PetLine => ({
  id,
  element,
  rarity,
  stages: names.map((name) => ({
    name,
    sprite: `/pets/${name.toLowerCase()}.png`,
  })) as PetLine["stages"],
});

/**
 * In the order shown on the signup and pets pages. Rarity sets how rare the
 * egg is from bosses (Drokoro, the hardest, drops the legendary Cardiling).
 */
export const petLines: PetLine[] = [
  line("dollfin", "water", "common", ["Dollfin", "Bigfin", "Sharpfin"]),
  line("agnite", "fire", "epic", ["Agnite", "Agnidon", "Agnigon"]),
  line("anoleaf", "wood", "common", ["Anoleaf", "Gectile", "Velocitile"]),
  line("tweesher", "ice", "uncommon", ["Tweesher", "Heronquak", "Eaglace"]),
  line("cardiling", "sky", "legendary", ["Cardiling", "Cardiwing", "Cardinale"]),
  line("wrougon", "metal", "uncommon", ["Wrougon", "Allagon", "Ferricran"]),
  line("rockitten", "earth", "uncommon", ["Rockitten", "Rockat", "Jemuar"]),
  line("kroki", "water", "common", ["Kroki", "Krokivip", "Leviadile"]),
  line("elofly", "sky", "rare", ["Elofly", "Elowind", "Elostorm"]),
  line("helipi", "wood", "uncommon", ["Helipi", "Coppi", "Parappi"]),
  line("cackleen", "shadow", "rare", ["Cackleen", "Brumi", "Bewhich"]),
  line("nut", "metal", "common", ["Nut", "Bolt", "Arthrobolt"]),
];
