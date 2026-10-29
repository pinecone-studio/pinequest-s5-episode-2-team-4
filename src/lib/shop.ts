// The pet shop: items bought once with coins, one of each kind worn at a time.

import type { ShopEntry, ShopItem, ShopSlot, ShopState } from "./types";

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "scene-forest",
    slot: "scene",
    name: "Ой",
    description: "Ногоон ой, шар цэцэгтэй",
    price: 150,
    palette: {
      sky: "#dff5e3", haze: "#e9f7df", pink: "#f4f8e2", mountain: "#b9dcc0", hill: "#a8d4ae", ground: "#e6f4dc",
      meadow: "#c4e5b8", grass: "#7fbf7f", primary: "#2f6f4f", bloomPink: "#f6a6c1", bloomViolet: "#ffe07a", night: "#12332a", white: "#ffffff",
    },
  },
  {
    id: "scene-sunset",
    slot: "scene",
    name: "Нар жаргах",
    description: "Улбар шар, ягаан тэнгэр",
    price: 200,
    palette: {
      sky: "#ffd9b8", haze: "#ffc6c6", pink: "#f7b2d0", mountain: "#e7a9c4", hill: "#d99ab8", ground: "#fbe3e0",
      meadow: "#f3c1cc", grass: "#d98fae", primary: "#8a2c6b", bloomPink: "#ff8fb8", bloomViolet: "#ffb36b", night: "#4a1a4f", white: "#fff7ef",
    },
  },
  {
    id: "scene-snow",
    slot: "scene",
    name: "Цастай уул",
    description: "Цагаан цас, цэнхэр тэнгэр",
    price: 200,
    palette: {
      sky: "#dff1ff", haze: "#eef6ff", pink: "#f6fbff", mountain: "#c9dcf2", hill: "#e3eefa", ground: "#ffffff",
      meadow: "#dbe8f6", grass: "#b8cde6", primary: "#3b6ea8", bloomPink: "#a8d8ff", bloomViolet: "#c9c2ff", night: "#1c2f5a", white: "#ffffff",
    },
  },
  {
    id: "scene-beach",
    slot: "scene",
    name: "Далайн эрэг",
    description: "Элсэн эрэг, хөх далай",
    price: 250,
    palette: {
      sky: "#c9f0ff", haze: "#e3f8ff", pink: "#fff4dc", mountain: "#8fd3e6", hill: "#f6dfae", ground: "#fdf0cf",
      meadow: "#f3dba5", grass: "#7cc8a8", primary: "#2f8f83", bloomPink: "#ff9f9f", bloomViolet: "#ffd36b", night: "#10345a", white: "#ffffff",
    },
  },
  { id: "ring-mint", slot: "ring", name: "Гаа ногоон", description: "XP-ийн цагираг ногоон", price: 80, colors: ["#2bb98a"] },
  { id: "ring-pink", slot: "ring", name: "Ягаан", description: "XP-ийн цагираг ягаан", price: 80, colors: ["#e8559c"] },
  { id: "ring-gold", slot: "ring", name: "Алтан", description: "XP-ийн цагираг алтан", price: 120, colors: ["#f5c542", "#e0a92e"] },
  {
    id: "ring-rainbow",
    slot: "ring",
    name: "Солонго",
    description: "XP-ийн цагираг солонгон",
    price: 200,
    colors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#9b5de5"],
  },
  { id: "aura-sparkle", slot: "aura", name: "Оддын гялбаа", description: "Тэжээврийн эргэн тойронд од гялалзана", price: 250, shape: "sparkle", colors: ["#fff3a8", "#ffffff"] },
  { id: "aura-hearts", slot: "aura", name: "Зүрхнүүд", description: "Тэжээврийн эргэн тойронд зүрх хөвнө", price: 250, shape: "heart", colors: ["#ff8fb8", "#ffc2d9"] },
];

export const findShopItem = (id: string) => SHOP_ITEMS.find((i) => i.id === id);

const EMPTY: ShopState = { owned: [], equipped: {} };

export type BuyError = "unknown" | "owned" | "coins";

/** Buys an item: takes its price from the coins, adds it and wears it at once. */
export function buyShopItem(
  state: ShopState | undefined,
  coins: number,
  itemId: string,
): { state: ShopState; coins: number } | { error: BuyError } {
  const item = findShopItem(itemId);
  const current = state ?? EMPTY;
  if (!item) return { error: "unknown" };
  if (current.owned.includes(item.id)) return { error: "owned" };
  if (coins < item.price) return { error: "coins" };
  return {
    coins: coins - item.price,
    state: { owned: [...current.owned, item.id], equipped: { ...current.equipped, [item.slot]: item.id } },
  };
}

/** Wears an owned item, or takes the slot back to the default with null. */
export function equipShopItem(
  state: ShopState | undefined,
  slot: ShopSlot,
  itemId: string | null,
): ShopState | { error: "unknown" | "notowned" } {
  const current = state ?? EMPTY;
  if (itemId === null) {
    const equipped = { ...current.equipped };
    delete equipped[slot];
    return { ...current, equipped };
  }
  const item = findShopItem(itemId);
  if (!item || item.slot !== slot) return { error: "unknown" };
  if (!current.owned.includes(item.id)) return { error: "notowned" };
  return { ...current, equipped: { ...current.equipped, [slot]: item.id } };
}

/** Every item with whether the student owns and wears it. */
export function shopEntries(state: ShopState | undefined): ShopEntry[] {
  const current = state ?? EMPTY;
  return SHOP_ITEMS.map((i) => ({ ...i, owned: current.owned.includes(i.id), equipped: current.equipped[i.slot] === i.id }));
}
