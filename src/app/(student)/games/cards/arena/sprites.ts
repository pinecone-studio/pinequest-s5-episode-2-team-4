// The monster is drawn from a 16-column pixel grid: each letter is a palette
// colour, "." is transparent. Pets use their real sprite images instead.

const MONSTER = [
  "..k..........k..", ".kmk........kmk.", ".kmmk......kmmk.", "..kmmkkkkkkmmk..",
  "..kmmmmmmmmmmk..", ".kmmmmmmmmmmmmk.", ".kmmrrmmmmrrmmk.", ".kmmrkmmmmrkmmk.",
  "kmmmmmmmmmmmmmmk", "kmmmkwkwkwkmmmmk", "kmmmmkkkkkkmmmmk", ".kmddmmmmmmddmk.",
  "..kmmk.kk.kmmk..", "...kk......kk...",
];

type Palette = Record<string, string>;

const CALM: Palette = { k: "#1b1033", m: "#7b5cd6", d: "#4c3594", r: "#ff5d8f", w: "#fff6e0" };
const RAGE: Palette = { ...CALM, m: "#b8457a", d: "#7d2350", r: "#ffe14d" };
const FLASH: Palette = { k: "#fff", m: "#fff", d: "#fff", r: "#fff", w: "#fff" };

function render(grid: string[], palette: Palette, cell: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 16 * cell;
  canvas.height = grid.length * cell;
  const ctx = canvas.getContext("2d");
  grid.forEach((row, y) =>
    [...row.padEnd(16, ".")].forEach((ch, x) => {
      if (!ctx || !palette[ch]) return;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }),
  );
  return canvas;
}

export type MonsterSprites = { calm: HTMLCanvasElement; rage: HTMLCanvasElement; hit: HTMLCanvasElement };

export function monsterSprites(cell = 6): MonsterSprites {
  return { calm: render(MONSTER, CALM, cell), rage: render(MONSTER, RAGE, cell), hit: render(MONSTER, FLASH, cell) };
}
