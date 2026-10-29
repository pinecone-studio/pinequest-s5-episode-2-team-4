/*
 * The pixel-art mountain lake behind student and teacher pages (LandscapeBackdrop),
 * drawn as an SVG: a dithered sky with a moon, a big mountain, pine forests,
 * a lake, and trees and rocks framing the sides on wide screens. Shapes come
 * from seeded numbers, so the scene is the same on every visit. It is served
 * as a cached image per theme (src/app/landscape/[file]/route.ts) instead of
 * being inlined into every page.
 */

/** Drawn in a 2400×900 box of 8-unit pixels, scaled to cover the screen from the bottom centre. */
const W = 2400;
const H = 900;
const P = 8;
const COLS = W / P;

/** Pseudo-random numbers from a seed, the same on every render. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const snap = (n: number) => Math.round(n / P) * P;
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h-${w}z`;

/** A mountain range: the top of each pixel column, the highest of a few triangular peaks. */
function range(base: number, peaks: [x: number, height: number, halfWidth: number][], seed: number) {
  const rnd = seeded(seed);
  return Array.from({ length: COLS }, (_, i) => {
    const x = i * P + P / 2;
    const lift = Math.max(0, ...peaks.map(([px, h, hw]) => h * (1 - Math.abs(x - px) / hw)));
    return snap(base - lift + (rnd() - 0.5) * 2 * P);
  });
}

/** Rolling ground: the top of each pixel column from a few overlapping waves. */
function hills(base: number, waves: [amplitude: number, period: number, phase: number][]) {
  return Array.from({ length: COLS }, (_, i) =>
    snap(base + waves.reduce((y, [a, p, ph]) => y + a * Math.sin(((i * P) / p) * 2 * Math.PI + ph), 0)),
  );
}

/** A stepped shape from a ridge down to the bottom of the box. */
function area(top: number[]) {
  let d = `M0 ${H}V${top[0]}`;
  for (let i = 1; i < top.length; i++) if (top[i] !== top[i - 1]) d += `H${i * P}V${top[i]}`;
  return `${d}H${W}V${H}Z`;
}

/** Snow or light on the columns above a line, 2–4 pixels deep. */
function caps(top: number[], line: number, seed: number) {
  const rnd = seeded(seed);
  return top.map((y, i) => (y < line ? rect(i * P, y, P, Math.min(line - y, P * (2 + Math.floor(rnd() * 3)))) : "")).join("");
}

/** w×h blocks scattered between a ridge and a lower limit, within [from, to) on x. */
function scatter(top: number[] | number, bottom: number, count: number, w: number, h: number, seed: number, from = 0, to = W) {
  const rnd = seeded(seed);
  let d = "";
  for (let n = 0; n < count; n++) {
    const x = snap(from + rnd() * (to - from - w));
    const high = (typeof top === "number" ? top : top[Math.floor(x / P)]) + P;
    if (bottom - h > high) d += rect(x, snap(high + rnd() * (bottom - h - high)), w, h);
  }
  return d;
}

/** A stepped ellipse (a circle when rx = ry). */
function ellipse(cx: number, cy: number, rx: number, ry = rx) {
  let d = "";
  for (let y = -ry; y < ry; y += P) {
    const half = snap(rx * Math.sqrt(Math.max(0, 1 - ((y + P / 2) / ry) ** 2)));
    if (half > 0) d += rect(snap(cx) - half, snap(cy) + y, half * 2, P);
  }
  return d;
}

/**
 * A pine of `rows` pixel rows with its top centre at (0, 0), in tiers: each
 * tier widens downward and the next starts narrower, giving saw-toothed sides.
 */
function pine(rows: number) {
  const tier = rows > 9 ? 4 : 3;
  let d = "";
  for (let k = 0; k < rows; k++) {
    const half = P * Math.max(1, Math.round((1 + Math.floor(k / tier) + (k % tier)) * 0.65));
    d += rect(-half, k * P, half * 2, P);
  }
  return d;
}

/** Where a row of pines stands on the ground line: [x, top, rows]. */
function forest(ground: number[], gap: number, minH: number, maxH: number, seed: number) {
  const rnd = seeded(seed);
  const trees: [number, number, number][] = [];
  for (let x = 0; x < W; x += snap(gap * (0.6 + rnd() * 0.8))) {
    const rows = Math.max(4, Math.round((minH + rnd() * (maxH - minH)) / P));
    trees.push([snap(x), ground[Math.min(COLS - 1, Math.floor(x / P))] + 2 * P - rows * P, rows]);
  }
  return trees;
}

/** Light streaks on the lake. */
function ripples(top: number, bottom: number, count: number, seed: number) {
  const rnd = seeded(seed);
  let d = "";
  for (let n = 0; n < count; n++) {
    const len = snap(P * (3 + rnd() * 14));
    d += rect(snap(rnd() * (W - len)), snap(top + P + rnd() * (bottom - top - 2 * P)), len, P);
  }
  return d;
}

