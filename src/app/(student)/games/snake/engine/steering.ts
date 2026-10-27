import { toWorld } from "../../_lib/canvas";
import type { Point, Snake } from "./types";

const KEYS: Record<string, number> = { ArrowRight: 0, ArrowDown: Math.PI / 2, ArrowLeft: Math.PI, ArrowUp: -Math.PI / 2 };

/** Where the player wants the snake to go: towards the finger/mouse, or an arrow key's direction. */
export class Steering {
  private pointer: Point | null = null;
  private keyAngle: number | null = null;

  /** Heading the snake should turn to, or null to keep going straight. */
  wanted(snake: Snake): number | null {
    if (!this.pointer) return this.keyAngle;
    if (Math.hypot(this.pointer.x - snake.x, this.pointer.y - snake.y) <= 8) return null;
    return Math.atan2(this.pointer.y - snake.y, this.pointer.x - snake.x);
  }

  release() {
    this.pointer = null;
  }

  /** Listens on the canvas and window; returns a function that removes the listeners. */
  bind(canvas: HTMLCanvasElement, scale: () => number, active: () => boolean) {
    const down = (e: PointerEvent) => {
      this.pointer = toWorld(canvas, scale(), e);
      this.keyAngle = null;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.buttons) this.pointer = toWorld(canvas, scale(), e);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") this.pointer = null;
    };
    const leave = () => this.release();
    const key = (e: KeyboardEvent) => {
      if (!(e.key in KEYS) || !active()) return;
      this.keyAngle = KEYS[e.key];
      this.pointer = null;
      e.preventDefault();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointerleave", leave);
    window.addEventListener("keydown", key);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointerleave", leave);
      window.removeEventListener("keydown", key);
    };
  }
}
