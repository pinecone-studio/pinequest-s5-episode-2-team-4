// Compares the Claude classifier with the rules on the labelled questions in
// cases.ts: how often each picks the right group, and what Claude costs.
//
//   npm run eval:questions
//
// Needs ANTHROPIC_API_KEY in .env. About 30 requests, well under $0.01.

import { claudeClassifier } from "../../src/lib/ai/claude";
import type { QuestionClassifier } from "../../src/lib/ai/classifier";
import { rulesClassifier } from "../../src/lib/ai/rules";
import { lessons } from "./cases";

/** Claude Haiku 5.5, US dollars per million tokens. */
const PRICE = { input: 0.1, output: 0.5 };

try {
  process.loadEnvFile(".env");
} catch {
  // Keys can also come from the environment.
}
if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY in .env first");

// claude.ts logs "[classify] <model> <ms>ms in=<n> out=<n>" for each request.
const usage = { input: 0, output: 0, ms: [] as number[] };
const log = console.info;
console.info = (line: string) => {
  const m = /(\d+)ms in=(\d+) out=(\d+)/.exec(line);
  if (!m) return log(line);
  usage.ms.push(Number(m[1]));
  usage.input += Number(m[2]);
  usage.output += Number(m[3]);
};

type Score = { right: number; total: number; review: number; reviewTotal: number; misses: string[] };

async function score(classifier: QuestionClassifier): Promise<Score> {
  const s: Score = { right: 0, total: 0, review: 0, reviewTotal: 0, misses: [] };
  for (const { lessonTitle, groups, cases } of lessons) {
    for (const c of cases) {
      const result = await classifier.classify({ text: c.text, lessonTitle, groups });
      s.total++;
      if (result.groupId === c.group) s.right++;
      else s.misses.push(`  "${c.text}": expected ${c.group ?? "new"}, got ${result.groupId ?? "new"}`);
      if (c.review) {
        s.reviewTotal++;
        if (result.needsReview) s.review++;
      }
    }
  }
  return s;
}

const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}% (${a}/${b})`;

for (const [name, classifier] of [["Rules", rulesClassifier], ["Claude Haiku 5.5", claudeClassifier]] as const) {
  const s = await score(classifier);
  log(`\n${name}\n  right group:     ${pct(s.right, s.total)}\n  flagged for review: ${pct(s.review, s.reviewTotal)}`);
  if (s.misses.length) log(s.misses.join("\n"));
}

const cost = (usage.input * PRICE.input + usage.output * PRICE.output) / 1e6;
const ms = [...usage.ms].sort((a, b) => a - b);
log(
  `\nClaude: ${ms.length} requests, ${usage.input} in / ${usage.output} out tokens, $${cost.toFixed(5)} total, ` +
    `$${(cost / ms.length).toFixed(6)} per question, median ${ms[Math.floor(ms.length / 2)]}ms`,
);
