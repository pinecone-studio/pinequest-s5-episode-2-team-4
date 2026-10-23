import type { ChatMessage, Lesson } from "@/lib/types";
import { blank, equals, f, frac, minus, plus, times } from "./helpers";

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
  {
    subtopicId: "subtract-fractions",
    title: "Ялгаатай хуваарьтай хасах",
    approvedByTeacher: true,
    mistake: {
      expression: [frac(3, 4), minus, frac(1, 2), equals, frac(2, 2)],
      explanation: "Дээд, доод тоог тусад нь хасчихлаа",
    },
    steps: ["Хуваарь: 4, 2 → 4", "1/2 = 2/4", "3/4 − 2/4 = 1/4"],
    practice: [
      {
        id: "sf-p1",
        subtopicId: "subtract-fractions",
        prompt: "Ялгаврыг ол",
        expression: [frac(2, 3), minus, frac(1, 6), equals, blank],
        options: [f(1, 3), f(1, 2), f(1, 6), f(1, 9)],
        correctIndex: 1,
      },
      {
        id: "sf-p2",
        subtopicId: "subtract-fractions",
        prompt: "Ялгаврыг ол",
        expression: [frac(5, 8), minus, frac(1, 4), equals, blank],
        options: [f(4, 4), f(3, 8), f(1, 2), f(3, 4)],
        correctIndex: 1,
      },
      {
        id: "sf-p3",
        subtopicId: "subtract-fractions",
        prompt: "Ялгаврыг ол",
        expression: [frac(1, 2), minus, frac(1, 5), equals, blank],
        options: [f(1, 3), f(3, 10), f(1, 10), f(2, 7)],
        correctIndex: 1,
      },
    ],
  },
  {
    subtopicId: "multiply-fractions",
    title: "Бутархай үржих",
    approvedByTeacher: true,
    mistake: {
      expression: [frac(2, 3), times, frac(3, 4), equals, frac(8, 9)],
      explanation: "Хөндлөнгөөр нь үржүүлчихлээ",
    },
    steps: [
      "Хүртвэрүүдийг үржүүлнэ: 2 × 3 = 6",
      "Хуваариудыг үржүүлнэ: 3 × 4 = 12",
      "6/12-ыг хураана: 1/2",
    ],
    practice: [
      {
        id: "mf-p1",
        subtopicId: "multiply-fractions",
        prompt: "Үржвэрийг ол",
        expression: [frac(1, 2), times, frac(2, 3), equals, blank],
        options: [f(3, 5), f(1, 3), f(3, 4), f(2, 5)],
        correctIndex: 1,
      },
      {
        id: "mf-p2",
        subtopicId: "multiply-fractions",
        prompt: "Үржвэрийг ол",
        expression: [frac(3, 4), times, frac(2, 5), equals, blank],
        options: [f(5, 9), f(3, 10), f(15, 8), f(6, 9)],
        correctIndex: 1,
      },
      {
        id: "mf-p3",
        subtopicId: "multiply-fractions",
        prompt: "Үржвэрийг ол",
        expression: [frac(2, 5), times, frac(5, 6), equals, blank],
        options: [f(7, 11), f(12, 25), f(1, 3), f(5, 6)],
        correctIndex: 2,
      },
    ],
  },
];

/** What the AI teacher says and suggests per lesson; canned replies are used without an AI key. */
export type HelperScript = {
  opening: ChatMessage[];
  suggestions: string[];
  replies: Record<string, string>;
  fallback: string;
};

const fallback =
  "Сайн асуулт! Хариуг шууд хэлэхгүй, хамт бодъё. Эхлээд жишээн дээрх алхмуудыг дахин харъя.";

