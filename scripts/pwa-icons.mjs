// Makes the install icons in public/icons/ from the logo (src/app/icon.svg):
// the logo on white, with more padding for the "maskable" icon so Android
// can crop it into any shape. Run again after changing the logo:
//
//   node scripts/pwa-icons.mjs

import { mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";

const logo = readFileSync("src/app/icon.svg");
mkdirSync("public/icons", { recursive: true });

/** `scale`: share of the icon the logo fills. */
async function icon(name, size, scale) {
  const inner = Math.round(size * scale);
  const art = await sharp(logo, { density: 1200 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#ffffff" } })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toFile(`public/icons/${name}`);
  console.log(name);
}

await icon("icon-192.png", 192, 0.7);
await icon("icon-512.png", 512, 0.7);
// Android keeps only the middle 80% circle of a maskable icon.
await icon("maskable-512.png", 512, 0.5);
await icon("apple-touch-icon.png", 180, 0.68);
