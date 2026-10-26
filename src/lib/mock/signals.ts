import type { SignalLevel, UnderstandingSignal } from "@/lib/types";

// One letter per student №01–№32: G got it, U unsure, L lost, - no signal.
const codes: Record<string, SignalLevel> = { G: "got", U: "unsure", L: "lost" };
const signalsFor = (subtopicId: string, time: string, s: string) =>
  s.split("").flatMap((c, i): UnderstandingSignal[] =>
    codes[c] ? [{ studentNo: i + 1, subtopicId, level: codes[c], time }] : [],
  );

export const signals: UnderstandingSignal[] = [
  ...signalsFor("different-denominator", "09:40", "GLUG-ULGLGUUGLGL-GGLGUGLG-LGUG-L"),
  ...signalsFor("simplify", "Өчигдөр", "GGUG-GGLUGUGG-GGUGULGGGU-GUGUG-G"),
  ...signalsFor("mixed-numbers", "Өчигдөр", "GUGG-GUGGGLGG-GGGUGGGGGL-GGGG-GG"),
  ...signalsFor("same-denominator", "Даваа", "GGGG-GGGGGUGG-GGGGGGGGGU-GGGGG-G"),
];
