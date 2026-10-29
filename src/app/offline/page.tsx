import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Интернет алга · LevelUp",
};

/**
 * Shown by the service worker (public/sw.js) when a page that was never
 * opened before is opened without internet. Pages opened before still work.
 */
export default function Offline() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <p className="text-6xl leading-none" aria-hidden="true">
        📡
      </p>
      <h1 className="text-2xl font-bold md:text-3xl">Интернет алга байна</h1>
      <p className="max-w-100 text-ink-muted">
        Энэ хуудсыг өмнө нь нээж байгаагүй тул одоо харуулах боломжгүй. Өмнө
        нээсэн хичээлүүд чинь интернетгүй ч ажиллана.
      </p>
      <ButtonLink href="/">Нүүр рүү буцах</ButtonLink>
    </main>
  );
}
