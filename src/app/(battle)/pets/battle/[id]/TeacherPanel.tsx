"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { controlClassBossBattle } from "@/lib/battle-actions";
import type { BattleState } from "@/lib/types";

type TeacherPanelProps = {
  state: BattleState;
  /** Called after a control went through, to fetch the new state. */
  onChanged: () => void;
};

const ERRORS: Record<string, string> = {
  need_one: "Дор хаяж нэг сурагч нэгдэх хэрэгтэй.",
  not_host: "Энэ тулааныг зөвхөн нээсэн багш удирдана.",
  started: "Тулаан аль хэдийн эхэлсэн.",
  not_active: "Тулаан явагдаагүй байна.",
  not_paused: "Тулаан зогсоогүй байна.",
  over: "Тулаан дууссан байна.",
};

/**
 * The teacher's strip in the middle of the arena: the join code for the
 * class, who is taking part, and start / pause / resume / end.
 */
export function TeacherPanel({ state, onChanged }: TeacherPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const endDialog = useRef<HTMLDialogElement>(null);

  const present = state.team.filter((m) => !m.left);
  const damage = state.team.reduce((sum, m) => sum + m.damage, 0);
  const correct = state.team.reduce((sum, m) => sum + m.correct, 0);
  const standing = present.filter((m) => m.petHp > 0).length;

  function control(action: "start" | "pause" | "resume" | "end") {
    setError(null);
    endDialog.current?.close();
    startTransition(async () => {
      const r = await controlClassBossBattle(state.id, action);
      if (r.error) setError(ERRORS[r.error] ?? "Болсонгүй. Дахин оролдоно уу.");
      onChanged();
    });
  }

  return (
    <section aria-label="Тулааны удирдлага" className="rounded-card bg-white p-3.5 shadow-float md:p-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div>
          <p className="text-xs font-bold text-ink-muted md:text-sm">
            {state.classCode} анги · Нэгдэх код
          </p>
          <p
            aria-label={`Нэгдэх код ${state.joinCode?.split("").join(" ")}`}
            className="font-mono text-3xl leading-tight font-bold tracking-[0.25em] text-primary md:text-4xl"
          >
            {state.joinCode}
          </p>
          <p className="text-xs text-ink-muted md:text-sm">
            Сурагчид «Нэгдэх» хэсэгт энэ кодыг эсвэл «{state.classCode}» гэж оруулна.
          </p>
        </div>
        <dl className="grid flex-1 grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-tile bg-surface px-2 py-1.5">
            <dt className="text-ink-muted">Сурагч</dt>
            <dd className="text-lg font-bold">
              {state.status === "lobby" ? present.length : `${standing}/${present.length}`}
            </dd>
          </div>
          <div className="rounded-tile bg-surface px-2 py-1.5">
            <dt className="text-ink-muted">Хохирол</dt>
            <dd className="text-lg font-bold">{damage}</dd>
          </div>
          <div className="rounded-tile bg-surface px-2 py-1.5">
            <dt className="text-ink-muted">Зөв</dt>
            <dd className="text-lg font-bold">{correct}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {state.status === "lobby" ? (
          <>
            <Button size="sm" onClick={() => control("start")} disabled={busy || present.length === 0}>
              Эхлүүлэх
            </Button>
            <p role="status" className="text-sm font-bold text-ink-muted">
              {present.length === 0 ? "Сурагчид нэгдэхийг хүлээж байна…" : `${present.length} сурагч бэлэн`}
            </p>
          </>
        ) : null}
        {state.status === "active" ? (
          <Button size="sm" variant="secondary" onClick={() => control("pause")} disabled={busy}>
            Түр зогсоох
          </Button>
        ) : null}
        {state.status === "paused" ? (
          <Button size="sm" onClick={() => control("resume")} disabled={busy}>
            Үргэлжлүүлэх
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          className="ml-auto"
          onClick={() => endDialog.current?.showModal()}
          disabled={busy}
        >
          Дуусгах
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-tile border-2 border-magenta bg-pink px-4 py-2 text-sm font-semibold">
          {error}
        </p>
      ) : null}

      <dialog
        ref={endDialog}
        aria-labelledby="end-title"
        className="fixed inset-0 m-auto h-fit w-[min(420px,calc(100%-32px))] rounded-panel bg-white p-6 text-ink shadow-float backdrop:bg-ink/40 md:p-8"
      >
        <h2 id="end-title" className="text-xl leading-tight font-bold md:text-2xl">
          Тулааныг дуусгах уу?
        </h2>
        <p className="mt-2 text-ink-muted">Босс ялагдаагүй тул сурагчид шагнал авахгүй.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <Button variant="secondary" size="sm" autoFocus onClick={() => endDialog.current?.close()}>
            Үргэлжлүүлэх
          </Button>
          <Button size="sm" onClick={() => control("end")}>
            Дуусгах
          </Button>
        </div>
      </dialog>
    </section>
  );
}
