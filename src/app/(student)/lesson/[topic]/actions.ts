"use server";

import { askHelper } from "@/lib/data";

/** Lets the helper panel ask from the client; replies are canned for now. */
export async function askHelperAction(question: string): Promise<string> {
  return askHelper(question.slice(0, 500));
}
