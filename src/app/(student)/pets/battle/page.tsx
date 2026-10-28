import type { Metadata } from "next";
import { ElementBadge } from "@/components/pet/ElementBadge";
import { PetSprite } from "@/components/pet/PetSprite";
import { ButtonLink, buttonClass } from "@/components/ui";
import { createGroupBossBattle, joinMyClassBattle, startBossBattle } from "@/lib/battle-actions";
import {
  getActiveGroupBattleId,
  getActiveSoloBattleId,
  getBosses,
  getCurrentPet,
  getOpenClassBattle,
} from "@/lib/data";
import { ArenaBackground } from "./ArenaBackground";
import { RARITY_LABELS } from "./labels";

export const metadata: Metadata = {
  title: "Боссын тулаан · LevelUp",
};

const CLASS_STATUS = {
  lobby: "Багш удахгүй эхлүүлнэ",
  active: "Ангийнхан чинь тулалдаж байна",
  paused: "Багш түр зогсоосон",
};

export default async function BossListPage() {
  const [bosses, pet, activeBattleId, groupBattleId, classBattle] = await Promise.all([
    getBosses(),
    getCurrentPet(),
    getActiveSoloBattleId(),
    getActiveGroupBattleId(),
    getOpenClassBattle(),
  ]);
  const classBoss = classBattle && bosses.find((b) => b.id === classBattle.bossId);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-2 md:px-[clamp(16px,4vw,40px)]">
      <h1 className="text-[40px] leading-none font-bold tracking-[-0.03em] md:text-[56px]">
        Боссын тулаан
      </h1>
      <p className="mt-3 max-w-160 text-ink-muted md:text-lg">
        Англи хэлний асуултад зөв хариулж боссыг ялаарай. Буруу хариулбал тэжээвэр чинь
        гэмтэнэ, босс ч бас үе үе довтолно.
      </p>
      <ButtonLink href="/pets/progress" variant="secondary" size="sm" className="mt-4">
        Миний англи хэлний ахиц
      </ButtonLink>

      {classBattle ? (
        <div className="mt-5 flex flex-col gap-3 rounded-card bg-primary p-4 text-white md:flex-row md:items-center md:justify-between md:p-5">
          <div className="flex items-center gap-3">
            {classBoss ? (
              <PetSprite stage={{ name: classBoss.name, sprite: classBoss.sprite }} size={56} className="shrink-0" />
            ) : null}
            <div>
              <p className="text-lg font-bold">
                {classBattle.classCode} ангийн тулаан{classBoss ? ` · ${classBoss.name}` : ""}
              </p>
              <p className="text-sm text-white/85">
                {CLASS_STATUS[classBattle.status]} · {classBattle.students} сурагч
              </p>
            </div>
          </div>
          {classBattle.joined ? (
            <ButtonLink href={`/pets/battle/${classBattle.id}`} variant="secondary" size="sm">
              Үргэлжлүүлэх
            </ButtonLink>
          ) : (
            <form action={joinMyClassBattle}>
              <button
                type="submit"
                disabled={!pet}
                className={buttonClass({ variant: "secondary", size: "sm", className: "w-full" })}
              >
                Нэгдэх
              </button>
            </form>
          )}
        </div>
      ) : null}

      {activeBattleId ? (
        <div className="mt-5 flex flex-col gap-3 rounded-card bg-surface p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <p className="font-bold">Тулаан үргэлжилж байна.</p>
          <ButtonLink href={`/pets/battle/${activeBattleId}`} size="sm">
            Үргэлжлүүлэх
          </ButtonLink>
        </div>
      ) : null}

      {groupBattleId ? (
        <div className="mt-5 flex flex-col gap-3 rounded-card bg-sky p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <p className="font-bold">Бүлгийн тулаан чинь хүлээж байна.</p>
          <ButtonLink href={`/pets/battle/${groupBattleId}`} size="sm">
            Бүлэг рүү очих
          </ButtonLink>
        </div>
      ) : null}

      {!pet ? (
        <p className="mt-5 rounded-card bg-pink px-5 py-4 font-bold">
          Тулалдахын тулд эхлээд тэжээвэртэй болох хэрэгтэй.
        </p>
      ) : null}

      <ul className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {bosses.map((boss) => (
          <li
            key={boss.id}
            className="flex flex-col gap-4 rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-6"
          >
            <div className="relative h-40 overflow-hidden rounded-card bg-ink">
              <ArenaBackground arena={boss.arena} className="absolute inset-0 size-full" />
              <div aria-hidden="true" className="absolute bottom-2 left-1/2 h-3 w-24 -translate-x-1/2 rounded-[50%] bg-black/30" />
              <PetSprite
                stage={{ name: boss.name, sprite: boss.sprite }}
                size={128}
                className="absolute bottom-3 left-1/2 -translate-x-1/2"
              />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1.5">
                <h2 className="text-2xl leading-tight font-bold">{boss.name}</h2>
                <p className="flex flex-wrap items-center gap-1.5">
                  <span lang="en" className="rounded-full bg-ink px-2.5 py-0.75 text-xs font-bold text-white">
                    {RARITY_LABELS[boss.rarity]}
                  </span>
                  {boss.elements.map((e) => (
                    <ElementBadge key={e} element={e} className="px-2.5 text-xs" />
                  ))}
                </p>
                <p
                  aria-label={`Хүндийн зэрэг ${boss.difficulty}/5`}
                  className="text-sm font-bold tracking-widest text-magenta"
                >
                  {"★".repeat(boss.difficulty)}
                  <span className="text-line">{"★".repeat(5 - boss.difficulty)}</span>
                </p>
              </div>
            </div>
            <p className="text-ink-muted">{boss.description}</p>
            <dl className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-tile bg-surface px-2 py-2">
                <dt className="text-ink-muted">HP</dt>
                <dd className="font-bold">{boss.maxHp}</dd>
              </div>
              <div className="rounded-tile bg-surface px-2 py-2">
                <dt className="text-ink-muted">Довтолгоо</dt>
                <dd className="font-bold">−{boss.attack.damage}</dd>
              </div>
              <div className="rounded-tile bg-surface px-2 py-2">
                <dt className="text-ink-muted">EXP</dt>
                <dd className="font-bold">+{boss.rewards.exp}</dd>
              </div>
            </dl>
            <div className="mt-auto grid grid-cols-2 gap-2">
              <form action={startBossBattle.bind(null, boss.id)}>
                <button
                  type="submit"
                  disabled={!pet || Boolean(activeBattleId)}
                  className={buttonClass({ size: "sm", className: "w-full" })}
                >
                  Ганцаараа
                </button>
              </form>
              <form action={createGroupBossBattle.bind(null, boss.id)}>
                <button
                  type="submit"
                  disabled={!pet || Boolean(groupBattleId)}
                  className={buttonClass({ variant: "secondary", size: "sm", className: "w-full" })}
                >
                  Найзуудтайгаа
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
