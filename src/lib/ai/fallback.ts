// Demo content for when Claude isn't set up or fails, so every teacher page
// still works in a demo. It's about adding fractions with different
// denominators, the topic the rest of the app's mock data uses.

import { gameSubjects } from "@/lib/mock/games";
import type { BookText, GameQuestion, Recognition, ReelScript } from "@/lib/types";

export function demoRecognition(topic: string): Recognition {
  return {
    topic: topic || "Ялгаатай хуваарьтай бутархай нэмэх",
    concepts: [
      { title: "Ерөнхий хуваарь", explanation: "Хоёр хуваарь хоёулаа хуваагддаг хамгийн бага тоо. 2 ба 3-ын хувьд 6." },
      { title: "Бутархайг өргөтгөх", explanation: "Хүртвэр, хуваарийг ижил тоогоор үржүүлэхэд утга нь өөрчлөгдөхгүй: 1/2 = 3/6." },
      { title: "Нэмэх", explanation: "Хуваарь ижил болсны дараа хүртвэрүүдийг нэмж, хуваарийг хэвээр үлдээнэ." },
    ],
    examples: [
      { problem: "1/2 + 1/3", solution: "1/2 = 3/6, 1/3 = 2/6, 3/6 + 2/6 = 5/6", answer: "5/6" },
      { problem: "1/4 + 2/3", solution: "1/4 = 3/12, 2/3 = 8/12, 3/12 + 8/12 = 11/12", answer: "11/12" },
    ],
    mistakes: [
      { wrong: "1/2 + 1/3 = 2/5", why: "Хүртвэр, хуваарийг тусад нь нэмчихсэн." },
      { wrong: "1/2 + 1/3 = 2/6", why: "Хуваарийг ижил болгосон ч хүртвэрийг өргөтгөөгүй." },
    ],
    formulas: ["1/2 + 1/3 = 5/6", "a/b + c/d = (ad + cb)/bd"],
  };
}

export function demoScript(topic: string): ReelScript {
  return {
    title: topic || "Ялгаатай хуваарьтай нэмэх",
    sections: [
      { kind: "hook", caption: "Пиццаны хагас + гуравны нэг?", say: "Пиццаны хагас дээр гуравны нэгийг нэмбэл хэд болох вэ? Хоёр тав гэж бодсон уу? Хамт шалгая." },
      { kind: "step", caption: "Хуваарийг ижил болго", say: "Эхлээд хоёр бутархайн хуваарийг ижил болгоно. Хоёр ба гурав хоёулаа зургаад хуваагдана.", formula: "1/2 = 3/6" },
      { kind: "step", caption: "Хоёр дахь бутархай", say: "Гуравны нэгийг зургаагийн хоёр болгоно. Хүртвэр, хуваарийг хоёуланг нь хоёроор үржүүлнэ.", formula: "1/3 = 2/6" },
      { kind: "example", caption: "Одоо нэмье", say: "Хуваарь ижил боллоо. Хүртвэрүүдийг нэмээд хуваарийг хэвээр үлдээнэ. Гурав дээр хоёр, тав.", formula: "3/6 + 2/6 = 5/6" },
      { kind: "question", caption: "Чиний ээлж", say: "Одоо чи бодоорой: дөрөвний нэг дээр хоёрны нэгийг нэмбэл хэд вэ? Хариугаа тоглоомон дээр шалгаарай!", formula: "1/4 + 1/2 = 3/4" },
    ],
  };
}

export function demoBook(topic: string): BookText {
  return {
    blocks: [
      { heading: topic || "Ялгаатай хуваарьтай бутархай нэмэх", body: "Хуваарь нь ялгаатай бутархайг шууд нэмж болохгүй. Эхлээд тэдгээрийг ижил хуваарьтай болгоно." },
      { heading: "Дүрэм", body: "1) Ерөнхий хуваарийг ол. 2) Бутархай бүрийг тэр хуваарьтай болгож өргөтгө. 3) Хүртвэрүүдийг нэмж, хуваарийг хэвээр үлдээ. 4) Боломжтой бол хураа.", formula: "1/2 + 1/3 = 3/6 + 2/6 = 5/6" },
      { heading: "Жишээ", body: "1/4 + 2/3. Ерөнхий хуваарь 12. 1/4 = 3/12, 2/3 = 8/12. Нийлбэр 11/12.", formula: "1/4 + 2/3 = 11/12" },
      { heading: "Анхаар", body: "Хүртвэр, хуваарийг тусад нь нэмэх нь түгээмэл алдаа: 1/2 + 1/3 ≠ 2/5." },
    ],
  };
}

/** Questions from the existing game sets: the subject's own, else fractions. */
export function demoQuestions(subject: string | undefined, count: number): Omit<GameQuestion, "id">[] {
  const set =
    gameSubjects.find((s) => s.id === subject)?.questions ??
    gameSubjects.find((s) => s.id === "math")?.questions ??
    gameSubjects[0].questions;
  return set.slice(0, count).map(({ prompt, correct, wrong, explanation }) => ({
    prompt,
    correct: correct.map((a) => (typeof a === "string" ? a : a.name)).slice(0, 3),
    wrong: wrong.map((a) => (typeof a === "string" ? a : a.name)).slice(0, 3),
    explanation,
  }));
}
