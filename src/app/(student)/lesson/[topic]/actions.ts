"use server";

import { askHelper } from "@/lib/data";
import type { ChatMessage } from "@/lib/types";

const MAX_TEXT = 500;
const MAX_MESSAGES = 10;

/**
 * Lets the helper panel ask from the client. Only the latest messages are
 * kept and each is trimmed, so a client can't send an unbounded prompt.
 */
export async function askHelperAction(
  subtopicId: string,
  history: ChatMessage[],
): Promise<string> {
  const clean = history
    .filter((m) => (m.from === "student" || m.from === "helper") && typeof m.text === "string")
    .slice(-MAX_MESSAGES)
    .map((m) => ({ from: m.from, text: m.text.slice(0, MAX_TEXT) }));
  return askHelper(String(subtopicId), clean);
}
