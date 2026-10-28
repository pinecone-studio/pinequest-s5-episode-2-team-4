// Claude calls that return JSON matching a schema. Server only: the API key
// must never reach the browser.
//
// Without ANTHROPIC_API_KEY, past the monthly budget (budget.ts), or when a
// call fails, times out, is refused or returns JSON that doesn't validate,
// `generateJson` returns undefined and the caller falls back to demo
// content. Only teacher material is ever sent: never student names, emails,
// class codes or scores.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { recordUsage, withinBudget } from "./budget";

/** Haiku: the cheapest model, enough for reading material and writing short JSON. */
export const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-5-5";
const TIMEOUT_MS = 45_000;

let client: Anthropic | undefined;
function claude() {
  if (!process.env.ANTHROPIC_API_KEY) return undefined;
  client ??= new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 1 });
  return client;
}

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** A file or text for the model to read. */
export type AiInput = { text: string } | { mime: string; data: Buffer };

type ImageType = "image/jpeg" | "image/png" | "image/webp";

function toBlock(input: AiInput): Anthropic.ContentBlockParam {
  if ("text" in input) return { type: "text", text: input.text };
  const data = input.data.toString("base64");
  if (input.mime === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data } };
  }
  return { type: "image", source: { type: "base64", media_type: input.mime as ImageType, data } };
}

/**
 * Structured outputs need `additionalProperties: false` on every object and
 * don't take array length limits; the validators check those instead.
 */
function strictSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(strictSchema);
  if (!schema || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "minItems" || key === "maxItems") continue;
    out[key] = strictSchema(value);
  }
  if (out.type === "object") out.additionalProperties = false;
  return out;
}

/**
 * Runs one prompt and returns the parsed JSON if it passes `validate`.
 * `validate` returns the cleaned value or undefined.
 */
export async function generateJson<T>({
  system,
  inputs,
  schema,
  validate,
  maxOutputTokens = 8000,
}: {
  system: string;
  inputs: AiInput[];
  schema: object;
  validate: (value: unknown) => T | undefined;
  maxOutputTokens?: number;
}): Promise<T | undefined> {
  const ai = claude();
  if (!ai || !(await withinBudget())) return undefined;
  try {
    // Pictures and PDFs first, then the text that refers to them.
    const ordered = [...inputs.filter((i) => !("text" in i)), ...inputs.filter((i) => "text" in i)];
    const response = await ai.messages.create({
      model: MODEL,
      max_tokens: maxOutputTokens,
      system,
      // Low effort: the cheapest setting, and these are short, well-defined tasks.
      output_config: { effort: "low", format: { type: "json_schema", schema: strictSchema(schema) as Record<string, unknown> } },
      messages: [{ role: "user", content: ordered.map(toBlock) }],
    });
    await recordUsage(MODEL, response.usage);
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      console.error(`Claude stopped early: ${response.stop_reason}`);
      return undefined;
    }
    // Thinking blocks may come first; the answer is the text block.
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text;
    return validate(JSON.parse(text ?? "null"));
  } catch (error) {
    console.error("Claude call failed:", error);
    return undefined;
  }
}
