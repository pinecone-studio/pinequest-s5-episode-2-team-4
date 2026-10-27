import type { GameQuestion } from "@/lib/types";

// History and science game questions.
// Each question has 3 answers that fit the prompt and 3 that look close but
// do not; every game picks from these lists.

export const histQuestions: GameQuestion[] = [
  {
    id: "hist-1",
    prompt: "XIII зуунд болсон үйл явдлын он",
    correct: ["1206", "1227", "1240"],
    wrong: ["1911", "1921", "1990"],
    explanation:
      "XIII зуун бол 1201–1300 он.",
  },
  {
    id: "hist-2",
    prompt: "XX зуунд болсон үйл явдлын он",
    correct: ["1911", "1921", "1990"],
    wrong: ["1206", "1240", "1368"],
    explanation:
      "XX зуун бол 1901–2000 он.",
  },
  {
    id: "hist-3",
    prompt: "Их Монгол Улсын хаад",
    correct: ["Чингис", "Өгэдэй", "Мөнх"],
    wrong: ["Наполеон", "Цезарь", "Петр"],
    explanation:
      "Чингис, Өгэдэй, Мөнх нар Их Монгол Улсын хаад байсан.",
  },
];

export const bioQuestions: GameQuestion[] = [
  {
    id: "bio-1",
    prompt: "Хөхтөн амьтан",
    correct: ["халим", "сарьсан багваахай", "тэмээ"],
    wrong: ["оцон шувуу", "матар", "акул"],
    explanation:
      "Хөхтөн амьтан төлөө сүүгээр хооллодог. Халим, сарьсан багваахай ч хөхтөн.",
  },
  {
    id: "bio-2",
    prompt: "Шавж",
    correct: ["шоргоолж", "эрвээхэй", "царцаа"],
    wrong: ["аалз", "хилэнц", "сам хорхой"],
    explanation:
      "Шавж 6 хөлтэй. Аалз, хилэнц 8 хөлтэй, сам хорхой хавч хэлбэртэн.",
  },
];

export const geoQuestions: GameQuestion[] = [
  {
    id: "geo-1",
    prompt: "Монголын нуур",
    correct: ["Хөвсгөл", "Увс", "Хяргас"],
    wrong: ["Байгаль", "Иссык-Куль", "Балхаш"],
    explanation:
      "Байгаль Орост, Иссык-Куль Киргизэд, Балхаш Казахстанд оршдог.",
  },
  {
    id: "geo-2",
    prompt: "Ази тивийн улс",
    correct: ["Япон", "Энэтхэг", "Вьетнам"],
    wrong: ["Египет", "Бразил", "Франц"],
    explanation:
      "Египет Африкт, Бразил Өмнөд Америкт, Франц Европт байдаг.",
  },
];

export const physQuestions: GameQuestion[] = [
  {
    id: "phys-1",
    prompt: "Энергийн нэгж",
    correct: ["джоуль", "калори", "кВт·цаг"],
    wrong: ["ньютон", "ватт", "паскаль"],
    explanation:
      "Ньютон нь хүч, ватт нь чадал, паскаль нь даралтын нэгж.",
  },
];

export const chemQuestions: GameQuestion[] = [
  {
    id: "chem-1",
    prompt: "Металл",
    correct: ["төмөр", "зэс", "алт"],
    wrong: ["хүчилтөрөгч", "азот", "хүхэр"],
    explanation:
      "Хүчилтөрөгч, азот, хүхэр нь металл бус элемент.",
  },
];
