"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { Button, ButtonLink } from "@/components/ui";
import { leaveBossBattle, refreshBattle, startGroupBossBattle } from "@/lib/battle-actions";
import { petStage } from "@/lib/pets";
import { useBattleChannel } from "@/lib/realtime";
import type { BattleState, Boss, PetLine } from "@/lib/types";
import { ArenaBackground } from "../ArenaBackground";
import { Backdrop } from "./Backdrop";

type LobbyScreenProps = {
  initial: BattleState;
  boss: Pick<Boss, "name" | "sprite" | "arena" | "maxHp" | "hpPerExtraPlayer">;
  lines: PetLine[];
};

/** Fallback refresh if a Realtime message is missed. */
const POLL_MS = 3000;
const MAX_PLAYERS = 5;

const START_ERRORS: Record<string, string> = {
  need_two: "Эхлүүлэхэд дор хаяж 2 хүн хэрэгтэй.",
  not_host: "Зөвхөн хост эхлүүлж чадна.",
  started: "Тулаан аль хэдийн эхэлсэн.",
};

/** A group battle before it starts: the code to share, who's in, and the host's start button. */
export function LobbyScreen({ initial, boss, lines }: LobbyScreenProps) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const next = await refreshBattle(initial.id);
      if (!next) return;
      setState(next);
      // Started: the page shows the battle instead.
      if (next.status === "active") router.refresh();
    } catch {
      // Offline for a moment; the next refresh tries again.
    }
  }, [initial.id, router]);

  useBattleChannel(initial.id, refresh);

  useEffect(() => {
    if (state.status !== "lobby") return;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [state.status, refresh]);

  const members = state.team.filter((m) => !m.left);
  const bossHp = Math.round(boss.maxHp * (1 + boss.hpPerExtraPlayer * (members.length - 1)));

  async function copyCode() {
    if (!state.joinCode) return;
    try {
      await navigator.clipboard.writeText(state.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard access: the code is on screen to read out.
    }
  }

  function start() {
    setError(null);
    startTransition(async () => {
      const r = await startGroupBossBattle(state.id);
      if (r.error) setError(START_ERRORS[r.error] ?? "Эхлүүлж чадсангүй.");
      else router.refresh();
    });
  }

  if (state.status === "ended") {
    return (
      <>
        <Backdrop arena={boss.arena} />
        <section className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-panel bg-white px-6 py-8 text-center shadow-float">
          <h1 className="text-2xl font-bold">Лобби хаагдсан</h1>
          <p className="text-ink-muted">Хост энэ бүлгийг хаасан байна.</p>
          <ButtonLink href="/pets/battle">Боссууд руу буцах</ButtonLink>
        </section>
      </>
    );
  }

  return (
    <>
      <Backdrop arena={boss.arena} />
      <section
        aria-labelledby="lobby-title"
        className="mx-auto mt-2 flex max-w-2xl flex-col gap-5 overflow-hidden rounded-panel bg-white pb-6 shadow-float md:mt-6"
      >
        <div className="relative h-40 overflow-hidden bg-ink md:h-48">
          <ArenaBackground arena={boss.arena} className="absolute inset-0 size-full" />
          <PetSprite
            stage={{ name: boss.name, sprite: boss.sprite }}
            size={128}
            className="absolute bottom-3 left-1/2 -translate-x-1/2"
          />
        </div>

        <div className="flex flex-col items-center gap-2 px-5 text-center md:px-8">
          <h1 id="lobby-title" className="text-2xl font-bold md:text-[32px]">
            {boss.name} · Бүлгийн тулаан
          </h1>
          <p className="text-ink-muted">Найзууддаа кодоо өг. Тэд «Нэгдэх» хэсэгт оруулна.</p>
          <div className="mt-2 flex items-center gap-3">
            <p
              aria-label={`Нэгдэх код ${state.joinCode?.split("").join(" ")}`}
              className="rounded-tile border-3 border-dashed border-primary bg-surface px-5 py-2 font-mono text-3xl font-bold tracking-[0.3em] md:text-4xl"
            >
              {state.joinCode}
            </p>
            <Button variant="secondary" size="sm" onClick={copyCode}>
              {copied ? "Хуулсан" : "Хуулах"}
            </Button>
          </div>
        </div>

        <div className="px-5 md:px-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Багийнхан</h2>
            <p className="text-sm text-ink-muted">
              {members.length}/{MAX_PLAYERS} · Боссын HP {bossHp}
            </p>
          </div>
          <ul aria-live="polite" className="mt-3 grid gap-2 md:grid-cols-2">
            {members.map((m) => {
              const line = lines.find((l) => l.id === m.lineId);
              return (
                <li key={m.username} className="flex items-center gap-3 rounded-tile bg-surface p-2.5">
                  {line ? <PetSprite stage={petStage(line, m.level ?? 1)} size={48} /> : null}
                  <span className="min-w-0 flex-1 truncate font-bold">
                    {m.username}
                    {m.me ? <span className="text-ink-muted"> (чи)</span> : null}
                  </span>
                  {m.host ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">Хост</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-3 px-5 md:flex-row md:items-center md:justify-between md:px-8">
          <form action={leaveBossBattle.bind(null, state.id)}>
            <Button type="submit" variant="secondary" className="w-full md:w-auto">
              {state.isHost ? "Лобби хаах" : "Гарах"}
            </Button>
          </form>
          {state.isHost ? (
            <Button onClick={start} disabled={starting || members.length < 2} className="w-full md:w-auto">
              {members.length < 2 ? "2 хүн хүлээж байна…" : "Эхлүүлэх"}
            </Button>
          ) : (
            <p role="status" className="text-center font-bold text-ink-muted">
              Хост эхлүүлэхийг хүлээж байна…
            </p>
          )}
        </div>
        {error ? (
          <p role="alert" className="mx-5 rounded-tile border-2 border-magenta bg-pink px-4 py-3 font-semibold md:mx-8">
            {error}
          </p>
        ) : null}
      </section>
    </>
  );
}
