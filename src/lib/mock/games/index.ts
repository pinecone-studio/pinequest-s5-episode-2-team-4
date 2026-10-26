import type { GameSubject } from "@/lib/types";
import { engQuestions, monQuestions } from "./languages";
import { geomQuestions, hard7Questions, mathQuestions, modulQuestions, nemhasQuestions } from "./math";
import { bioQuestions, chemQuestions, geoQuestions, histQuestions, physQuestions } from "./sciences";

/** Game subjects in menu order. Every game reads the same question sets. */
export const gameSubjects: GameSubject[] = [
  { id: "nemhas", title: "Бүхэл тоо: нэмэх, хасах", questions: nemhasQuestions },
  { id: "modul", title: "Тооны модуль", questions: modulQuestions },
  { id: "hard7", title: "7-р анги · хэцүү", questions: hard7Questions },
  { id: "math", title: "Бутархай", questions: mathQuestions },
  { id: "geom", title: "Геометр", questions: geomQuestions },
  { id: "mon", title: "Монгол хэл", questions: monQuestions },
  { id: "hist", title: "Монголын түүх", questions: histQuestions },
  { id: "bio", title: "Биологи", questions: bioQuestions },
  { id: "geo", title: "Газарзүй", questions: geoQuestions },
  { id: "phys", title: "Физик", questions: physQuestions },
  { id: "chem", title: "Хими", questions: chemQuestions },
  { id: "eng", title: "Англи хэл", questions: engQuestions },
];
