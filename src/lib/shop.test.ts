import { describe, expect, it } from "vitest";
import { SHOP_ITEMS, buyShopItem, equipShopItem, shopEntries } from "./shop";

describe("SHOP_ITEMS", () => {
  it("has unique ids and positive prices in every slot", () => {
    expect(new Set(SHOP_ITEMS.map((i) => i.id)).size).toBe(SHOP_ITEMS.length);
    expect(SHOP_ITEMS.every((i) => i.price > 0)).toBe(true);
    expect(new Set(SHOP_ITEMS.map((i) => i.slot))).toEqual(new Set(["scene", "ring", "aura"]));
  });
});

describe("buyShopItem", () => {
  it("takes the price, adds the item and wears it", () => {
    expect(buyShopItem(undefined, 100, "ring-mint")).toEqual({
      coins: 20,
      state: { owned: ["ring-mint"], equipped: { ring: "ring-mint" } },
    });
  });

  it("refuses an unknown item, one already owned, or too few coins", () => {
    const owned = { owned: ["ring-mint"], equipped: {} };
    expect(buyShopItem(undefined, 999, "nope")).toEqual({ error: "unknown" });
    expect(buyShopItem(owned, 999, "ring-mint")).toEqual({ error: "owned" });
    expect(buyShopItem(undefined, 79, "ring-mint")).toEqual({ error: "coins" });
  });
});

describe("equipShopItem", () => {
  const state = { owned: ["ring-mint", "ring-gold"], equipped: { ring: "ring-mint" } };

  it("switches to another owned item in the same slot", () => {
    expect(equipShopItem(state, "ring", "ring-gold")).toEqual({ ...state, equipped: { ring: "ring-gold" } });
  });

  it("goes back to the default with null", () => {
    expect(equipShopItem(state, "ring", null)).toEqual({ ...state, equipped: {} });
  });

  it("refuses items not owned or from another slot", () => {
    expect(equipShopItem(state, "ring", "ring-pink")).toEqual({ error: "notowned" });
    expect(equipShopItem(state, "scene", "ring-gold")).toEqual({ error: "unknown" });
  });
});

describe("shopEntries", () => {
  it("marks owned and worn items", () => {
    const entries = shopEntries({ owned: ["ring-mint", "scene-forest"], equipped: { ring: "ring-mint" } });
    expect(entries.find((e) => e.id === "ring-mint")).toMatchObject({ owned: true, equipped: true });
    expect(entries.find((e) => e.id === "scene-forest")).toMatchObject({ owned: true, equipped: false });
    expect(entries.find((e) => e.id === "ring-gold")).toMatchObject({ owned: false, equipped: false });
  });
});
