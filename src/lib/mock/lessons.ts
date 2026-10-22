import type { ChatMessage, Lesson } from "@/lib/types";
import { blank, equals, f, frac, plus } from "./helpers";

export const lessons: Lesson[] = [
  {
    subtopicId: "different-denominator",
    title: "Ялгаатай хуваарьтай нэмэх",
    approvedByTeacher: true,
    mistake: {
      expression: [frac(1, 2), plus, frac(1, 3), equals, frac(2, 5)],
      explanation: "Дээд, доод тоог тусад нь нэмчихлээ",
    },
    steps: [
      "Хуваарь: 2, 3 → 6",
      "1/2 = 3/6, 1/3 = 2/6",
      "3/6 + 2/6 = 5/6",
    ],
    practice: [
      {
        id: "p1",
        subtopicId: "different-denominator",
        prompt: "Нийлбэрийг ол",
        expression: [frac(1, 3), plus, frac(1, 6), equals, blank],
        options: [f(2, 9), f(1, 2), f(2, 6), f(1, 9)],
        correctIndex: 1,
      },
      {
        id: "p2",
        subtopicId: "different-denominator",
        prompt: "Нийлбэрийг ол",
        expression: [frac(1, 4), plus, frac(1, 2), equals, blank],
        options: [f(2, 6), f(3, 4), f(2, 4), f(1, 8)],
        correctIndex: 1,
      },
      {
        id: "p3",
        subtopicId: "different-denominator",
        prompt: "Нийлбэрийг ол",
        expression: [frac(2, 5), plus, frac(1, 10), equals, blank],
        options: [f(3, 15), f(1, 2), f(3, 10), f(2, 15)],
        correctIndex: 1,
      },
    ],
  },
];

/** Opening conversation of the AI helper on the lesson page. */
export const helperConversation: ChatMessage[] = [
  { from: "helper", text: "1/4 + 1/2 дээр 2/6 гарлаа. 1/2 нь хэдэн дөрөвний нэг вэ?" },
  { from: "student", text: "Мэдэхгүй. Хариуг хэлээч" },
  {
    from: "helper",
    text: "Хамт олъё! Бялууг 4 хувааж, талыг нь авбал хэдэн хэсэг вэ?",
  },
  { from: "student", text: "2" },
  { from: "helper", text: "Зөв! 1/2 = 2/4. Тэгвэл 1/4 + 2/4 = ?" },
];

export const helperSuggestions = ["Ерөнхий хуваарь гэж?", "Өөр жишээ", "Зургаар"];

/** Canned replies until a real AI API is connected. */
export const helperReplies: Record<string, string> = {
  "Ерөнхий хуваарь гэж?":
    "Хоёр бутархайн хуваарь хоёулаа хуваагддаг тоо. 2 ба 3-ын хувьд 6.",
  "Өөр жишээ": "1/3 + 1/6 гэж үзье. 1/3 = 2/6 болгоод 2/6 + 1/6 = ?",
  Зургаар: "Бялууг 6 хувааж төсөөл. 1/2 нь 3 хэсэг, 1/3 нь 2 хэсэг. Нийт хэдэн хэсэг вэ?",
};

export const helperFallbackReply =
  "Сайн асуулт! Хариуг шууд хэлэхгүй, хамт бодъё. Эхлээд хуваарийг нь ижил болгоё.";
