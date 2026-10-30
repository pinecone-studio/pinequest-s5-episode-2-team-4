// The pitch demo's ready lesson: a textbook page a demo teacher adds with one
// button, and the reel made from it ahead (mock/demoReel.ts), so the demo
// doesn't wait minutes for the AI and the voice. Shared by the teacher's
// pages and the server.

/** The page the «Бэлэн демо зураг» button adds. */
export const DEMO_PAGE = { src: "/demo/textbook-cube.jpg", name: "Номын хуудас · куб язгуур.jpg" };

/** The ready reel's narration, a public file. */
export const DEMO_REEL_AUDIO = "/demo/reel-cube.mp3";

/** How long each ready step still takes, so the demo shows the AI at work. */
export const DEMO_STEP_MS = { read: 6000, write: 7000, voice: 5000 };