/** A streaky cloud: one [offset, length] pair (in pixels) per row. */
function cloud(x: number, y: number, rows: [number, number][]) {
  return rows.map(([o, len], r) => rect(x + o * P, y + r * P, len * P, P)).join("");
}

const mirror = <T extends number[]>([x, ...rest]: T) => [W - x, ...rest] as T;

const far = range(480, [[300, 100, 240], [620, 120, 260], [900, 170, 300], [1250, 240, 340], [1560, 190, 300], [1900, 140, 280], [2200, 110, 260]], 7);
const mountain = range(640, [[1180, 330, 560], [1520, 190, 320]], 11);
const farGround = hills(600, [[10, 700, 0.3], [6, 260, 1.7]]);
const nearGround = hills(668, [[12, 900, 2.2], [6, 300, 0.4]]);
const LAKE = 704;

/** Foliage clumps of the trees framing the sides: [x, y, rx, ry]; the right side mirrors the left.
 * They stay left of x = 580, so they show only in the margins beside the page.
 * The moon sits high on the right, clear of the page titles and the test's counter. */
const CLUMPS: [number, number, number, number][] = [
  [430, 0, 150, 80], [380, 130, 170, 64], [480, 210, 100, 50], [400, 300, 170, 60],
  [350, 400, 160, 56], [460, 480, 110, 50], [380, 580, 140, 54],
];
const ROCKS: [number, number, number, number][] = [[400, 850, 130, 70], [580, 870, 140, 46], [720, 888, 90, 30]];
const BUSHES: [number, number, number, number][] = [[650, 806, 60, 34], [770, 836, 44, 26], [300, 780, 90, 50]];
const sides = <T extends number[]>(list: T[]) => [...list, ...list.map(mirror)];

const SCENE = {
  stars: scatter(0, 240, 44, 4, 4, 31),
  moonHalo: ellipse(1780, 110, 72),
  moon: ellipse(1780, 110, 44),
  clouds:
    cloud(680, 196, [[6, 18], [0, 34], [10, 22]]) +
    cloud(1340, 240, [[4, 26], [0, 40], [14, 16]]) +
    cloud(1000, 330, [[0, 30], [8, 44]]) +
    cloud(1880, 300, [[2, 20], [0, 28]]),
  far: area(far),
  farLight: caps(far, 330, 3),
  mountain: area(mountain),
  mountainLight: caps(mountain, 380, 5),
  mountainDots: scatter(mountain, 620, 180, P, P, 13),
  farForest: area(farGround),
  nearForest: area(nearGround),
  forestFlecks: scatter(nearGround, LAKE, 160, P, P, 61),
  lake: rect(0, LAKE, W, H - LAKE),
  ripples: ripples(LAKE, H, 90, 23),
  trunks: rect(452, 100, 24, 760) + rect(W - 476, 100, 24, 760),
  crownShade: sides(CLUMPS).map(([x, y, rx, ry]) => ellipse(x, y, rx, ry)).join(""),
  crown: sides(CLUMPS).map(([x, y, rx, ry]) => ellipse(x - P, y - 1.5 * P, rx * 0.9, ry * 0.78)).join(""),
  crownLight: sides(CLUMPS).map(([x, y, rx, ry]) => ellipse(x - rx * 0.2, y - ry * 0.48, rx * 0.55, ry * 0.32)).join(""),
  bushes: sides(BUSHES).map(([x, y, rx, ry]) => ellipse(x, y, rx, ry)).join(""),
  rocks: sides(ROCKS).map(([x, y, rx, ry]) => ellipse(x, y, rx, ry)).join(""),
  rockLight: sides(ROCKS).map(([x, y, rx, ry]) => ellipse(x - rx * 0.15, y - ry * 0.35, rx * 0.6, ry * 0.4)).join(""),
  grass: scatter(790, H, 50, P, 2 * P, 37, 260, 860) + scatter(790, H, 50, P, 2 * P, 41, W - 860, W - 260),
  pink: scatter(800, H, 10, P, P, 43, 280, 840) + scatter(800, H, 10, P, P, 47, W - 840, W - 280),
  lilac: scatter(800, H, 10, P, P, 53, 280, 840) + scatter(800, H, 10, P, P, 59, W - 840, W - 280),
};

// Each pine size is drawn once and placed with <use>, which keeps the file small.
const FAR_TREES = forest(farGround, 26, 40, 100, 17);
const NEAR_TREES = forest(nearGround, 40, 72, 150, 19);
const PINES = [...new Set([...FAR_TREES, ...NEAR_TREES].map(([, , rows]) => rows))]
  .map((rows) => `<path id="t${rows}" d="${pine(rows)}"/>`)
  .join("");
const trees = (list: [number, number, number][], fill: string) =>
  `<g fill="${fill}">${list.map(([x, y, rows]) => `<use href="#t${rows}" x="${x}" y="${y}"/>`).join("")}</g>`;

type Palette = Record<
  | "sky1" | "sky2" | "sky3" | "sky4" | "star" | "halo" | "moon" | "cloud"
  | "far" | "farLight" | "mountain" | "mountainLight" | "mountainDots" | "forestFar" | "forest"
  | "lake" | "ripple" | "trunk" | "crownShade" | "crown" | "crownLight" | "rock" | "rockLight"
  | "grass" | "pink" | "lilac",
  string
