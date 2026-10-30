import type { Metadata } from "next";
import localFont from "next/font/local";
import { HangmanGame } from "./HangmanGame";

const pixelFont = localFont({
  src: "./fonts/Tiny5.ttf",
  variable: "--font-hangman-pixel",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = { title: "Hangman · LevelUp" };

export default function HangmanPage() {
  return <div className={pixelFont.variable}><HangmanGame /></div>;
}
