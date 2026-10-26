import { getEggs } from "@/lib/data";
import { PetsTabs } from "./PetsTabs";

/** The Pets area: shared tabs above every pets page. */
export default async function PetsLayout({ children }: LayoutProps<"/pets">) {
  const eggs = await getEggs();
  return (
    <>
      <PetsTabs eggCount={eggs.length} />
      {children}
    </>
  );
}
