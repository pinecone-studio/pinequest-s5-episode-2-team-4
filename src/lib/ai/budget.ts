// A monthly spending cap for the AI, kept in Supabase (ai_usage, migration
// 0013). Every call's tokens and cost are saved; once this month's total
// reaches AI_MONTHLY_BUDGET_USD (default $1), no more calls are made and the
// pages use demo content. Server only.
//
// It's a guard, not an exact meter: calls running at the same moment can go
// a few cents over. The Anthropic Console's spend limit is the hard cap.

import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "../supabase";

const BUDGET_USD = Number(process.env.AI_MONTHLY_BUDGET_USD) || 1;

/** $ per million tokens. Haiku 5.5 costs more once a prompt is over 100K tokens. */
const PRICES: Record<string, { input: number; output: number; longInput: number; longOutput: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5, longInput: 0.5, longOutput: 2.5 },
};
const LONG_PROMPT = 100_000;

function costUsd(model: string, usage: Anthropic.Usage) {
  // Unknown model: price it like Opus, so the cap errs on the safe side.
  const p = PRICES[model] ?? { input: 4, output: 20, longInput: 4, longOutput: 20 };
  const input = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
  const long = input > LONG_PROMPT;
  return (input * (long ? p.longInput : p.input) + usage.output_tokens * (long ? p.longOutput : p.output)) / 1_000_000;
}

const monthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
};

/** This month's spend so far, or undefined when it can't be read. */
export async function monthSpendUsd(): Promise<number | undefined> {
  const { data, error } = await getSupabaseAdmin()
    .from("ai_usage")
    .select("cost_usd")
    .gte("created_at", monthStart())
    .returns<{ cost_usd: number }[]>();
  if (error) {
    console.error("Could not read AI usage:", error.message);
    return undefined;
  }
  return (data ?? []).reduce((sum, r) => sum + Number(r.cost_usd), 0);
}

/** Whether another call fits this month's budget. Unknown spend counts as no. */
export async function withinBudget(): Promise<boolean> {
  const spent = await monthSpendUsd();
  if (spent === undefined) return false;
  if (spent >= BUDGET_USD) console.warn(`AI budget of $${BUDGET_USD} used up this month ($${spent.toFixed(4)})`);
  return spent < BUDGET_USD;
}

export async function recordUsage(model: string, usage: Anthropic.Usage) {
  const { error } = await getSupabaseAdmin()
    .from("ai_usage")
    .insert({
      model,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd: costUsd(model, usage),
    });
  if (error) console.error("Could not record AI usage:", error.message);
}
