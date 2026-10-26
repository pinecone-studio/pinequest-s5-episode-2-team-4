// Server-only Supabase client for game state (battles, pets, eggs, progress).
// It uses the service-role key, which bypasses row-level security, so it
// must never be imported by a Client Component; "server-only" makes that a
// build error.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | undefined;

/** The Supabase client with full access. Throws if `.env.local` is missing the keys. */
export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
