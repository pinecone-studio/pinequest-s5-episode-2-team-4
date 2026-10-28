import { describe, expect, it } from "vitest";
import { petLines } from "./mock/pets";
import {
  XP_PER_LEVEL,
  addXp,
  isStarterPet,
  nextEvolutionLevel,
  stageIndex,
} from "./pets";
import type { UserPet } from "./types";

const pet = (level: number, xp: number): UserPet => ({ level, xp }) as UserPet;

describe("stageIndex", () => {
  it.each([
    [1, 0],
    [2, 0],
    [3, 1],
    [5, 1],
    [6, 2],
    [20, 2],
  ])("level %i is stage %i", (level, stage) => {
    expect(stageIndex(level)).toBe(stage);
  });
});

describe("nextEvolutionLevel", () => {
  it("returns the next evolving level", () => {
    expect(nextEvolutionLevel(1)).toBe(3);
    expect(nextEvolutionLevel(3)).toBe(6);
  });

  it("is undefined at the last stage", () => {
    expect(nextEvolutionLevel(6)).toBeUndefined();
  });
});

describe("addXp", () => {
  it("adds XP without levelling up below the threshold", () => {
    const next = addXp(pet(2, 10), 50);
    expect(next.level).toBe(2);
    expect(next.xp).toBe(60);
  });

  it("levels up and keeps the remainder", () => {
    const next = addXp(pet(2, 80), 40);
    expect(next.level).toBe(3);
    expect(next.xp).toBe(20);
  });

  it("can level up more than once", () => {
    const next = addXp(pet(1, 0), XP_PER_LEVEL * 2 + 5);
    expect(next.level).toBe(3);
    expect(next.xp).toBe(5);
  });

  it("does not mutate the original pet", () => {
    const original = pet(1, 0);
    addXp(original, 150);
    expect(original).toEqual(pet(1, 0));
  });
});

describe("isStarterPet", () => {
  it("offers only the common pets, Dollfin first", () => {
    expect(petLines.filter(isStarterPet).map((l) => l.id)).toEqual(["dollfin", "anoleaf", "kroki", "nut"]);
  });

  it("keeps rarer pets for boss eggs", () => {
    expect(petLines.filter((l) => l.rarity !== "common").some(isStarterPet)).toBe(false);
  });
});
