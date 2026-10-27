import type { GameQuestion } from "@/lib/types";

// Language game questions: Mongolian and English.
// Each question has 3 answers that fit the prompt and 3 that look close but
// do not; every game picks from these lists.

export const monQuestions: GameQuestion[] = [
  {
    id: "mon-1",
    prompt: "Нэр үг",
    correct: ["ном", "сургууль", "морь"],
    wrong: ["гүйх", "улаан", "хурдан"],
    explanation:
      "Нэр үг юмсын нэрийг заана.",
  },
  {
    id: "mon-2",
    prompt: "Үйл үг",
    correct: ["бичих", "унших", "гүйх"],
    wrong: ["ном", "өндөр", "сайхан"],
    explanation:
      "Үйл үг үйлдэл, хөдөлгөөнийг заана.",
  },
  {
    id: "mon-3",
    prompt: "Тоо нэр",
    correct: ["гурав", "арав", "зуу"],
    wrong: ["гурвалжин", "гуйх", "ном"],
    explanation:
      "Тоо нэр тоо ширхэгийг заана.",
  },
];

export const engQuestions: GameQuestion[] = [
  {
    id: "eng-1",
    prompt: "Past Simple хэлбэр",
    correct: ["went", "ate", "saw"],
    wrong: ["go", "eaten", "seeing"],
    explanation:
      "go → went, eat → ate, see → saw. «eaten» нь Past Participle хэлбэр.",
  },
];
