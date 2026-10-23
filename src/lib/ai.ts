// Gemini calls for the AI teacher and the teacher's exercise suggestions.
// Server only: import it from Server Functions or src/lib/data.ts, never from
// a Client Component (the API key must stay on the server).
//
// Without GEMINI_API_KEY, or when a call fails or is slow, every function
// returns undefined and the caller falls back to canned mock content.
// Only lesson content and the student's question are sent: never names,
// usernames or class codes.

import { GoogleGenAI } from "@google/genai";
import { expressionToText } from "./fractions";
import type { ChatMessage, ExerciseItem, Lesson, Subtopic } from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const TIMEOUT_MS = 15_000;

let client: GoogleGenAI | undefined;
function gemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export function aiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Plain-text version of the lesson's mistake, e.g. "1/2 + 1/3 = 2/5". */
function expressionText(lesson: Lesson) {
  return expressionToText(lesson.mistake.expression);
}

function tutorInstruction(subtopic: Subtopic, lesson: Lesson) {
  return [
    "Чи 7-р ангийн сурагчид математик заадаг эелдэг, тэвчээртэй багш.",
    `Одоогийн хичээл: "${lesson.title}" (${subtopic.title}).`,
    `Сурагчдын түгээмэл алдаа: ${expressionText(lesson)}. ${lesson.mistake.explanation}.`,
    `Зөв алхмууд: ${lesson.steps.join("; ")}.`,
    "",
    "Дүрэм:",
    "- Зөвхөн монгол хэлээр, энгийн үгээр, 1–3 өгүүлбэрээр хариул.",
    "- Хариуг шууд бүү хэл. Жижиг асуулт асууж, сурагч өөрөө олоход нь тусал. Сурагч хариугаа хэлбэл зөв эсэхийг нь хэлж магтаад дараагийн алхмыг асуу.",
    "- Бутархайг 3/4 гэж бич. Markdown, жагсаалт бүү ашигла.",
    "- Зөвхөн энэ хичээлийн сэдвээр ярь. Өөр сэдвээр асуувал зөөлөн татгалзаад хичээл рүү буцаа.",
    "- Сурагчийн хувийн мэдээлэл бүү асуу.",
  ].join("\n");
}

/** The AI teacher's reply to the student's latest message, or undefined. */
export async function tutorReply({
  subtopic,
  lesson,
  history,
}: {
  subtopic: Subtopic;
  lesson: Lesson;
  /** The conversation so far, ending with the student's new message. */
  history: ChatMessage[];
}): Promise<string | undefined> {
  const ai = gemini();
  if (!ai) return undefined;
  // Gemini expects the conversation to start with the user.
  const first = history.findIndex((m) => m.from === "student");
  if (first < 0) return undefined;
  const turns = history.slice(first);
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: turns.map((m) => ({
        role: m.from === "student" ? "user" : "model",
        parts: [{ text: m.text }],
      })),
      config: {
        systemInstruction: tutorInstruction(subtopic, lesson),
        maxOutputTokens: 400,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });
    const text = response.text?.trim();
    return text ? text.slice(0, 800) : undefined;
  } catch (error) {
    console.error("Gemini tutor reply failed:", error);
    return undefined;
  }
}

/** New practice exercises for a subtopic, or undefined. */
export async function suggestExercises({
  subtopic,
  lesson,
  count = 5,
}: {
  subtopic: Subtopic;
  lesson?: Lesson;
  count?: number;
}): Promise<ExerciseItem[] | undefined> {
  const ai = gemini();
  if (!ai) return undefined;
  const prompt = [
    `7-р ангийн сурагчдад "${subtopic.lessonTitle}" сэдвээр ${count} дасгал зохио.`,
    lesson
      ? `Сурагчид ихэвчлэн ингэж алддаг: ${expressionText(lesson)} (${lesson.mistake.explanation}).`
      : "",
    "Эхнийх нь хялбар, сүүлийнх нь бодлого (үгэн өгүүлбэр) байг.",
    'Асуулт монгол хэлээр, жишээ нь "2/3 + 1/4 = ?". Хариу нь хамгийн хялбар бутархай, жишээ нь "11/12" эсвэл "1 1/2".',
  ].join("\n");
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
          },
        },
        maxOutputTokens: 2000,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });
    const items: unknown = JSON.parse(response.text ?? "null");
    if (!Array.isArray(items)) return undefined;
    const clean = items
      .filter(
        (i): i is ExerciseItem =>
          typeof i?.question === "string" && typeof i?.answer === "string",
      )
      .map((i) => ({ question: i.question.trim().slice(0, 200), answer: i.answer.trim().slice(0, 30) }))
      .filter((i) => i.question && i.answer)
      .slice(0, count);
    return clean.length > 0 ? clean : undefined;
  } catch (error) {
    console.error("Gemini exercise suggestions failed:", error);
    return undefined;
  }
}
