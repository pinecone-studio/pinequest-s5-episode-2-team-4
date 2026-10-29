// LevelUp service worker: keeps the app usable without internet.
// - Build files, images and the ML model: from the cache first (they never change at the same URL).
// - Pages: from the network first, so they're fresh; the saved copy when offline;
//   the /offline page if this page was never opened.
// - Anything that isn't a GET (form posts, server actions) is never cached.
// Bump VERSION to drop old caches after a change here.

const VERSION = "v1";
const STATIC = `levelup-static-${VERSION}`;
const PAGES = `levelup-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname.startsWith("/ml/") ||
  /\.(png|jpe?g|svg|webp|gif|woff2?|mp3|ogg)$/.test(url.pathname);

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) (await caches.open(PAGES)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) ?? (await caches.match(OFFLINE_URL));
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (isStatic(url)) event.respondWith(cacheFirst(request));
  else if (request.mode === "navigate") event.respondWith(networkFirst(request));
});
