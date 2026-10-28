import type { Metadata } from "next";
import { PetSprite } from "@/components/pet/PetSprite";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getBattleHistory, getBosses } from "@/lib/data";
import type { BattleHistoryEntry, BattleResult } from "@/lib/types";
import { RARITY_LABELS } from "../battle/labels";
import { PixelEgg } from "../PixelEgg";

export const metadata: Metadata = {
  title: "Тулааны түүх · LevelUp",
};

const MODES: Record<BattleHistoryEntry["mode"], string> = {
  solo: "Ганцаараа",
  group: "Бүлэг",
  class: "Анги",
};

const RESULTS: Record<BattleResult, { label: string; className: string }> = {
  won: { label: "Ялалт", className: "bg-primary text-white" },
  lost: { label: "Ялагдсан", className: "bg-pink text-ink" },
  left: { label: "Гарсан", className: "bg-surface text-ink-muted" },
  stopped: { label: "Багш дуусгасан", className: "bg-surface text-ink-muted" },
};

const when = new Intl.DateTimeFormat("mn-MN", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ulaanbaatar",
});

/** Every finished boss battle: how it went, what the student added, what they won. */
export default async function BattleHistoryPage() {
  const [history, bosses] = await Promise.all([getBattleHistory(), getBosses()]);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-2 md:px-[clamp(16px,4vw,40px)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[40px] leading-none font-bold tracking-[-0.03em] md:text-[56px]">Тулааны түүх</h1>
          <p className="mt-3 text-ink-muted md:text-lg">Ялалт, шагнал, тулаан бүрт оруулсан хувь нэмэр.</p>
        </div>
        <ButtonLink href="/pets/battle" size="sm">
          Тулалдах
        </ButtonLink>
      </div>

      {!history || history.battles === 0 ? (
        <p className="mt-8 rounded-panel bg-surface px-6 py-10 text-center text-lg font-bold">
          Одоогоор дууссан тулаан алга. Боссуудтай тулалдаад түүхээ эндээс хараарай.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-5 md:mt-8 md:gap-6">
          <section aria-label="Нийт" className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            {[
              ["Тулаан", history.battles],
              ["Ялалт", history.victories],
              ["Нийт хохирол", history.damage],
              ["Өндөг", history.eggs],
              ["Шилдэг комбо", `×${history.bestCombo}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-card bg-white p-4 shadow-card">
                <p className="text-sm text-ink-muted">{label}</p>
                <p className="text-3xl font-bold">{value}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="battles-title" className="rounded-panel bg-white p-5 shadow-card md:p-7">
            <h2 id="battles-title" className="text-2xl font-bold">
              Сүүлийн тулаанууд
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {history.entries.map((e) => {
                const boss = bosses.find((b) => b.id === e.bossId);
                const result = RESULTS[e.result];
                const share = e.teamSize > 1 && e.teamDamage > 0 ? Math.round((e.damage / e.teamDamage) * 100) : null;
                return (
                  <li
                    key={e.battleId}
                    className="flex flex-col gap-3 rounded-card bg-surface p-3 md:flex-row md:items-center md:gap-4 md:p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {boss ? (
                        <PetSprite stage={{ name: boss.name, sprite: boss.sprite }} size={56} className="shrink-0" />
                      ) : null}
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-lg font-bold">{boss?.name ?? e.bossId}</span>
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", result.className)}>
                            {result.label}
                          </span>
                        </p>
                        <p className="text-sm text-ink-muted">
                          {MODES[e.mode]}
                          {e.teamSize > 1 ? ` · ${e.teamSize} хүн` : ""} · {when.format(new Date(e.date))}
                        </p>
                      </div>
                    </div>
                    <dl className="grid grid-cols-3 gap-2 text-center text-sm md:w-80">
                      <div className="rounded-tile bg-white px-2 py-1.5">
                        <dt className="text-ink-muted">Хохирол</dt>
                        <dd className="font-bold">
                          {e.damage}
                          {share !== null ? <span className="font-semibold text-ink-muted"> · {share}%</span> : null}
                        </dd>
                      </div>
                      <div className="rounded-tile bg-white px-2 py-1.5">
                        <dt className="text-ink-muted">Зөв / буруу</dt>
                        <dd className="font-bold">
                          {e.correct} / {e.wrong}
                        </dd>
                      </div>
                      <div className="rounded-tile bg-white px-2 py-1.5">
                        <dt className="text-ink-muted">Комбо</dt>
                        <dd className="font-bold">×{e.bestCombo}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center gap-2 md:w-44 md:justify-end">
                      {e.rewards ? (
                        <>
                          <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm font-bold text-white">
                            +{e.rewards.exp} EXP
                          </span>
                          {e.rewards.egg ? (
                            <span className="inline-flex items-center gap-1 text-sm font-bold">
                              <PixelEgg rarity={e.rewards.egg} size={24} />
                              <span className="sr-only">
                                <span lang="en">{RARITY_LABELS[e.rewards.egg]}</span> өндөг
                              </span>
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-sm text-ink-muted">Шагналгүй</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
