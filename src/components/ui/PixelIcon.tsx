import { cn } from "@/lib/cn";

/**
 * A pixel-art icon on a grid, like the pets and the landscape. In each row
 * "#" is a pixel in the text colour (currentColor, so it follows dark mode),
 * another letter a colour from `palette`, and "." is empty.
 */
type PixelArt = { rows: string[]; palette?: Record<string, string> };

/** 🟢🟡🔴: a round dot, darker at the lower right, with a highlight. */
const SIGNAL_DOT = [
  "....CC....",
  "..CCCCCC..",
  ".CCHCCCCC.",
  ".CHHCCCCE.",
  "CCCCCCCCEE",
  "CCCCCCCCEE",
  ".CCCCCCCE.",
  ".CCCCCCEE.",
  "..CEEEEE..",
  "....EE....",
];

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

  // Colour icons, for achievements and the understanding signals.
  memo: {
    rows: [
      "OOOOOOO..P",
      "OWWWWWO.PP",
      "OLLLLWOYY.",
      "OWWWWWYY..",
      "OLLLLYY...",
      "OWWWYYO...",
      "OLLTTWO...",
      "OWWTWWO...",
      "OWDWWWO...",
      "OOOOOOO...",
    ],
    palette: { O: "#7a6aa8", W: "#ffffff", L: "#b9b3cf", P: "#f39ab8", Y: "#f5c542", T: "#e8c39a", D: "#3d3456" },
  },
  fire: {
    rows: [
      "....R.....",
      "....RR....",
      "...RRR..R.",
      "..RRRRR.R.",
      "..RRYRRRR.",
      ".RRRYYRRR.",
      ".RRYYYYRR.",
      ".RRYYYYRR.",
      "..RRYYRR..",
      "...RRRR...",
    ],
    palette: { R: "#f26b3a", Y: "#ffd23f" },
  },
  star: {
    rows: [
      "....YY....",
      "....YY....",
      "...YYYY...",
      "YYYYYYYYYS",
      ".YYYYYYYS.",
      "..YYYYYS..",
      "..YYYYYS..",
      ".YYY..YSS.",
      ".YY....SS.",
      ".Y......S.",
    ],
    palette: { Y: "#ffd23f", S: "#f0a020" },
  },
  pencil: {
    rows: [
      "........PP",
      ".......PPP",
      "......MMM.",
      ".....SYY..",
      "....SYY...",
      "...SYY....",
      "..SYY.....",
      ".TTT......",
      "DTT.......",
      "DD........",
    ],
    palette: { P: "#f39ab8", M: "#b9b3cf", Y: "#f5c542", S: "#e0a92e", T: "#e8c39a", D: "#3d3456" },
  },
  cap: {
    rows: [
      "..........",
      "....KK....",
      "..KKKKKK..",
      "KKKKKKKKKK",
      "..KKKKKK.Y",
      "....KK...Y",
      "..KKKKKK.Y",
      "..KKKKKK.Y",
      "..KKKKKK.Y",
      "...KKKK.YY",
    ],
    palette: { K: "#4a3a78", Y: "#ffd23f" },
  },
  gamepad: {
    rows: [
      "..........",
      "..........",
      ".PPPPPPPP.",
      "PPWPPPPRPP",
      "PWWWPPPPBP",
      "PPWPPPPPPP",
      "PPPPPPPPPP",
      "PPP....PPP",
      ".P......P.",
      "..........",
    ],
    palette: { P: "#6c4fd0", W: "#ffffff", R: "#ff6b8b", B: "#ffd23f" },
  },
  swords: {
    rows: [
      "M........M",
      ".M......M.",
      "..M....M..",
      "...M..M...",
      "....MM....",
      "..G.MM.G..",
      "...M..M...",
      "..H.GG.H..",
      ".H......H.",
      "G........G",
    ],
    palette: { M: "#8d9bb5", G: "#f5c542", H: "#8a5a2b" },
  },
  trophy: {
    rows: [
      "YYYYYYYYYY",
      "Y.YYYYYS.Y",
      "Y.YYYYYS.Y",
      ".YYYYYYSY.",
      "..YYYYYS..",
      "...YYYS...",
      "....YS....",
      "....YS....",
      "..BBBBBB..",
      "..BBBBBB..",
    ],
    palette: { Y: "#ffd23f", S: "#e0a92e", B: "#8a5a2b" },
  },
  egg: {
    rows: [
      "...EEEE...",
      "..EWWWWE..",
      ".EWWWWWWE.",
      ".EWWWWWWE.",
      "EWWWWWWWSE",
      "EWWWWWWWSE",
      "EWWWWWWWSE",
      "EWWWWWWSSE",
      ".EWWWSSSE.",
      "..EEEEEE..",
    ],
    palette: { E: "#b98a52", W: "#fff6e3", S: "#ecd3ae" },
  },
  pawprint: {
    rows: [
      "..........",
      "..BB..BB..",
      "..BB..BB..",
      "BB......BB",
      "BB......BB",
      "....BB....",
      "..BBBBBB..",
      ".BBBBBBBB.",
      ".BBBBBBBB.",
      ".BBB..BBB.",
    ],
    palette: { B: "#b07a4a" },
  },
  dumbbell: {
    rows: [
      "..........",
      "..........",
      ".DD....DD.",
      "DDD....DDD",
      "DDDMMMMDDD",
      "DDDMMMMDDD",
      "DDD....DDD",
      ".DD....DD.",
      "..........",
      "..........",
    ],
    palette: { D: "#4a3a78", M: "#b9b3cf" },
  },
  clapper: {
    rows: [
      "..........",
      "KKWWKKWWKK",
      "KWWKKWWKKK",
      "..........",
      "KKKKKKKKKK",
      "KKKKKKKKKK",
      "KKWWWWWKKK",
      "KKKKKKKKKK",
      "KKWWWKKKKK",
      "KKKKKKKKKK",
    ],
    palette: { K: "#3d3456", W: "#ffffff" },
  },
  clipboard: {
    rows: [
      "...CCCC...",
      ".BBCWWCBB.",
      ".BWWWWWWB.",
      ".BWLLLLWB.",
      ".BWWWWWWB.",
      ".BWLLLWWB.",
      ".BWWWWWWB.",
      ".BWLLLLWB.",
      ".BWWWWWWB.",
      ".BBBBBBBB.",
    ],
    palette: { B: "#b8875a", W: "#ffffff", C: "#8d90a6", L: "#b9b3cf" },
  },
  "signal-got": { rows: SIGNAL_DOT, palette: { C: "#3cc47c", E: "#23955a", H: "#ffffff" } },
  "signal-unsure": { rows: SIGNAL_DOT, palette: { C: "#ffd23f", E: "#e0a92e", H: "#ffffff" } },
  "signal-lost": { rows: SIGNAL_DOT, palette: { C: "#ef5a6f", E: "#c43a50", H: "#ffffff" } },
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
