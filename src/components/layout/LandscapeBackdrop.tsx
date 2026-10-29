import "./LandscapeBackdrop.css";

/**
 * A pixel-art mountain lake behind student and teacher pages (drawn in landscape.ts,
 * a day lake or a night one by theme). It is fixed to the screen, so the page
 * scrolls over it.
 */
export function LandscapeBackdrop() {
  return <div aria-hidden="true" className="landscape pointer-events-none fixed inset-0 -z-10" />;
}
