import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoinIcon } from "@/components/layout/CoinChip";
import { getCurrentPet, getShop } from "@/lib/data";
import { ShopView } from "./ShopView";

export const metadata: Metadata = {
  title: "Дэлгүүр · LevelUp",
};

/** The pet shop: scenes, XP ring colours and auras bought with coins. */
export default async function ShopPage() {
  const [shop, pet] = await Promise.all([getShop(), getCurrentPet()]);
  if (!shop) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 pt-2 md:px-[clamp(16px,4vw,40px)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="type-page-title">Дэлгүүр</h1>
          <p className="mt-3 text-ink-muted md:text-lg">
            Өдрийн зорилт болон амжилтын шагналаар цуглуулсан зоосоороо тэжээврийнхээ орчин, гялбааг шинэчлээрэй.
          </p>
        </div>
        <p className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-lg font-bold shadow-card md:self-auto">
          <CoinIcon className="size-6" />
          {shop.coins}
          <span className="sr-only">зоос</span>
        </p>
      </div>
      <ShopView items={shop.items} coins={shop.coins} petSprite={pet?.stage.sprite} />
    </div>
  );
}
