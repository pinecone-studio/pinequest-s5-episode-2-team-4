import type { SignalLevel, UnderstandingSignal } from "@/lib/types";

// One letter per student №01–№32: G got it, U unsure, L lost, - no signal.
const codes: Record<string, SignalLevel> = { G: "got", U: "unsure", L: "lost" };
const signalsFor = (subtopicId: string, time: string, s: string) =>
  s.split("").flatMap((c, i): UnderstandingSignal[] =>
    codes[c] ? [{ studentNo: i + 1, subtopicId, level: codes[c], time }] : [],
  );

/** The demo class's lessons today: two subtopics, so the dashboard shows two cards. */
export const signals: UnderstandingSignal[] = [
  ...signalsFor("different-denominator", "09:40", "GLUG-ULGLGUUGLGL-GGLGUGLG-LGUG-L"),
  ...signalsFor("simplify", "11:20", "GGUG-GGLUGUGG-GGUGULGGGU-GUGUG-G"),
];
