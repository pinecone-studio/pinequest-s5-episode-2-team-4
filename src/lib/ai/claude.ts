// Claude Haiku classifier. Only the question text, the lesson name and the
// existing group titles are sent; never a student id or name.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { subtopics } from "../mock/topics";
import { INTENTS, MAX_TITLE_LENGTH, type ClassifyInput, type QuestionClassifier } from "./classifier";

const MODEL = "claude-haiku-5-5";
/** The student never waits for this, but a stuck request should not pile up. */
const TIMEOUT_MS = 10_000;

/** Groups are sent as g1, g2, … so the model cannot invent an id. */
const Reply = z.object({
  group: z.string().nullable(),
  title: z.string(),
  intent: z.enum(INTENTS),
  misconception: z.string().nullable(),
  needs_review: z.boolean(),
});

const SYSTEM = `Чи 6-7-р ангийн бутархайн хичээлийн нэргүй асуултуудыг ангилдаг туслах.
Сурагчид кирилл, латин үсгээр (жишээ нь "huvaariig ygd nemdeggui ym"), эсвэл холиод, алдаатай бичиж болно.

Даалгавар:
- Асуулт аль нэг бүлэгтэй УТГААРАА ижил бол тэр бүлгийн id-г "group"-д бич (жишээ нь "g2"). Үгүй бол null.
- "title": шинэ бүлгийн богино нэр, кирилл үсгээр, ${MAX_TITLE_LENGTH} тэмдэгтээс бага. Апп-ын сэдвийн нэрийг яг ашигла: ${subtopics.map((s) => `"${s.title}"`).join(", ")}.
- "intent": how = алхам асууж байна, why = яагаад гэдгийг, check = хариугаа зөв эсэхийг, other = бусад.
- "misconception": асуултаас харагдах буруу ойлголт, нэг өгүүлбэрээр. Байхгүй бол null.
- "needs_review": хичээлтэй хамааралгүй, ойлгомжгүй эсвэл зохисгүй бол true.`;

function prompt({ text, lessonTitle, groups }: ClassifyInput) {
  const list = groups.length
    ? groups.map((g, i) => `g${i + 1}: ${g.title}${g.examples.length ? ` (жишээ: ${g.examples.join(" | ")})` : ""}`).join("\n")
    : "(одоогоор бүлэг алга)";
  return `Хичээл: ${lessonTitle}\n\nБүлгүүд:\n${list}\n\nАсуулт: ${text}`;
}

let client: Anthropic | null = null;

export const claudeClassifier: QuestionClassifier = {
  async classify(input) {
    client ??= new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 1 });
    const started = Date.now();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt(input) }],
      thinking: { type: "disabled" },
      output_config: { effort: "low", format: zodOutputFormat(Reply) },
    });
    console.info(
      `[classify] ${MODEL} ${Date.now() - started}ms in=${response.usage.input_tokens} out=${response.usage.output_tokens}`,
    );
    const reply = response.parsed_output;
    if (!reply) throw new Error(`Classifier gave no valid reply (stop: ${response.stop_reason})`);

    const index = reply.group?.match(/^g(\d+)$/)?.[1];
    const group = index ? input.groups[Number(index) - 1] : undefined;
    if (reply.group && !group) throw new Error(`Classifier picked an unknown group: ${reply.group}`);
    const title = reply.title.trim().slice(0, MAX_TITLE_LENGTH);
    if (!group && !title) throw new Error("Classifier gave an empty title");

    return {
      groupId: group?.id ?? null,
      title: title || group!.title,
      intent: reply.intent,
      misconception: reply.misconception?.trim() || null,
      needsReview: reply.needs_review,
      source: "ai",
    };
  },
};
