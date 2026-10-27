import { roundRect } from "../../_lib/canvas";
import { GAME_COLORS } from "../../_lib/palette";
import { drawAnswer } from "../../_lib/shapes";
import { GATE_W, GROUND, WORLD, type Gate, type GateItem, type Lane } from "./types";

/** A glowing stone pillar from y0 to y1, with gold caps on the ends that face a gap. */
function pillar(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, capTop: boolean, capBottom: boolean) {
  if (y1 - y0 < 1) return;
  const g = ctx.createLinearGradient(x, 0, x + GATE_W, 0);
  g.addColorStop(0, "#1f0c46");
  g.addColorStop(0.3, "#5a2fd6");
  g.addColorStop(0.45, "#a98bff");
  g.addColorStop(0.6, "#5a2fd6");
  g.addColorStop(1, "#1a0a3a");
  ctx.fillStyle = g;
  roundRect(ctx, x, y0, GATE_W, y1 - y0, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(200,180,255,.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  const cap = (cy: number) => {
    const cg = ctx.createLinearGradient(0, cy - 5, 0, cy + 5);
    cg.addColorStop(0, "#ffe7a3");
    cg.addColorStop(0.5, GAME_COLORS.gold);
    cg.addColorStop(1, "#b7791f");
    ctx.fillStyle = cg;
    roundRect(ctx, x - 3, cy - 3.5, GATE_W + 6, 7, 3);
    ctx.fill();
  };
  if (capTop) cap(y0 + 3);
  if (capBottom) cap(y1 - 3);
}

/** One answer pill in a gap; `hot` is the gap the falcon is heading for. */
function drawItem(ctx: CanvasRenderingContext2D, item: GateItem, lane: Lane, x: number, hot: boolean, edge: string) {
  const half = (lane.y1 - lane.y0) / 2, glow = ctx.createRadialGradient(0, 0, 2, 0, 0, half);
  glow.addColorStop(0, hot ? "rgba(255,207,90,.22)" : "rgba(139,92,255,.16)");
  glow.addColorStop(1, "rgba(139,92,255,0)");
  ctx.translate(x, lane.c);
  ctx.fillStyle = glow;
  ctx.fillRect(-60, -half, 120, half * 2);
  ctx.shadowColor = hot ? "rgba(255,207,90,.7)" : "rgba(0,0,0,.5)";
  ctx.shadowBlur = hot ? 16 : 8;
  roundRect(ctx, -item.w / 2, -item.h / 2, item.w, item.h, Math.min(15, item.h / 2));
  ctx.fillStyle = "rgba(20,12,52,.92)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = edge;
  ctx.stroke();
  if (typeof item.answer !== "string") ctx.scale(0.85, 0.85);
  drawAnswer(ctx, item.answer);
}

/**
 * A gate: four pillar pieces around three gaps with an answer in each.
 * After it is judged the chosen pill swells and fades, the others fade.
 */
export function drawGate(ctx: CanvasRenderingContext2D, g: Gate, all: Lane[], top: number, hotLane: number) {
  if (g.x > WORLD.w + 160 || g.x < -200) return;
  const beam = ctx.createLinearGradient(g.x - 20, 0, g.x + GATE_W + 20, 0);
  beam.addColorStop(0, "rgba(139,92,255,0)");
  beam.addColorStop(0.5, "rgba(139,92,255,.13)");
  beam.addColorStop(1, "rgba(139,92,255,0)");
  ctx.fillStyle = beam;
  ctx.fillRect(g.x - 20, top - 20, GATE_W + 40, GROUND - top + 20);
  pillar(ctx, g.x, -10, all[0].y0, false, true);
  pillar(ctx, g.x, all[0].y1, all[1].y0, true, true);
  pillar(ctx, g.x, all[1].y1, all[2].y0, true, true);
  pillar(ctx, g.x, all[2].y1, GROUND + 2, true, false);
  g.items.forEach((item, i) => {
    const chosen = g.done && g.lane === i;
    const alpha = !g.done ? 1 : Math.max(0, 1 - g.pop * (chosen ? 2.2 : 3));
    if (alpha <= 0) return;
    const edge = chosen ? (g.result ? GAME_COLORS.good : GAME_COLORS.bad) : i === hotLane ? GAME_COLORS.gold : "rgba(139,92,255,.8)";
    ctx.save();
    ctx.globalAlpha = alpha;
    if (chosen) {
      ctx.translate(g.x + GATE_W / 2, all[i].c);
      ctx.scale(1 + g.pop * 1.2, 1 + g.pop * 1.2);
      ctx.translate(-(g.x + GATE_W / 2), -all[i].c);
    }
    drawItem(ctx, item, all[i], g.x + GATE_W / 2, i === hotLane, edge);
    ctx.restore();
  });
}

/** Grass strip with tufts and dashes that scroll with the gates. */
export function drawGround(ctx: CanvasRenderingContext2D, scroll: number) {
  const { w: W, h: H } = WORLD, g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, "#2a1260");
  g.addColorStop(1, "#140832");
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = "#3d1b85";
  ctx.fillRect(0, GROUND, W, 3);
  ctx.fillStyle = "#4b23a3";
  for (let x = -(scroll % 18); x < W + 18; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x + 4, GROUND - 6);
    ctx.lineTo(x + 7, GROUND);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,.06)";
  for (let x = -(scroll % 46); x < W + 46; x += 46) ctx.fillRect(x, GROUND + 14, 22, 3);
}
