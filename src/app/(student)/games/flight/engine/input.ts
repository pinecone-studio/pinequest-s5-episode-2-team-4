const FLAP_KEYS = new Set([" ", "ArrowUp", "w"]);

/** Tap the field, or press Space / ↑ / W, to flap. Returns a function that removes the listeners. */
export function bindFlap(canvas: HTMLCanvasElement, canFlap: () => boolean, flap: () => void) {
  const onPointer = (e: PointerEvent) => {
    e.preventDefault();
    flap();
  };
  const onKey = (e: KeyboardEvent) => {
    if (!FLAP_KEYS.has(e.key) || !canFlap()) return;
    // Space would otherwise scroll the page.
    e.preventDefault();
    flap();
  };
  canvas.addEventListener("pointerdown", onPointer);
  window.addEventListener("keydown", onKey);
  return () => {
    canvas.removeEventListener("pointerdown", onPointer);
    window.removeEventListener("keydown", onKey);
  };
}
