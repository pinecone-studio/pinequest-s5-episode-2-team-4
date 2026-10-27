import type { SnakeSkin } from "./types";

export const SKINS: SnakeSkin[] = [
  { id: "pink", name: "Ягаан", bands: ["#e30ba6", "#e30ba6", "#7c3aed", "#7c3aed"], need: 0 },
  { id: "rainbow", name: "Солонго", bands: ["#ff4d6d", "#ff9f43", "#ffd93d", "#34d399", "#38bdf8", "#8b5cff"], need: 3 },
  { id: "fire", name: "Гал", bands: ["#ff3b3b", "#ff3b3b", "#ffcf5a", "#ffcf5a", "#2b1b3d", "#2b1b3d"], need: 8 },
  { id: "cosmos", name: "Сансар", bands: ["#7dd3fc", "#6d28d9", "#6d28d9"], need: 15, sparkle: true },
];

// Stars and the chosen skin are kept in this browser only (no backend yet).
// Exposed as a tiny external store for useSyncExternalStore.
const KEY = "levelup.snake";

export type SkinState = { stars: number; skin: string };

export const DEFAULT_SKIN_STATE: SkinState = { stars: 0, skin: SKINS[0].id };

let cache: SkinState | null = null;
const listeners = new Set<() => void>();

export function readSkinState(): SkinState {
  if (cache) return cache;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<SkinState> | null;
    cache = { stars: saved?.stars ?? 0, skin: saved?.skin ?? SKINS[0].id };
  } catch {
    cache = DEFAULT_SKIN_STATE;
  }
  return cache;
}

export function writeSkinState(next: SkinState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: progress just isn't remembered.
  }
  listeners.forEach((l) => l());
}

export function subscribeSkinState(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const skinById = (id: string) => SKINS.find((s) => s.id === id) ?? SKINS[0];
