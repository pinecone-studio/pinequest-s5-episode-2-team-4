"use client";

// Live battle updates over Supabase Realtime. The server broadcasts a
// data-free "changed" message on `battle:<id>` after each change; screens
// then refresh their own view through a checked Server Function, so the
// public key never reads any battle data.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect } from "react";

let client: SupabaseClient | null | undefined;

function browserClient() {
  if (client === undefined) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  }
  return client;
}

/** Calls `onChange` (keep it stable) whenever the server says this battle changed. */
export function useBattleChannel(battleId: string, onChange: () => void) {
  useEffect(() => {
    const supabase = browserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`battle:${battleId}`)
      .on("broadcast", { event: "changed" }, () => onChange())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [battleId, onChange]);
}
