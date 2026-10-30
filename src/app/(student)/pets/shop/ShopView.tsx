"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { CoinIcon } from "@/components/layout/CoinChip";
import { PetAura } from "@/components/pet/PetAura";
import { PetSprite } from "@/components/pet/PetSprite";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEFAULT_SCENE_PALETTE } from "@/lib/shop";
import { buyItem, equipItem } from "@/lib/shop-actions";
import type { ScenePalette, ShopEntry, ShopSlot } from "@/lib/types";

const SECTIONS: { slot: ShopSlot; title: string; hint: string; defaultName: string }[] = [
  { slot: "scene", title: "Орчин", hint: "Тэжээврийн чинь амьдардаг газар", defaultName: "Нуга" },
  { slot: "ring", title: "XP-ийн цагираг", hint: "Тэжээврийн зураг тойрон харагдах XP-ийн цагираг", defaultName: "Нил ягаан" },
  { slot: "aura", title: "Гялбаа", hint: "Тэжээврийн чинь эргэн тойронд", defaultName: "Байхгүй" },
];

const ERRORS: Record<string, string> = {
  unknown: "Ийм бараа алга.",
  owned: "Үүнийг аль хэдийн авсан.",
  coins: "Зоос хүрэлцэхгүй байна.",
  notowned: "Эхлээд худалдаж аваарай.",
  failed: "Амжилтгүй боллоо. Дахин оролдоорой.",
};

/** A small landscape in a scene's colours. */
function ScenePreview({ palette }: { palette: ScenePalette }) {
  const id = useId();
  return (
    <svg viewBox="0 0 120 72" aria-hidden="true" className="block h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.sky} />
          <stop offset=".55" stopColor={palette.haze} />
          <stop offset=".85" stopColor={palette.pink} />
        </linearGradient>
      </defs>
      <rect width="120" height="72" fill={`url(#${id})`} />
      <circle cx="94" cy="16" r="7" fill={palette.white} />
      <path d="M0 44 18 30l10 6 16-16 14 14 12-8 14 12 14-10 22 14v30H0z" fill={palette.mountain} opacity=".8" />
      <path d="M0 50c22-9 42-7 60-2s40-8 60-2v26H0z" fill={palette.hill} />
      <g fill={palette.primary} opacity=".25">
        <rect x="10" y="42" width="4" height="5" />
        <rect x="104" y="42" width="4" height="5" />
      </g>
      <path d="M0 60c28-6 92-6 120 0v12H0z" fill={palette.ground} />
      <ellipse cx="60" cy="62" rx="22" ry="4" fill={palette.meadow} />
      <g fill={palette.grass}>
        <rect x="14" y="62" width="2" height="4" />
        <rect x="96" y="62" width="2" height="4" />
      </g>
      <rect x="28" y="63" width="3" height="3" fill={palette.bloomPink} />
      <rect x="88" y="64" width="3" height="3" fill={palette.bloomViolet} />
    </svg>
  );
}

