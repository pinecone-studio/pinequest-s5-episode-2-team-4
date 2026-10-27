import { FALCON_R, GROUND, type Falcon } from "./types";

/** New falcon halfway between the banner and the ground. */
export const newFalcon = (top: number): Falcon => ({ y: (top + GROUND) / 2, vy: 0, rot: 0, dizzy: 0 });

/** Before the start: bob in place. */
export function hover(f: Falcon, time: number, top: number) {
  f.y = (top + GROUND) / 2 + Math.sin(time * 2.2) * 10;
  f.rot = Math.sin(time * 2.2 + 1) * 0.12;
}

/** Gravity, tilt with the speed, and the ceiling. Returns true when it bounced off the ground. */
export function fly(f: Falcon, dt: number, top: number) {
  f.vy = Math.min(330, f.vy + 620 * dt);
  f.y += f.vy * dt;
  f.rot += (Math.max(-0.45, Math.min(0.9, f.vy / 420)) - f.rot) * Math.min(1, dt * 10);
  if (f.y < top - 4) {
    f.y = top - 4;
    f.vy = Math.max(0, f.vy);
  }
  if (f.y <= GROUND - FALCON_R) return false;
  f.y = GROUND - FALCON_R;
  f.vy = -210;
  return true;
}
