"use client";

import { useCallback, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * Reads English text aloud with the browser's built-in voices. Voice
 * quality depends on the device; `supported` is false where there is none
 * (and on the server).
 */
export function useSpeech() {
  const supported = useSyncExternalStore(
    noSubscribe,
    () => "speechSynthesis" in window,
    () => false,
  );

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    const english = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("en"));
    if (english) utterance.voice = english;
    synth.speak(utterance);
  }, []);

  return { supported, speak };
}
