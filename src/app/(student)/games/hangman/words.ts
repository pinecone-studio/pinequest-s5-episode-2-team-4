export const HANGMAN_WORDS = [
  { word: "BOOK", translation: "Ном" },
  { word: "TREE", translation: "Мод" },
  { word: "BIRD", translation: "Шувуу" },
  { word: "FISH", translation: "Загас" },
  { word: "APPLE", translation: "Алим" },
  { word: "BANANA", translation: "Гадил" },
  { word: "ORANGE", translation: "Жүрж" },
  { word: "SCHOOL", translation: "Сургууль" },
  { word: "TEACHER", translation: "Багш" },
  { word: "STUDENT", translation: "Сурагч" },
  { word: "FRIEND", translation: "Найз" },
  { word: "FAMILY", translation: "Гэр бүл" },
  { word: "MOTHER", translation: "Ээж" },
  { word: "FATHER", translation: "Аав" },
  { word: "SISTER", translation: "Эгч, охин дүү" },
  { word: "BROTHER", translation: "Ах, эрэгтэй дүү" },
  { word: "WINDOW", translation: "Цонх" },
  { word: "GARDEN", translation: "Цэцэрлэг" },
  { word: "FLOWER", translation: "Цэцэг" },
  { word: "ANIMAL", translation: "Амьтан" },
  { word: "RABBIT", translation: "Туулай" },
  { word: "TIGER", translation: "Бар" },
  { word: "HORSE", translation: "Морь" },
  { word: "WATER", translation: "Ус" },
  { word: "SUMMER", translation: "Зун" },
  { word: "WINTER", translation: "Өвөл" },
  { word: "MOUNTAIN", translation: "Уул" },
  { word: "RAINBOW", translation: "Солонго" },
  { word: "ELEPHANT", translation: "Заан" },
  { word: "HOSPITAL", translation: "Эмнэлэг" },
  { word: "BUTTERFLY", translation: "Эрвээхэй" },
  { word: "ADVENTURE", translation: "Адал явдал" },
  { word: "BEAUTIFUL", translation: "Үзэсгэлэнтэй" },
  { word: "KNOWLEDGE", translation: "Мэдлэг" },
  { word: "DICTIONARY", translation: "Толь бичиг" },
  { word: "BASKETBALL", translation: "Сагсан бөмбөг" },
  { word: "FRIENDSHIP", translation: "Нөхөрлөл" },
  { word: "PLAYGROUND", translation: "Тоглоомын талбай" },
  { word: "ENVIRONMENT", translation: "Хүрээлэн буй орчин" },
  { word: "INFORMATION", translation: "Мэдээлэл" },
  { word: "CELEBRATION", translation: "Баяр ёслол" },
  { word: "IMAGINATION", translation: "Төсөөлөл" },
] as const;

export const MAX_LEVEL = 8;

/** Levels 1–7 have 4–10 letters; the final level has 11-letter words. */
export function wordsForLevel(level: number) {
  const length = Math.min(MAX_LEVEL, Math.max(1, level)) + 3;
  return HANGMAN_WORDS.flatMap((entry, index) => entry.word.length === length ? [{ ...entry, index }] : []);
}
