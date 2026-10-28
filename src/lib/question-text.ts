// Text helpers for anonymous questions. The student's own text is always kept
// as typed; the normalized form is only for spotting duplicates.

/** Longest question a student can send. */
export const MAX_QUESTION_LENGTH = 500;

/**
 * Lowercase, punctuation and repeated spaces removed, Cyrillic and Latin kept
 * as they are: "1/2 + 1/3 ЯГААД 2/5 биш вэ??" → "1/2 + 1/3 ягаад 2/5 биш вэ".
 * Fractions and signs (/ + - =) stay, since they change what is asked.
 */
export function normalizeQuestion(text: string) {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}/+\-=−\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The text as it will be stored, or null when there is nothing to ask. */
export function cleanQuestion(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim().slice(0, MAX_QUESTION_LENGTH);
  return normalizeQuestion(trimmed) ? trimmed : null;
}
