import "server-only";
import { getSupabaseAdmin } from "./supabase";

/** Same matching as the login: usernames ignore case. LIKE wildcards are escaped. */
export const exactName = (name: string) => name.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * The game player row for a LevelUp username, without creating one (a
 * student who never battled has none yet).
 */
export async function findPlayer(
  username: string,
): Promise<{ id: string; level: number; exp: number } | undefined> {
  const { data, error } = await getSupabaseAdmin()
    .from("players")
    .select("id, level, exp")
    .ilike("username", exactName(username))
    .maybeSingle<{ id: string; level: number; exp: number }>();
  if (error) throw new Error(`Could not load player: ${error.message}`);
  return data ?? undefined;
}
