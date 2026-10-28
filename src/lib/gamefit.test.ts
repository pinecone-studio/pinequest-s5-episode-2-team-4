import { describe, expect, it } from "vitest";
import { checkQuestion, suggestGames } from "./gamefit";

const q = (correct: string[], wrong: string[], prompt = "1/2 + 1/4 = ?") => ({
  id: "q",
  prompt,
  correct,
  wrong,
  explanation: "",
});

describe("suggestGames", () => {
  it("puts fast canvas games first for short answers", () => {
    const fits = suggestGames([q(["3/4", "6/8", "9/12"], ["2/6", "1/8", "2/4"])]);
    expect(fits.find((f) => f.id === "snake")?.fit).toBe("best");
  });

  it("prefers card and button games for long text answers", () => {
    const long = ["Чингис хаан", "Тэмүжин", "Их хаан бол"];
    const fits = suggestGames([q(long, ["Хубилай хаан", "Өгэдэй хаан", "Мөнх хаан нь"], "Хэн?")]);
    expect(fits[0].id).not.toBe("snake");
    expect(fits.find((f) => f.id === "snake")?.fit).toBe("poor");
    expect(fits.find((f) => f.id === "race")?.fit).toBe("best");
  });
});

describe("checkQuestion", () => {
  it("accepts a good arithmetic question", () => {
    expect(checkQuestion(q(["3/4", "6/8", "9/12"], ["2/6", "1/8", "2/4"]))).toEqual([]);
  });

  it("needs exactly 3 right and 3 wrong answers without duplicates", () => {
    const messages = checkQuestion(q(["3/4", "3/4"], ["2/6"])).map((i) => i.message);
    expect(messages).toContain("Яг 3 зөв хариулт хэрэгтэй");
    expect(messages).toContain("Яг 3 буруу хариулт хэрэгтэй");
    expect(messages).toContain("Давхардсан хариулт байна");
  });

  it("catches a wrong 'right' answer and a right 'wrong' answer", () => {
    const messages = checkQuestion(q(["3/4", "2/6", "9/12"], ["6/8", "1/8", "2/4"])).map((i) => i.message);
    expect(messages).toContain("Зөв гэсэн хариулт тооцоотой таарахгүй байна");
    expect(messages).toContain("Буруу гэсэн хариулт үнэндээ зөв байна");
  });

  it("only warns when it can't compute a word problem", () => {
    const issues = checkQuestion(q(["5/6", "10/12", "15/18"], ["2/5", "1/6", "2/6"], "Бат 1/2, дараа нь 1/3-ийг уншсан. Нийт?"));
    expect(issues.every((i) => i.level === "warning")).toBe(true);
  });
});
