"use client";

import { useEffect, useRef } from "react";
import type { GameAnswer } from "@/lib/types";
import { answerLabel, drawAnswer } from "../_lib/shapes";

/** An answer in HTML: plain text, or a small canvas for a shape (with its name for screen readers). */
export function AnswerView({ answer }: { answer: GameAnswer }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || typeof answer === "string") return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.height = 64 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 32 * dpr, 32 * dpr);
    drawAnswer(ctx, answer);
  }, [answer]);

  if (typeof answer === "string") return <span>{answer}</span>;
  return <canvas ref={ref} role="img" aria-label={answerLabel(answer)} className="size-16" />;
}
