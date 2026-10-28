// Labelled questions for comparing the AI with the rules. Each lesson has the
// groups the class already made; each case says which group a new question
// belongs to (null: it should start a new one) and whether the teacher
// should look at it first. Written the way 6-7th graders type: Cyrillic,
// Latin letters, mixed, typos, no punctuation.

import type { ExistingGroup } from "../../src/lib/ai/classifier";

export type EvalCase = { text: string; group: string | null; review?: boolean };
export type EvalLesson = { lessonTitle: string; groups: ExistingGroup[]; cases: EvalCase[] };

export const lessons: EvalLesson[] = [
  {
    lessonTitle: "Ижил хуваарь",
    groups: [
      { id: "add-denominators", title: "Ижил хуваарь: хуваарийг яагаад нэмдэггүй вэ", examples: ["хуваарийг нь яагаад нэмэхгүй байгаа юм"] },
      { id: "subtract", title: "Ижил хуваарь: хасахдаа яаж хийх вэ", examples: ["5/7 - 2/7 яаж хасах вэ"] },
      { id: "whole", title: "Ижил хуваарь: хариу 1-ээс их гарвал яах вэ", examples: ["3/4 + 3/4 = 6/4 болоод яах вэ"] },
    ],
    cases: [
      { text: "huvaariig ygd nemdeggui ym", group: "add-denominators" },
      { text: "1/5 + 2/5 гэхэд яагаад 3/10 биш юм бэ", group: "add-denominators" },
      { text: "доод тоог нь нэмэхгүй юу", group: "add-denominators" },
      { text: "hasahdaa yaj hiih ve", group: "subtract" },
      { text: "7/9 оос 4/9 хасахад юу гарах вэ", group: "subtract" },
      { text: "6/4 гэдэг зөв хариу мөн үү эсвэл өөрчлөх ёстой юу", group: "whole" },
      { text: "deed too ni dood toonoos ih garval yah ve", group: "whole" },
      { text: "Гурван бутархай нэмж болох уу", group: null },
      { text: "бутархайг үржүүлэх яаж вэ", group: null },
      { text: "багш аа маргааш шалгалт байгаа юу", group: null, review: true },
      { text: "ene hicheel uidtei yum", group: null, review: true },
    ],
  },
  {
    lessonTitle: "Ялгаатай хуваарь",
    groups: [
      { id: "common", title: "Ялгаатай хуваарь: ерөнхий хуваарийг яаж олох вэ", examples: ["ерөнхий хуваарь гэж юу вэ", "аль тоог хуваарь болгох вэ"] },
      { id: "numerator", title: "Ялгаатай хуваарь: хүртвэрийг яагаад үржүүлдэг вэ", examples: ["хуваарийг үржүүлэхэд дээд тоог нь бас үржүүлэх үү"] },
      { id: "straight", title: "Ялгаатай хуваарь: шууд нэмж болохгүй юу", examples: ["1/2 + 1/3 = 2/5 биш юм уу"] },
    ],
    cases: [
      { text: "erunhii huvaari yaj oloh ve", group: "common" },
      { text: "2 болон 3 хуваарьтай бол ямар тоо авах вэ", group: "common" },
      { text: "хамгийн бага ерөнхий хуваарь заавал байх ёстой юу", group: "common" },
      { text: "deed toog ni yagaad urjuuldeg ym", group: "numerator" },
      { text: "хуваарийг 3 дахин ихэсгэвэл дээд нь яах вэ", group: "numerator" },
      { text: "1/2+1/4 = 2/6 зөв үү", group: "straight" },
      { text: "yagaad shuud nemj bolohgui ym", group: "straight" },
      { text: "холимог тоог яаж нэмэх вэ", group: null },
      { text: "хариугаа хураах хэрэгтэй юу", group: null },
      { text: "миний тоглоомын тэжээвэр яагаад өсөхгүй байна", group: null, review: true },
    ],
  },
  {
    lessonTitle: "Хураах",
    groups: [
      { id: "how", title: "Хураах: хураах тоог яаж олох вэ", examples: ["6/8-ийг яаж хураах вэ", "хураахдаа ямар тоогоор хуваах вэ"] },
      { id: "value", title: "Хураах: хураахаар утга өөрчлөгдөх үү", examples: ["хураахаар бутархай багасдаг уу"] },
      { id: "done", title: "Хураах: дахиж хураагдахгүй гэдгийг яаж мэдэх вэ", examples: ["хэзээ зогсох вэ"] },
    ],
    cases: [
      { text: "huraahdaa yamar toogoor huvaah ve", group: "how" },
      { text: "12/18 iig yaj huraah ve", group: "how" },
      { text: "хураахын тулд юуг олох хэрэгтэй вэ", group: "how" },
      { text: "4/6 болон 2/3 тэнцүү юу", group: "value" },
      { text: "huraahaar too jijigrej baigaa yum bish uu", group: "value" },
      { text: "3/7 цааш хураагдах уу", group: "done" },
      { text: "duussan esehiig yaj medeh ve", group: "done" },
      { text: "бутархайг аравтын бутархай болгох яаж вэ", group: null },
      { text: "хураасан хариуг шалгах арга байна уу", group: null },
      { text: "chi teneg", group: null, review: true },
    ],
  },
];
