// Colours the game canvases draw with. The games are dark scenes, so these
// sit next to the light design tokens in globals.css rather than replacing them.
export const GAME_COLORS = {
  ink: "#f6f3ff",
  inkMuted: "#b4a9e3",
  violet: "#5b00ed",
  violetLight: "#8b5cff",
  magenta: "#e30ba6",
  good: "#34d399",
  bad: "#ff4d6d",
  gold: "#ffcf5a",
  night: "#0d0a22",
} as const;

let family: string | undefined;

/**
 * Canvas font string in the page's font. Canvas can't read CSS variables, so
 * this takes the resolved family (set by next/font on <body>) once.
 */
export function gameFont(weight: number, size: number) {
  family ??= getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  return `${weight} ${size}px ${family}`;
}
