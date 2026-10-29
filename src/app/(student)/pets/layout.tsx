import { getEggs } from "@/lib/data";
import { PetsBackdrop } from "./PetsBackdrop";
import { PetsTabs } from "./PetsTabs";

/** The Pets area: pixel art behind it and shared tabs above every pets page. */
export default async function PetsLayout({ children }: LayoutProps<"/pets">) {
  const eggs = await getEggs();
  return (
    // isolate keeps the backdrop behind this area only; the padding leaves room for the meadow.
    <div className="relative isolate pb-14">
      <PetsBackdrop />
      <PetsTabs eggCount={eggs.length} />
      {children}
    </div>
  );
}
