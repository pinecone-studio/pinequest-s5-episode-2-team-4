import type { MetadataRoute } from "next";

/** Lets students install LevelUp on their phone and open it full screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LevelUp",
    short_name: "LevelUp",
    description: "Ойлгоогүйгээ өөрийн хурдаар нөх.",
    lang: "mn",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#5b00ed",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
