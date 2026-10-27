import type { Metadata } from "next";
import { HangmanGame } from "./HangmanGame";

export const metadata: Metadata = { title: "Hangman · LevelUp" };

export default function HangmanPage() {
  return <HangmanGame />;
}
