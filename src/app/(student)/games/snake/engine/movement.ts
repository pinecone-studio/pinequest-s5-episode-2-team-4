import { WORLD, type Snake } from "./types";

const SPEED = 95;
const TURN = 3.8;
const WALL = 11;

/** New snake at the bottom centre, already stretched out behind its head. */
export function newSnake(): Snake {
  const x = WORLD.w / 2, y = WORLD.h * 0.78;
  return { x, y, angle: -Math.PI / 2, length: 26, trail: Array.from({ length: 260 }, (_, i) => ({ x, y: y + i * 1.1 })) };
}

/**
 * Turns towards `wanted` (limited turn rate), moves forward and records the
 * head in the trail. Walls bounce the snake back instead of ending the game:
 * mistakes cost points, never the whole session.
 */
export function moveSnake(sn: Snake, wanted: number | null, dt: number, top: number) {
  if (wanted !== null) {
    const diff = Math.atan2(Math.sin(wanted - sn.angle), Math.cos(wanted - sn.angle)), max = TURN * dt;
    sn.angle += Math.max(-max, Math.min(max, diff));
  }
  sn.x += Math.cos(sn.angle) * SPEED * dt;
  sn.y += Math.sin(sn.angle) * SPEED * dt;
  if (sn.x < WALL || sn.x > WORLD.w - WALL) {
    sn.x = Math.max(WALL, Math.min(WORLD.w - WALL, sn.x));
    sn.angle = Math.PI - sn.angle;
  }
  if (sn.y < top || sn.y > WORLD.h - WALL) {
    sn.y = Math.max(top, Math.min(WORLD.h - WALL, sn.y));
    sn.angle = -sn.angle;
  }
  sn.trail.unshift({ x: sn.x, y: sn.y });
  if (sn.trail.length > 1600) sn.trail.length = 1600;
}
