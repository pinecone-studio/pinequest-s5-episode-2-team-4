// Picks the classifier: Claude when there is a key, the rules otherwise, and
// the rules again whenever Claude fails.

import "server-only";
import type { Classification, ClassifyInput } from "./classifier";
import { claudeClassifier } from "./claude";
import { rulesClassifier } from "./rules";

export type { Classification, ClassifyInput, ExistingGroup } from "./classifier";

export async function classifyQuestion(input: ClassifyInput): Promise<Classification> {
  if (!process.env.ANTHROPIC_API_KEY) return rulesClassifier.classify(input);
  try {
    return await claudeClassifier.classify(input);
  } catch (error) {
    console.error("[classify] falling back to rules:", error);
    return rulesClassifier.classify(input);
  }
}
