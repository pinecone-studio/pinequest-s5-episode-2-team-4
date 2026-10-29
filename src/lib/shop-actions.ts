"use server";

// The pet shop: buying an item with coins and choosing which one to wear.

import { type BuyError, buyShopItem, equipShopItem } from "./shop";
import { readSession, writeSession } from "./session";
import type { ShopSlot } from "./types";

export type BuyResult = { ok: true; coins: number } | { error: BuyError | "failed" };

/** Buys an item once, if the student has the coins, and wears it. */
export async function buyItem(itemId: string): Promise<BuyResult> {
  const session = await readSession();
  if (session?.role !== "student") return { error: "failed" };
  const result = buyShopItem(session.shop, session.coins ?? 0, itemId);
  if ("error" in result) return result;
  await writeSession({ ...session, shop: result.state, coins: result.coins });
  return { ok: true, coins: result.coins };
}

/** Wears an owned item in its slot, or goes back to the default with null. */
export async function equipItem(slot: ShopSlot, itemId: string | null): Promise<{ ok: true } | { error: "unknown" | "notowned" | "failed" }> {
  const session = await readSession();
  if (session?.role !== "student" || !["scene", "ring", "aura"].includes(slot)) return { error: "failed" };
  const state = equipShopItem(session.shop, slot, itemId);
  if ("error" in state) return state;
  await writeSession({ ...session, shop: state });
  return { ok: true };
}
