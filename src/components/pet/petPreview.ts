"use client";

import { useEffect, useState } from "react";

/** A pet look shown for a moment instead of the real one (the /pets evolution demo). */
export type PetPreview = { name: string; level: number; sprite: string };

const EVENT = "levelup:pet-preview";

/** Shows `preview` in the header and nav, or the real pet again with null. */
export function showPetPreview(preview: PetPreview | null) {
  window.dispatchEvent(new CustomEvent<PetPreview | null>(EVENT, { detail: preview }));
}

/** The pet preview being shown, or null. */
export function usePetPreview() {
  const [preview, setPreview] = useState<PetPreview | null>(null);
  useEffect(() => {
    const onPreview = (e: Event) => setPreview((e as CustomEvent<PetPreview | null>).detail);
    window.addEventListener(EVENT, onPreview);
    return () => window.removeEventListener(EVENT, onPreview);
  }, []);
  return preview;
}
