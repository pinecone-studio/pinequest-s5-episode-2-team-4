// Colour steps for pixel art: a darker rim or a lighter highlight of the
// same colour, instead of the gradients the smooth drawings used.

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
const toHex = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");

/** `#rrggbb` mixed towards `to` (another `#rrggbb`) by `amount` 0…1. */
export function mix(hex: string, to: string, amount: number) {
  return "#" + [0, 1, 2].map((i) => toHex(channel(hex, i) + (channel(to, i) - channel(hex, i)) * amount)).join("");
}

/** `#rrggbb` a step darker: 0 keeps it, 1 is black. */
export const darken = (hex: string, amount: number) => mix(hex, "#000000", amount);

/** `#rrggbb` a step lighter: 0 keeps it, 1 is white. */
export const lighten = (hex: string, amount: number) => mix(hex, "#ffffff", amount);
