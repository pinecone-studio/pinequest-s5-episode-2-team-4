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
  {
    subtopicId: "same-denominator",
    title: "Ижил хуваарьтай нэмэх",
    approvedByTeacher: true,
    mistake: {
      expression: [frac(2, 7), plus, frac(3, 7), equals, frac(5, 14)],
      explanation: "Хуваарийг нь бас нэмчихлээ",
    },
    steps: ["Хуваарь ижил: 7 хэвээр", "Хүртвэрийг нэмнэ: 2 + 3 = 5", "2/7 + 3/7 = 5/7"],
    practice: [
      {
        id: "sd-p1",
        subtopicId: "same-denominator",
        prompt: "Нийлбэрийг ол",
        expression: [frac(1, 5), plus, frac(2, 5), equals, blank],
        options: [f(3, 10), f(3, 5), f(2, 5), f(1, 5)],
        correctIndex: 1,
      },
      {
        id: "sd-p2",
        subtopicId: "same-denominator",
        prompt: "Нийлбэрийг ол",
        expression: [frac(3, 8), plus, frac(4, 8), equals, blank],
        options: [f(7, 16), f(1, 8), f(7, 8), f(12, 8)],
        correctIndex: 2,
      },
      {
        id: "sd-p3",
        subtopicId: "same-denominator",
        prompt: "Нийлбэрийг ол",
        expression: [frac(4, 9), plus, frac(1, 9), equals, blank],
        options: [f(5, 9), f(5, 18), f(4, 9), f(3, 9)],
        correctIndex: 0,
      },
    ],
  },
  {
    subtopicId: "simplify",
    title: "Бутархай хураах",
    approvedByTeacher: true,
    mistake: {
      expression: [frac(6, 8), equals, frac(3, 8)],
      explanation: "Зөвхөн хүртвэрийг хуваачихлаа",
    },
    steps: ["6 ба 8 хоёулаа 2-т хуваагдана", "6 : 2 = 3, 8 : 2 = 4", "6/8 = 3/4"],
    practice: [
      {
        id: "si-p1",
        subtopicId: "simplify",
        prompt: "Хураа",
        expression: [frac(4, 10), equals, blank],
        options: [f(2, 5), f(4, 5), f(2, 10), f(1, 5)],
        correctIndex: 0,
      },
      {
        id: "si-p2",
        subtopicId: "simplify",
        prompt: "Хураа",
        expression: [frac(9, 12), equals, blank],
        options: [f(3, 12), f(3, 4), f(9, 4), f(1, 3)],
        correctIndex: 1,
      },
      {
        id: "si-p3",
        subtopicId: "simplify",
        prompt: "Хураа",
        expression: [frac(8, 12), equals, blank],
        options: [f(4, 12), f(2, 4), f(2, 3), f(1, 3)],
        correctIndex: 2,
      },
    ],
  },
  {
    subtopicId: "mixed-numbers",
    title: "Холимог тоо ба зөв биш бутархай",
    approvedByTeacher: true,
    mistake: {
      expression: [frac(1, 3, 2), equals, frac(3, 3)],
      explanation: "Бүхэл хэсгийг хуваариар үржүүлээгүй",
    },
    steps: ["Бүхэл × хуваарь: 2 × 3 = 6", "Хүртвэр нэмнэ: 6 + 1 = 7", "2 1/3 = 7/3"],
    practice: [
      {
        id: "mn-p1",
        subtopicId: "mixed-numbers",
        prompt: "Зөв биш бутархай болго",
        expression: [frac(3, 4, 1), equals, blank],
        options: [f(7, 4), f(4, 4), f(13, 4), f(3, 4)],
        correctIndex: 0,
      },
      {
        id: "mn-p2",
        subtopicId: "mixed-numbers",
        prompt: "Холимог тоо болго",
        expression: [frac(7, 2), equals, blank],
        options: [f(1, 2, 2), f(1, 2, 1), f(1, 2, 3), f(1, 3, 3)],
        correctIndex: 2,
      },
      {
        id: "mn-p3",
        subtopicId: "mixed-numbers",
        prompt: "Зөв биш бутархай болго",
        expression: [frac(2, 5, 3), equals, blank],
        options: [f(5, 5), f(17, 5), f(15, 5), f(32, 5)],
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
