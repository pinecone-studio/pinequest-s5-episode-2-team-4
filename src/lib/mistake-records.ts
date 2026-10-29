export type MistakeRecord = {
  source: "math" | "battle";
  questionId: string;
  answer?: number | string;
  resolved: boolean;
};
export type MistakeRecords = Record<string, MistakeRecord>;
export const mistakeKey = (source: MistakeRecord["source"], questionId: string) => `${source}:${questionId}`;

/** Only wrong answers create entries; subsequent correct answers resolve them. */
export function recordMistake(
  previous: MistakeRecords | undefined,
  source: MistakeRecord["source"],
  questionId: string,
  answer: number | string,
  correct: boolean,
): MistakeRecords {
  const records = previous ?? {};
  const key = mistakeKey(source, questionId);
  if (correct && !records[key]) return records;
  return { ...records, [key]: { source, questionId, answer: correct ? records[key]?.answer : answer, resolved: correct } };
}
