"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { checkFormula } from "@/lib/formula";
import { estimateTimings } from "@/lib/reel-timing";
import {
  approveVideoAction,
  publishVideoAction,
  rewriteSectionAction,
  saveScriptAction,
} from "@/lib/teacher-actions";
import type { LessonVideo, ReelScript, ReelSection, ReelSectionKind } from "@/lib/types";
import { ReelPlayer } from "@/remotion/ReelPlayer";
import { AiWorking } from "../../_content/AiWorking";
import { ErrorNote, Label, SourceBadge, VIDEO_STATUS, fieldClass } from "../../_content/ui";
import { classLabel } from "@/lib/class-label";

const KINDS: { id: ReelSectionKind; label: string }[] = [
  { id: "hook", label: "Эхлэл" },
  { id: "step", label: "Алхам" },
  { id: "example", label: "Жишээ" },
  { id: "question", label: "Асуулт" },
];

/**
 * The teacher's reel editor: fix each section, have the AI rewrite one,
 * check the formulas, approve (makes the narration) and publish.
 * `formulasChecked`: the pitch demo's ready reel, whose formulas were checked
 * when it was made, so they start ticked.
 */
export function ReelLab({ video, formulasChecked = false }: { video: LessonVideo; formulasChecked?: boolean }) {
  const id = useId();
  const router = useRouter();
  const [script, setScript] = useState<ReelScript>(video.script);
  const [checked, setChecked] = useState<number[]>(() => (formulasChecked ? video.script.sections.map((_, i) => i) : []));
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [rewritten, setRewritten] = useState<Record<number, "ai" | "demo">>({});
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const locked = video.status === "published";
  const changed = JSON.stringify(script) !== JSON.stringify(video.script);

  const checks = useMemo(() => script.sections.map((s) => (s.formula?.trim() ? checkFormula(s.formula) : undefined)), [script]);
  const wrong = checks.filter((c) => c?.status === "wrong").length;
  const unchecked = checks.filter((c, i) => c?.status === "unknown" && !checked.includes(i)).length;
  // Narration exists only for the approved script; edits preview silently.
  const preview = !changed && video.timings ? { timings: video.timings, audioUrl: video.audioUrl } : { timings: estimateTimings(script) };

  const update = (i: number, patch: Partial<ReelSection>) => {
    setSaved(false);
    setScript((s) => ({ ...s, sections: s.sections.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  };
  const move = (i: number, by: number) =>
    setScript((s) => {
      const sections = [...s.sections];
      const [item] = sections.splice(i, 1);
      sections.splice(i + by, 0, item);
      return { ...s, sections };
    });

  async function run(name: string, task: () => Promise<string | void>) {
    setBusy(name);
    setError(undefined);
    try {
      const problem = await task();
      if (problem) setError(problem);
    } catch {
      setError("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setBusy(undefined);
    }
  }

  const rewrite = (i: number) =>
    run(`rewrite-${i}`, async () => {
      const result = await rewriteSectionAction(video.id, script, i, notes[i] ?? "");
      if (!result) return "Дахин бичиж чадсангүй";
      update(i, result.section);
      setRewritten((r) => ({ ...r, [i]: result.source }));
    });
  const save = () =>
    run("save", async () => {
      const result = await saveScriptAction(video.id, script);
      if (!result.ok) return result.error;
      setSaved(true);
      router.refresh();
    });
  const approve = () =>
    run("approve", async () => {
      const result = await approveVideoAction(video.id, script, checked);
      if (!result.ok) return result.error;
      router.refresh();
    });
  const publish = () =>
    run("publish", async () => {
      await publishVideoAction(video.id);
      router.refresh();
    });

  // A horizontal reel needs the width: its player goes above the editor.
  const wide = script.layout === "horizontal";

  return (
    <div className={cn("grid gap-5 lg:items-start lg:gap-7", !wide && "lg:grid-cols-[minmax(0,1fr)_360px]")}>
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn("rounded-full px-3 py-1 text-sm font-bold", VIDEO_STATUS[video.status].className)}>
              {VIDEO_STATUS[video.status].label}
            </span>
            <span className="text-sm font-bold text-ink-muted">{classLabel(video.classCode)} анги</span>
          </div>
          <Label htmlFor={`${id}-title`}>Гарчиг</Label>
          <input
            id={`${id}-title`}
            value={script.title}
            disabled={locked}
            maxLength={120}
            onChange={(e) => setScript({ ...script, title: e.target.value })}
            className={cn(fieldClass, "h-12 font-bold")}
          />
          {locked && <p className="text-sm text-ink-muted">Нийтэлсэн видеог засахгүй. Өөрчлөх бол шинэ видео бэлдээрэй.</p>}
        </Card>

        <ol className="flex flex-col gap-3">
          {script.sections.map((s, i) => {
            const check = checks[i];
            return (
              <li key={i}>
                <Card className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                    <select
                      aria-label={`${i + 1}-р хэсгийн төрөл`}
                      value={s.kind}
                      disabled={locked}
                      onChange={(e) => update(i, { kind: e.target.value as ReelSectionKind })}
                      className={cn(fieldClass, "h-10 w-auto text-sm font-bold")}
                    >
                      {KINDS.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                    {rewritten[i] && <SourceBadge source={rewritten[i]} />}
                    {!locked && (
                      <span className="ml-auto flex gap-1">
                        <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${i + 1}-р хэсгийг дээш`} className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-surface disabled:opacity-30">
                          ↑
                        </button>
                        <button type="button" disabled={i === script.sections.length - 1} onClick={() => move(i, 1)} aria-label={`${i + 1}-р хэсгийг доош`} className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-surface disabled:opacity-30">
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={script.sections.length <= 3}
                          onClick={() => setScript({ ...script, sections: script.sections.filter((_, j) => j !== i) })}
                          aria-label={`${i + 1}-р хэсгийг устгах`}
                          className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-surface disabled:opacity-30"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                  </div>
                  <input
                    aria-label={`${i + 1}-р хэсгийн дэлгэцийн гарчиг`}
                    value={s.caption}
                    disabled={locked}
                    maxLength={80}
                    placeholder="Дэлгэц дээрх богино гарчиг"
                    onChange={(e) => update(i, { caption: e.target.value })}
                    className={cn(fieldClass, "h-11 font-bold")}
                  />
                  <textarea
                    aria-label={`${i + 1}-р хэсэгт хэлэх үг`}
                    value={s.say}
                    disabled={locked}
                    rows={3}
                    maxLength={600}
                    onChange={(e) => update(i, { say: e.target.value })}
                    className={cn(fieldClass, "py-2.5 text-base leading-relaxed")}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      aria-label={`${i + 1}-р хэсгийн томъёо`}
                      value={s.formula ?? ""}
                      disabled={locked}
                      maxLength={80}
                      placeholder="Томъёо (заавал биш), ж: 1/2 + 1/3 = 5/6"
                      onChange={(e) => update(i, { formula: e.target.value || undefined })}
                      className={cn(fieldClass, "h-11 flex-1 font-bold", check?.status === "wrong" && "border-magenta")}
                    />
                    {check?.status === "ok" && <span className="text-sm font-bold text-primary">✓ Зөв</span>}
                    {check?.status === "wrong" && <span className="text-sm font-bold text-magenta">✗ Зөв нь {check.expected}</span>}
                    {check?.status === "unknown" && (
                      <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
                        <input
                          type="checkbox"
                          checked={checked.includes(i)}
                          onChange={(e) => setChecked(e.target.checked ? [...checked, i] : checked.filter((x) => x !== i))}
                          className="size-5 accent-primary"
                        />
                        Би шалгасан
                      </label>
                    )}
                  </div>
                  {!locked && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        aria-label={`${i + 1}-р хэсгийг юу болгож засах вэ`}
                        value={notes[i] ?? ""}
                        maxLength={200}
                        placeholder="Юуг өөрчлөх вэ? ж: илүү энгийн, амьдралын жишээтэй"
                        onChange={(e) => setNotes({ ...notes, [i]: e.target.value })}
                        className={cn(fieldClass, "h-11 text-base")}
                      />
                      <Button variant="secondary" size="sm" onClick={() => rewrite(i)} disabled={Boolean(busy)} className="shrink-0">
                        {busy === `rewrite-${i}` ? "Бичиж байна…" : "✦ Дахин бичүүлэх"}
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
        {!locked && script.sections.length < 8 && (
          <button
            type="button"
            onClick={() => setScript({ ...script, sections: [...script.sections, { kind: "step", caption: "", say: "" }] })}
            className="self-start cursor-pointer rounded-full border-2 border-dashed border-line px-4 py-2.5 text-sm font-bold text-primary hover:bg-surface"
          >
            + Хэсэг нэмэх
          </button>
        )}
      </div>

      <aside className={cn("flex flex-col items-center gap-3", wide ? "order-first" : "lg:sticky lg:top-24")}>
        <ReelPlayer script={script} timings={preview.timings} audioUrl={preview.audioUrl} />
        <p className="text-center text-xs text-ink-muted">
          {preview.audioUrl ? "Дуу хоолойтой" : changed || video.status === "draft" ? "Дуугүй урьдчилан харах. Зөвшөөрөхөд дуу хоолой үүснэ." : "Дуу хоолой үүсээгүй (ElevenLabs тохируулаагүй)."}
        </p>
        {error && <ErrorNote>{error}</ErrorNote>}
        {busy === "approve" && (
          <AiWorking
            steps={["Монгол дуу хоолой үүсгэж байна"]}
            activity={["Скриптийг хадгалж байна…", "Дуу хоолойгоор уншуулж байна…", "Үг бүрийн цагийг тааруулж байна…", "Бараг боллоо…"]}
            expected="20–60 секунд"
          />
        )}
        {wrong > 0 && <p className="text-center text-sm font-bold text-magenta">{wrong} томъёо буруу байна. Засаад зөвшөөрнө үү.</p>}
        {wrong === 0 && unchecked > 0 && (
          <p className="text-center text-sm font-bold text-ink-muted">Програм шалгаж чадаагүй {unchecked} томъёог өөрөө шалгаад тэмдэглэнэ үү.</p>
        )}
        {!locked && (
          <div className="flex w-full flex-col gap-2">
            {(changed || video.status === "draft") && (
              <Button onClick={approve} disabled={Boolean(busy) || wrong > 0 || unchecked > 0} aria-busy={busy === "approve"}>
                {busy === "approve" ? "Дуу хоолой үүсгэж байна…" : "Зөвшөөрөх"}
              </Button>
            )}
            {video.status === "approved" && !changed && (
              <Button onClick={publish} disabled={Boolean(busy)} aria-busy={busy === "publish"}>
                {busy === "publish" ? "Нийтэлж байна…" : `${classLabel(video.classCode)} ангид нийтлэх`}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={save} disabled={Boolean(busy) || !changed}>
              {busy === "save" ? "Хадгалж байна…" : saved && !changed ? "Хадгалсан ✓" : "Ноорог хадгалах"}
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}