>;

/** Day lake for light mode. The sky and the mountains behind the middle of the
 * page stay light enough for text over them; the forest, lake and framing
 * trees keep their full colour. */
const DAY: Palette = {
  sky1: "#a9dcf2", sky2: "#c3e8f2", sky3: "#dcf2ea", sky4: "#eef6cf",
  star: "none", halo: "#f6fbe0", moon: "#fff7cc", cloud: "#ffffff",
  far: "#a8cfe9", farLight: "#e4f3fb", mountain: "#afd3ea", mountainLight: "#d3e9f7", mountainDots: "#8dbbdc",
  forestFar: "#5fae9a", forest: "#3f8f7f", lake: "#6fcbe0", ripple: "#b5eaf4",
  trunk: "#3c4a5c", crownShade: "#2c6f66", crown: "#4fae6a", crownLight: "#7cc97a",
  rock: "#8aa3b8", rockLight: "#b3c6d6", grass: "#5fbf72", pink: "#f59ccc", lilac: "#b9a2f2",
};

/** Moonlit night lake for dark mode: navy sky with stars, a pale moon, dark pines. */
const NIGHT: Palette = {
  sky1: "#0b1430", sky2: "#0f1d3e", sky3: "#13284a", sky4: "#1a3a4a",
  star: "#e8f0ff", halo: "#1f3f55", moon: "#e8efc4", cloud: "#1e3a55",
  far: "#18304f", farLight: "#24425f", mountain: "#142a48", mountainLight: "#223f5e", mountainDots: "#1b3758",
  forestFar: "#0f3036", forest: "#0b2629", lake: "#0e3f55", ripple: "#2d8fb0",
  trunk: "#0a1620", crownShade: "#081c1f", crown: "#0f4436", crownLight: "#1f6b4a",
  rock: "#1d3347", rockLight: "#2b4a63", grass: "#145a3c", pink: "#6b3a66", lilac: "#46407e",
};

/** The scene as an SVG document for one theme. */
export function landscapeSvg(theme: "light" | "dark") {
  const c = theme === "dark" ? NIGHT : DAY;
  const path = (fill: string, d: string) => (fill === "none" || !d ? "" : `<path fill="${fill}" d="${d}"/>`);
  const dither = (id: string, fill: string) =>
    `<pattern id="${id}" width="${2 * P}" height="${2 * P}" patternUnits="userSpaceOnUse"><path fill="${fill}" d="${rect(0, 0, P, P)}${rect(P, P, P, P)}"/></pattern>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">`,
    // The clouds drift a little to the side and back, unless motion is reduced.
    `<style>.drift{animation:drift 40s ease-in-out infinite alternate}@keyframes drift{to{transform:translateX(48px)}}@media (prefers-reduced-motion:reduce){.drift{animation:none}}</style>`,
    `<defs>${dither("d2", c.sky2)}${dither("d3", c.sky3)}${dither("d4", c.sky4)}${PINES}</defs>`,
    // The dithered sky: solid bands with a checkerboard where one meets the next.
    `<rect width="${W}" height="${H}" fill="${c.sky1}"/>`,
    `<rect y="96" width="${W}" height="40" fill="url(#d2)"/><rect y="136" width="${W}" height="${H}" fill="${c.sky2}"/>`,
    `<rect y="224" width="${W}" height="40" fill="url(#d3)"/><rect y="264" width="${W}" height="${H}" fill="${c.sky3}"/>`,
    `<rect y="336" width="${W}" height="40" fill="url(#d4)"/><rect y="376" width="${W}" height="${H}" fill="${c.sky4}"/>`,
    path(c.star, SCENE.stars),
    path(c.halo, SCENE.moonHalo),
    path(c.moon, SCENE.moon),
    `<g class="drift">${path(c.cloud, SCENE.clouds)}</g>`,
    path(c.far, SCENE.far),
    path(c.farLight, SCENE.farLight),
    path(c.mountain, SCENE.mountain),
    path(c.mountainLight, SCENE.mountainLight),
    path(c.mountainDots, SCENE.mountainDots),
    path(c.forestFar, SCENE.farForest),
    trees(FAR_TREES, c.forestFar),
    path(c.forest, SCENE.nearForest),
    trees(NEAR_TREES, c.forest),
    path(c.forestFar, SCENE.forestFlecks),
    path(c.lake, SCENE.lake),
    path(c.ripple, SCENE.ripples),
    path(c.trunk, SCENE.trunks),
    path(c.crownShade, SCENE.crownShade),
    path(c.crown, SCENE.crown),
    path(c.crownLight, SCENE.crownLight),
    path(c.crownShade, SCENE.bushes),
    path(c.rock, SCENE.rocks),
    path(c.rockLight, SCENE.rockLight),
    path(c.grass, SCENE.grass),
    path(c.pink, SCENE.pink),
    path(c.lilac, SCENE.lilac),
    "</svg>",
  ].join("");
}