/** The pet in an XP ring of the given colours (several make a gradient). */
function RingPreview({ colors, sprite }: { colors?: string[]; sprite?: string }) {
  const id = useId();
  const stroke = !colors ? "var(--color-primary)" : colors.length === 1 ? colors[0] : `url(#${id})`;
  return (
    <span className="relative flex size-20 items-center justify-center">
      <svg viewBox="0 0 56 56" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
        {colors && colors.length > 1 && (
          <defs>
            <linearGradient id={id}>
              {colors.map((c, i) => (
                <stop key={c} offset={i / (colors.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
        )}
        <circle cx="28" cy="28" r="25" strokeWidth="5" className="fill-card stroke-line" />
        <circle cx="28" cy="28" r="25" fill="none" strokeWidth="5" strokeLinecap="round" stroke={stroke} strokeDasharray="157.1" strokeDashoffset="47" />
      </svg>
      {sprite && <PetSprite stage={{ name: "", sprite }} size={56} className="relative" />}
    </span>
  );
}

/** The pet with sparkles or hearts around it. */
function AuraPreview({ shape, colors, sprite }: { shape?: "sparkle" | "heart"; colors?: string[]; sprite?: string }) {
  return (
    <span className="relative flex size-20 items-center justify-center">
      {sprite && <PetSprite stage={{ name: "", sprite }} size={56} className={shape ? "animate-bob" : undefined} />}
      {shape && colors && <PetAura shape={shape} colors={colors} />}
    </span>
  );
}

function Preview({ item, slot, sprite }: { item?: ShopEntry; slot: ShopSlot; sprite?: string }) {
  if (slot === "scene") return <ScenePreview palette={item?.slot === "scene" ? item.palette : DEFAULT_SCENE_PALETTE} />;
  if (slot === "ring") return <RingPreview colors={item?.slot === "ring" ? item.colors : undefined} sprite={sprite} />;
  return (
    <AuraPreview
      shape={item?.slot === "aura" ? item.shape : undefined}
      colors={item?.slot === "aura" ? item.colors : undefined}
      sprite={sprite}
    />
  );
}

/**
 * The shop's three sections: each starts with the free default, then the
 * items with their price. Buying wears the item at once; owned items can be
 * worn again, and the default takes the slot back.
 */
export function ShopView({ items, coins, petSprite }: { items: ShopEntry[]; coins: number; petSprite?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true } | { ok: true; coins: number } | { error: string }>, done: string) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await action();
      setMessage("error" in result ? ERRORS[result.error] ?? ERRORS.failed : done);
      // The header's coins and what's worn update.
      if (!("error" in result)) router.refresh();
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-6 pb-4 md:mt-8 md:gap-8">
      <p role="status" aria-live="polite" className="rounded-card bg-white px-4 py-3 font-semibold shadow-card empty:hidden">
        {message}
      </p>
      {SECTIONS.map((section) => {
        const list = items.filter((i) => i.slot === section.slot);
        const defaultWorn = !list.some((i) => i.equipped);
        return (
          <section key={section.slot} aria-labelledby={`shop-${section.slot}`} className="rounded-panel bg-white p-5 shadow-card md:p-7">
            <h2 id={`shop-${section.slot}`} className="type-section-title">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{section.hint}</p>
            <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              <li className={cn("flex flex-col gap-3 rounded-card bg-surface p-3", defaultWorn && "ring-3 ring-primary")}>
                <div className="flex h-24 items-center justify-center overflow-hidden rounded-tile bg-card">
                  <Preview slot={section.slot} sprite={petSprite} />
                </div>
                <div>
                  <h3 className="font-bold">{section.defaultName}</h3>
                  <p className="text-xs text-ink-muted">Анхны загвар · үнэгүй</p>
                </div>
                {defaultWorn ? (
                  <p className="mt-auto flex min-h-12 items-center justify-center font-bold text-ink-muted">✓ Хэрэглэж байна</p>
                ) : (
                  <Button
                    variant="white"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => equipItem(section.slot, null), `«${section.defaultName}» руу буцлаа.`)}
                    className="mt-auto"
                  >
                    Хэрэглэх
                  </Button>
                )}
              </li>
              {list.map((item) => {
                const short = item.price - coins;
                return (
                  <li key={item.id} className={cn("flex flex-col gap-3 rounded-card bg-surface p-3", item.equipped && "ring-3 ring-primary")}>
                    <div className="flex h-24 items-center justify-center overflow-hidden rounded-tile bg-card">
                      <Preview item={item} slot={section.slot} sprite={petSprite} />
                    </div>
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-xs text-ink-muted">{item.description}</p>
                      {!item.owned && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-bold">
                          <CoinIcon className="size-4" />
                          {item.price}
                          <span className="sr-only">зоос</span>
                        </p>
                      )}
                    </div>
                    {item.equipped ? (
                      <p className="mt-auto flex min-h-12 items-center justify-center font-bold text-ink-muted">✓ Хэрэглэж байна</p>
                    ) : item.owned ? (
                      <Button
                        variant="white"
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => equipItem(item.slot, item.id), `«${item.name}» загварыг сонголоо.`)}
                        className="mt-auto"
                      >
                        Хэрэглэх
                      </Button>
                    ) : (
                      <div className="mt-auto flex flex-col gap-1">
                        <Button
                          size="sm"
                          disabled={pending || short > 0}
                          onClick={() => run(() => buyItem(item.id), `«${item.name}» загварыг худалдан авч, хэрэглэж эхэллээ!`)}
                        >
                          Худалдаж авах
                        </Button>
                        {short > 0 && <p className="text-center text-xs font-semibold text-ink-muted">{short} зоос дутуу</p>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
