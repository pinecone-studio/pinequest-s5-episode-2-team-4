// Pet collection and eggs (server only). Granting and hatching happen in
// database functions (supabase/migrations/0004_rewards.sql) so each egg
// hatches once. Pages read through data.ts.

import "server-only";
import { petLines } from "./mock/pets";
import { findPlayer } from "./players";
import { getSupabaseAdmin } from "./supabase";
import type { Egg, HatchResult, OwnedPet, Rarity, User } from "./types";

/** EXP a duplicate hatch gives the pet the player already owns. */
const DUPLICATE_EXP = 50;

const db = () => getSupabaseAdmin();

/**
 * The student's pets, active one marked. Their LevelUp pet is always
 * owned (and active until they pick another), even before any battle.
 */
export async function petCollection(user: User): Promise<{
  pets: OwnedPet[];
  player: { level: number; exp: number };
}> {
  const starter = user.pet;
  const player = await findPlayer(user.username);
  let pets: OwnedPet[] = [];
  if (player) {
    const { data, error } = await db()
      .from("player_pets")
      .select("line_id, level, exp, is_active")
      .eq("player_id", player.id);
    if (error) throw new Error(`Could not load pets: ${error.message}`);
    pets = (data ?? []).map((p) => ({
      lineId: p.line_id as string,
      level: p.level as number,
      exp: p.exp as number,
      active: p.is_active as boolean,
    }));
  }
  if (starter && !pets.some((p) => p.lineId === starter.lineId)) {
    pets.push({ lineId: starter.lineId, level: starter.level, exp: 0, active: false });
  }
  if (!pets.some((p) => p.active)) {
    const fallback = pets.find((p) => p.lineId === starter?.lineId) ?? pets[0];
    if (fallback) fallback.active = true;
  }
  // Collection order, as on the pets page.
  const order = new Map(petLines.map((l, i) => [l.id, i]));
  pets.sort((a, b) => (order.get(a.lineId) ?? 99) - (order.get(b.lineId) ?? 99));
  return { pets, player: { level: player?.level ?? 1, exp: player?.exp ?? 0 } };
}

/** Eggs waiting to hatch, newest first. Their pet stays hidden. */
export async function unhatchedEggs(user: User): Promise<Egg[]> {
  const player = await findPlayer(user.username);
  if (!player) return [];
  const { data, error } = await db()
    .from("eggs")
    .select("id, boss_id, rarity, obtained_at")
    .eq("player_id", player.id)
    .is("hatched_at", null)
    .order("obtained_at", { ascending: false });
  if (error) throw new Error(`Could not load eggs: ${error.message}`);
  return (data ?? []).map((e) => ({
    id: e.id as string,
    bossId: e.boss_id as string,
    rarity: e.rarity as Rarity,
    obtainedAt: e.obtained_at as string,
  }));
}

/** Hatches one of the student's eggs; undefined if it isn't theirs or already hatched. */
export async function hatchEgg(user: User, eggId: string): Promise<HatchResult | undefined> {
  const { data, error } = await db().rpc("egg_hatch", {
    p_egg: eggId,
    p_username: user.username,
    p_duplicate_exp: DUPLICATE_EXP,
  });
  if (error) throw new Error(`Could not hatch egg: ${error.message}`);
  const r = data as {
    error?: string;
    line_id?: string;
    rarity?: Rarity;
    duplicate?: boolean;
    bonus_exp?: number;
  };
  if (r.error || !r.line_id || !r.rarity) return undefined;
  return { lineId: r.line_id, rarity: r.rarity, duplicate: Boolean(r.duplicate), bonusExp: r.bonus_exp ?? 0 };
}

/** Makes one of the student's own pets their battle pet. */
export async function setActivePet(user: User, lineId: string): Promise<boolean> {
  const player = await findPlayer(user.username);
  // Before their first battle, only their LevelUp pet exists (and is active).
  if (!player) return lineId === user.pet?.lineId;
  if (user.pet) {
    // Make sure the LevelUp pet is in the collection before switching.
    await db().rpc("game_battle_pet", {
      p_player: player.id,
      p_starter_line: user.pet.lineId,
      p_starter_level: user.pet.level,
    });
  }
  const { data, error } = await db().rpc("game_set_active_pet", {
    p_username: user.username,
    p_line: lineId,
  });
  if (error) throw new Error(`Could not change pet: ${error.message}`);
  return Boolean(data);
}
