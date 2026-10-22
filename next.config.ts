import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
