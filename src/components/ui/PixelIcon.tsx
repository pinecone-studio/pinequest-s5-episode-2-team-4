import { cn } from "@/lib/cn";

/**
 * A pixel-art icon on a grid, like the pets and the landscape. In each row
 * "#" is a pixel in the text colour (currentColor, so it follows dark mode),
 * another letter a colour from `palette`, and "." is empty.
 */
type PixelArt = { rows: string[]; palette?: Record<string, string> };

/** 10×10, so a pixel is 2px at the nav size (20px), about the old line weight. */
export const PIXEL_ICONS = {
  home: {
    rows: [
      "....##....",
      "...#..#...",
      "..#....#..",
      ".#......#.",
      "#........#",
      ".#......#.",
      ".#..##..#.",
      ".#..##..#.",
      ".#..##..#.",
      ".########.",
    ],
  },
  book: {
    rows: [
      ".########.",
      "##......#.",
      "##.####.#.",
      "##......#.",
      "##.###..#.",
      "##......#.",
      "##......#.",
      "#########.",
      "##.......#",
      ".#########",
    ],
  },
  video: {
    rows: [
      "..........",
      ".######...",
      "#......#..",
      "#......#.#",
      "#......###",
      "#......###",
      "#......#.#",
      "#......#..",
      ".######...",
      "..........",
    ],
  },
  task: {
    rows: [
      "...####...",
      ".###..###.",
      ".#......#.",
      ".#......#.",
      ".#....#.#.",
      ".#.#.#..#.",
      ".#..#...#.",
      ".#......#.",
      ".#......#.",
      ".########.",
    ],
  },
  play: {
    rows: [
      "...#......",
      "...##.....",
      "...###....",
      "...####...",
      "...#####..",
      "...#####..",
      "...####...",
      "...###....",
      "...##.....",
      "...#......",
    ],
  },
  grid: {
    rows: [
      "####..####",
      "#..#..#..#",
      "#..#..#..#",
      "####..####",
      "..........",
      "..........",
      "####..####",
      "#..#..#..#",
      "#..#..#..#",
      "####..####",
    ],
  },
  users: {
    rows: [
      ".......##.",
      "..##..####",
      ".####.####",
      ".####..##.",
      "..##......",
      "......####",
      ".####.####",
      "######.###",
      "######.###",
      "######....",
    ],
  },
  clock: {
    rows: [
      "...####...",
      ".##....##.",
      ".#..#...#.",
      "#...#....#",
      "#...#....#",
      "#...###..#",
      "#........#",
      ".#......#.",
      ".##....##.",
      "...####...",
    ],
  },
  paw: {
    rows: [
      "..........",
      "..##..##..",
      "..##..##..",
      "##......##",
      "##......##",
      "....##....",
      "..######..",
      ".########.",
      ".########.",
      ".###..###.",
    ],
  },
  swap: {
    rows: [
      "......#...",
      ".......#..",
      "#########.",
      ".......#..",
      "......#...",
      "...#......",
      "..#.......",
      ".#########",
      "..#.......",
      "...#......",
    ],
  },
  moon: {
    rows: [
      "....###...",
      "..###.....",
      ".###......",
      ".##.......",
      "###.......",
      "###.......",
      "###......#",
      ".###....##",
      "..#######.",
      "....###...",
    ],
  },
  sun: {
    rows: [
      "....##....",
      ".#..##..#.",
      "..#....#..",
      "....##....",
      "##.####.##",
      "##.####.##",
      "....##....",
      "..#....#..",
      ".#..##..#.",
      "....##....",
    ],
  },
  logout: {
    rows: [
      "..........",
      "#####.....",
      "#.....#...",
      "#......#..",
      "#.......#.",
      "#..#######",
      "#.......#.",
      "#......#..",
      "#.....#...",
      "#####.....",
    ],
  },
} satisfies Record<string, PixelArt>;

export type PixelIconName = keyof typeof PIXEL_ICONS;

/** One path per colour, a unit square for each pixel. */
function pixelPaths({ rows, palette }: PixelArt) {
  const paths = new Map<string, string>();
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === ".") return;
      const fill = c === "#" ? "currentColor" : (palette?.[c] ?? "currentColor");
      paths.set(fill, `${paths.get(fill) ?? ""}M${x} ${y}h1v1h-1z`);
    }),
  );
  return [...paths];
}

/**
 * A pixel icon sized by `className` (e.g. `size-5`). Decorative unless
 * `label` is given, which names it for screen readers.
 */
export function PixelIcon({ name, className, label }: { name: PixelIconName; className?: string; label?: string }) {
  const art: PixelArt = PIXEL_ICONS[name];
  return (
    <svg
      viewBox={`0 0 ${art.rows[0].length} ${art.rows.length}`}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", className)}
    >
      {pixelPaths(art).map(([fill, d]) => (
        <path key={fill} fill={fill} d={d} />
      ))}
    </svg>
  );
}
