// The runner's world: a road seen from behind the hero, drawn in a fixed
// 400 × 520 space. Things ahead sit at a distance `d` (world units) and are
// projected toward the horizon: p = 1 at the hero's feet, smaller farther away.

export const W = 400;
export const H = 520;
export const CX = W / 2;
export const HORIZON = 132;
/** Where the hero's feet touch the road. */
export const FEET_Y = 456;
/** Lane spacing at the hero's distance. */
export const LANE = 112;
/** Road half-width at the hero's distance. */
export const ROAD = 182;
/** Bigger is a flatter road. */
const DEPTH = 110;

/** Run speed, world units per second. */
export const SPEED = 175;
/** First gate's distance, then the distance between gates. */
export const FIRST_GATE = 720;
export const GATE_GAP = 640;
/** The boss waits this far past the last gate. */
export const BOSS_GAP = 760;
/** The hero stops this far before the boss for the fight. */
export const FIGHT_GAP = 170;

export const scaleAt = (d: number) => DEPTH / (DEPTH + Math.max(d, -DEPTH * 0.6));
export const yAt = (d: number) => HORIZON + (FEET_Y - HORIZON) * scaleAt(d);
/** Screen x of a lane (0 left, 1 middle, 2 right, or anything between). */
export const laneX = (lane: number, d = 0) => CX + (lane - 1) * LANE * scaleAt(d);

/** Hero size from power: grows fast early, then slowly. */
export const heroScale = (power: number) => 0.72 + Math.min(1.1, Math.sqrt(Math.max(0, power)) / 9);
