import type { PetElement, PetLine } from "@/lib/types";

// Sprites: front frames from the Tuxemon project (CC BY-SA 4.0),
// https://github.com/Tuxemon/Tuxemon, stored in public/pets/.
const line = (id: string, element: PetElement, names: [string, string, string]): PetLine => ({
  id,
  element,
  stages: names.map((name) => ({
    name,
    sprite: `/pets/${name.toLowerCase()}.png`,
  })) as PetLine["stages"],
});

/** In the order shown on the signup and pets pages. */
export const petLines: PetLine[] = [
  line("dollfin", "water", ["Dollfin", "Bigfin", "Sharpfin"]),
  line("agnite", "fire", ["Agnite", "Agnidon", "Agnigon"]),
  line("anoleaf", "wood", ["Anoleaf", "Gectile", "Velocitile"]),
  line("tweesher", "ice", ["Tweesher", "Heronquak", "Eaglace"]),
  line("cardiling", "sky", ["Cardiling", "Cardiwing", "Cardinale"]),
  line("wrougon", "metal", ["Wrougon", "Allagon", "Ferricran"]),
  line("rockitten", "earth", ["Rockitten", "Rockat", "Jemuar"]),
  line("kroki", "water", ["Kroki", "Krokivip", "Leviadile"]),
  line("elofly", "sky", ["Elofly", "Elowind", "Elostorm"]),
  line("helipi", "wood", ["Helipi", "Coppi", "Parappi"]),
  line("cackleen", "shadow", ["Cackleen", "Brumi", "Bewhich"]),
  line("nut", "metal", ["Nut", "Bolt", "Arthrobolt"]),
];
