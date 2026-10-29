"use client"; // Error boundaries must be Client Components

// Catches errors in the root layout, which error.tsx can't. It replaces the
// root layout, so it brings its own <html>, styles, font and saved theme.

import { useEffect } from "react";
import { Nunito } from "next/font/google";
import { Button, buttonClass } from "@/components/ui";
import "./globals.css";
import "./theme.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    try {
      const theme = localStorage.getItem("levelup-theme");
      document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
    } catch {}
  }, []);

  return (
    <html lang="mn" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <title>Алдаа гарлаа · LevelUp</title>
        <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
          <h1 className="text-2xl font-bold md:text-3xl">Алдаа гарлаа</h1>
          <p className="max-w-100 text-ink-muted">
            Уучлаарай, ямар нэг зүйл буруу боллоо. Дахин оролдоно уу.
          </p>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button onClick={() => retry()}>Дахин оролдох</Button>
            {/* A full reload: the root layout itself failed, so client navigation can't be trusted. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={buttonClass({ variant: "secondary" })}>
              Нүүр рүү буцах
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