export const helperScripts: Record<string, HelperScript> = {
  "same-denominator": {
    opening: [
      {
        from: "helper",
        text: "Сайн уу! Би чиний AI багш. 2/7 + 3/7 дээр хуваарь нь ижил байна. Хуваарийг нь бас нэмэх хэрэгтэй юу? Юу ойлгомжгүй байна, асуугаарай.",
      },
    ],
    suggestions: ["Хуваарь яагаад өөрчлөгдөхгүй вэ?", "Өөр жишээ", "Зургаар"],
    replies: {
      "Хуваарь яагаад өөрчлөгдөхгүй вэ?":
        "Хуваарь нь бялууг хэдэн хэсэгт хуваасныг заадаг. 7 хэсэгт хуваасан бялуунаас 2, дараа нь 3 хэсэг авбал хэсгийн хэмжээ өөрчлөгдөх үү?",
      "Өөр жишээ": "1/5 + 2/5 гэж үзье. Тав хэсгийн 1 дээр тав хэсгийн 2-ыг нэмбэл хэд вэ?",
      Зургаар: "Шоколадыг 7 хэсэгт хуваа. 2 хэсгийг нь, дараа нь 3 хэсгийг нь ид. Нийт хэдэн хэсэг идсэн бэ?",
    },
    fallback,
  },
  "different-denominator": {
    opening: [
      { from: "helper", text: "1/4 + 1/2 дээр 2/6 гарлаа. 1/2 нь хэдэн дөрөвний нэг вэ?" },
      { from: "student", text: "Мэдэхгүй. Хариуг хэлээч" },
      { from: "helper", text: "Хамт олъё! Бялууг 4 хувааж, талыг нь авбал хэдэн хэсэг вэ?" },
      { from: "student", text: "2" },
      { from: "helper", text: "Зөв! 1/2 = 2/4. Тэгвэл 1/4 + 2/4 = ?" },
    ],
    suggestions: ["Ерөнхий хуваарь гэж?", "Өөр жишээ", "Зургаар"],
    replies: {
      "Ерөнхий хуваарь гэж?":
        "Хоёр бутархайн хуваарь хоёулаа хуваагддаг тоо. 2 ба 3-ын хувьд 6.",
      "Өөр жишээ": "1/3 + 1/6 гэж үзье. 1/3 = 2/6 болгоод 2/6 + 1/6 = ?",
      Зургаар:
        "Бялууг 6 хувааж төсөөл. 1/2 нь 3 хэсэг, 1/3 нь 2 хэсэг. Нийт хэдэн хэсэг вэ?",
    },
    fallback:
      "Сайн асуулт! Хариуг шууд хэлэхгүй, хамт бодъё. Эхлээд хуваарийг нь ижил болгоё.",
  },
  simplify: {
    opening: [
      {
        from: "helper",
        text: "Сайн уу! 6/8-ыг хураахдаа дээд, доод тоог хоёуланг нь ижил тоонд хуваадаг. 6 ба 8 хоёулаа аль тоонд хуваагдах вэ?",
      },
    ],
    suggestions: ["Яаж хураах вэ?", "Өөр жишээ", "Хамгийн их ерөнхий хуваагч гэж?"],
    replies: {
      "Яаж хураах вэ?":
        "Хүртвэр, хуваарь хоёуланг нь хуваадаг тоог ол. Дараа нь хоёуланг нь тэр тоонд хуваа. 6/8 дээр 2 тохирох уу?",
      "Өөр жишээ": "10/15-ыг үзье. 10 ба 15 хоёулаа аль тоонд хуваагдах вэ?",
      "Хамгийн их ерөнхий хуваагч гэж?":
        "Хоёр тоог хоёуланг нь хуваадаг хамгийн том тоо. 8 ба 12-ын хувьд хэд вэ гэж бодож байна?",
    },
    fallback,
  },
  "mixed-numbers": {
    opening: [
      {
        from: "helper",
        text: "Сайн уу! 2 1/3 гэдэг нь 2 бүхэл, дээр нь 1/3. Нэг бүхэлд хэдэн гуравны нэг байдаг вэ?",
      },
    ],
    suggestions: ["Яаж зөв биш бутархай болгох вэ?", "Өөр жишээ", "Зургаар"],
    replies: {
      "Яаж зөв биш бутархай болгох вэ?":
        "Бүхлийг хуваариар үржүүлээд хүртвэр дээр нэмнэ. 2 1/3 дээр 2 × 3 хэд вэ?",
      "Өөр жишээ": "1 3/4-ийг үзье. Нэг бүхэлд 4 дөрөвний нэг бий. Нийт хэдэн дөрөвний нэг вэ?",
      Зургаар: "2 бүтэн пицца, дээр нь гуравны нэг. Пицца бүрийг 3 хэсэглэвэл нийт хэдэн хэсэг вэ?",
    },
    fallback,
  },
  "subtract-fractions": {
    opening: [
      {
        from: "helper",
        text: "Сайн уу! 3/4 − 1/2-ыг бодохоор эхлээд хуваарийг нь ижил болгоно. 1/2 нь хэдэн дөрөвний нэг вэ?",
      },
    ],
    suggestions: ["Яагаад хуваарийг ижил болгох вэ?", "Өөр жишээ", "Зургаар"],
    replies: {
      "Яагаад хуваарийг ижил болгох вэ?":
        "Ижил хэмжээтэй хэсгүүдийг л хасаж болно. Дөрөвний нэг ба хоёрны нэг өөр хэмжээтэй. Яаж ижил болгох вэ?",
      "Өөр жишээ": "5/6 − 1/3-ыг үзье. 1/3 нь хэдэн зургааны нэг вэ?",
      Зургаар: "Бялууг 4 хувааж, 3 хэсэг нь байна. Хагасыг нь (2 хэсэг) идвэл хэдэн хэсэг үлдэх вэ?",
    },
    fallback,
  },
  "multiply-fractions": {
    opening: [
      {
        from: "helper",
        text: "Сайн уу! Үржихдээ хуваарийг ижил болгох шаардлагагүй. Дээд тоог дээд тоогоор, доод тоог доод тоогоор үржүүлнэ. 2/3 × 3/4 дээр дээд тоонуудын үржвэр хэд вэ?",
      },
    ],
    suggestions: ["Яагаад ерөнхий хуваарь хэрэггүй вэ?", "Өөр жишээ", "Дараа нь хураах уу?"],
    replies: {
      "Яагаад ерөнхий хуваарь хэрэггүй вэ?":
        "Үржвэр гэдэг нь \"-ын хэсэг\" гэсэн үг. 3/4-ийн 2/3 гэж бодоорой. Хэсгийн хэсгийг авахад хуваарь ижил байх шаардлагагүй.",
      "Өөр жишээ": "1/2 × 2/3-ыг үзье. Дээд тоонууд: 1 × 2 = ? Доод тоонууд: 2 × 3 = ?",
      "Дараа нь хураах уу?": "Тийм! 6/12 гарвал 6 ба 12 хоёулаа аль тоонд хуваагдахыг бод.",
    },
    fallback,
  },
};
