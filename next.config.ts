import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The service worker must always be fetched fresh, or a fix would never reach installed apps.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      // Run every stylesheet through Tailwind, but keep `*.module.css` as a
      // CSS module: renaming it to `*.css` would make it global.
      "*.css": [
        {
          condition: { not: { path: "**/*.module.css" } },
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
        {
          condition: { path: "**/*.module.css" },
          loaders: ["@tailwindcss/turbopack"],
          as: "*.module.css",
        },
      ],
    },
  },
};

export default nextConfig;
