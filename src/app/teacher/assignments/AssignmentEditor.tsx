"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Button, Card, PixelIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MAX_ANSWER_LENGTH, checkQuestion, suggestGames } from "@/lib/gamefit";
import {
  type AssignmentDraftInput,
  generateQuestionsAction,
  recognizeMaterialAction,
  saveAssignmentAction,
} from "@/lib/teacher-actions";
import type { Assignment, ClassOption, CurriculumChapter, GameQuestion, Subtopic } from "@/lib/types";
import { AiWorking } from "../_content/AiWorking";
import { MaterialForm } from "../_content/MaterialForm";
import { ErrorNote, Label, SourceBadge, StepTitle, SubjectField, fieldClass } from "../_content/ui";

type EditableQuestion = {
  key: string;
  prompt: string;
  correct: string[];
  wrong: string[];
  explanation: string;
};

const QUESTION_ACTIVITY = [
  "Асуултуудыг бодож байна…",
  "Зөв хариултуудыг тооцоолж байна…",
  "Буруу хариултыг түгээмэл алдаанаас сонгож байна…",
  "Тайлбар бичиж байна…",
  "Бараг боллоо…",
];

const answerText = (a: GameQuestion["correct"][number]) => (typeof a === "string" ? a : a.name);
const toEditable = (q: Pick<GameQuestion, "prompt" | "correct" | "wrong" | "explanation">, key: string): EditableQuestion => ({
  key,
  prompt: q.prompt,
  correct: [0, 1, 2].map((i) => answerText(q.correct[i] ?? "")),
  wrong: [0, 1, 2].map((i) => answerText(q.wrong[i] ?? "")),
  explanation: q.explanation,
});
const blank = (): EditableQuestion => toEditable({ prompt: "", correct: [], wrong: [], explanation: "" }, `b-${Math.random()}`);

type AssignmentEditorProps = {
  curriculum: CurriculumChapter[];
  /** The teacher's classes, the current one first */
  classes: ClassOption[];
  /** Subtopics with diagnostic results, for "only weak students" */
  subtopics: Subtopic[];
  /** Editing an existing assignment */
  initial?: { assignment: Assignment; questions: GameQuestion[] };
  /** The subject the teacher teaches; everything they make is in it. */
  teacherSubject?: string;
  /** Starting from a lesson video: its material, topic and class. */
  fromVideo?: { videoTitle: string; materialId: string; topic: string; classCode: string };
};

/**
 * Making a game assignment: get questions from a topic or the teacher's
 * material, edit them (checked as you type), pick games, then publish.
 */
export function AssignmentEditor({ curriculum, classes, subtopics, initial, teacherSubject, fromVideo }: AssignmentEditorProps) {
  const id = useId();
  const router = useRouter();
  const a = initial?.assignment;
  const [mode, setMode] = useState<"topic" | "material">("topic");
  const [topic, setTopic] = useState(a?.title ?? fromVideo?.topic ?? "");
  const [subject, setSubject] = useState(teacherSubject ?? a?.subject ?? "math");
  const [count, setCount] = useState(6);
  const [materialId, setMaterialId] = useState(fromVideo?.materialId);
  const [linkedVideo, setLinkedVideo] = useState(fromVideo?.videoTitle);
  const [questions, setQuestions] = useState<EditableQuestion[]>(() =>
    (initial?.questions ?? []).map((q) => toEditable(q, q.id)),
  );
  const [source, setSource] = useState<"ai" | "demo">();
  const [games, setGames] = useState<string[]>(a?.games ?? []);
  const [gameMode, setGameMode] = useState(a?.gameMode ?? "fixed");
  const [title, setTitle] = useState(a?.title ?? fromVideo?.videoTitle ?? "");
  const [classCode, setClassCode] = useState(a?.classCode ?? fromVideo?.classCode ?? classes[0]?.code ?? "");
  // A class the teacher no longer has (e.g. an old assignment's) still shows as picked.
  const startCode = a?.classCode ?? fromVideo?.classCode;
  const options =
    startCode && !classes.some((c) => c.code === startCode) ? [...classes, { code: startCode, name: startCode }] : classes;
  const [dueAt, setDueAt] = useState(a?.dueAt?.slice(0, 10) ?? "");
  const [target, setTarget] = useState(a?.target ?? "class");
  const [targetSubtopicId, setTargetSubtopicId] = useState(a?.targetSubtopicId ?? subtopics[0]?.id ?? "");
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  const asGameQuestions = (qs: EditableQuestion[]) =>
    qs.map((q) => ({ id: q.key, prompt: q.prompt, correct: q.correct, wrong: q.wrong, explanation: q.explanation }));
  const fits = useMemo(() => suggestGames(asGameQuestions(questions)), [questions]);
  const issues = useMemo(() => questions.map(checkQuestion), [questions]);
  const errorCount = issues.filter((list) => list.some((i) => i.level === "error")).length;

  /** `topicNow`: a topic just set (state updates come later), e.g. the one found in a material. */
  async function generate(fromMaterialId?: string, topicNow = topic) {
    setBusy("generate");
    setError(undefined);
    try {
      const result = await generateQuestionsAction({ topic: topicNow, subject, count, materialId: fromMaterialId ?? materialId });
      setQuestions(result.questions.map((q) => toEditable(q, q.id)));
      setSource(result.source);
      setTitle((t) => t || topicNow);
      // Start with the best-fitting games picked.
      setGames(suggestGames(result.questions).filter((g) => g.fit === "best").slice(0, 2).map((g) => g.id));
    } catch {
      setError("Асуулт гаргаж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setBusy(undefined);
    }
  }

  async function regenerateRow(index: number) {
    setBusy(`row-${index}`);
    try {
      const result = await generateQuestionsAction({ topic: topic || title, subject, count: 3, materialId });
      const existing = new Set(questions.map((q) => q.prompt));
      const fresh = result.questions.find((q) => !existing.has(q.prompt)) ?? result.questions[0];
      if (fresh) setQuestions((qs) => qs.map((q, i) => (i === index ? toEditable(fresh, fresh.id) : q)));
    } finally {
      setBusy(undefined);
    }
  }

  const update = (index: number, patch: Partial<EditableQuestion>) =>
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  const setAnswer = (index: number, list: "correct" | "wrong", slot: number, value: string) =>
    setQuestions((qs) =>
      qs.map((q, i) => (i === index ? { ...q, [list]: q[list].map((x, j) => (j === slot ? value : x)) } : q)),
    );

  async function save(publish: boolean) {
    setBusy(publish ? "publish" : "save");
    setError(undefined);
    const input: AssignmentDraftInput = {
      title,
      classCode,
      subject,
      materialId,
      games,
      gameMode,
      target,
      targetSubtopicId: target === "weak" ? targetSubtopicId : undefined,
      dueAt: dueAt || undefined,
      questions: questions.map(({ prompt, correct, wrong, explanation }) => ({ prompt, correct, wrong, explanation })),
    };
    const result = await saveAssignmentAction(input, { id: a?.id, publish });
    setBusy(undefined);
    if (!result.ok) return setError(result.error);
    router.push(`/teacher/assignments/${result.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5 md:gap-7">
      {/* 1. Where the questions come from */}
      <Card className="flex flex-col gap-4">
        <StepTitle n={1} done={questions.length > 0}>
          Асуулт гаргах
        </StepTitle>
        {linkedVideo && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface px-4 py-3">
            <p className="font-semibold">
              <PixelIcon name="clapper" className="inline-block size-4 align-[-0.15em]" /> «{linkedVideo}» видеоны материалаас асуулт гаргана. «AI асуулт гаргах» дээр дарна уу.
            </p>
            <button
              type="button"
              onClick={() => {
                setLinkedVideo(undefined);
                setMaterialId(undefined);
              }}
              className="min-h-11 cursor-pointer rounded-full px-3 text-sm font-bold text-primary hover:bg-white"
            >
              Видеоноос салгах
            </button>
          </div>
        )}
        <div role="tablist" aria-label="Эх сурвалж" className="flex gap-2">
          {(
            [
              ["topic", "Сэдвээр"],
              ["material", "Ном, файл, текстээс"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "min-h-11 cursor-pointer rounded-full px-4 text-sm font-bold",
                mode === value ? "bg-primary text-white" : "bg-surface text-ink hover:bg-lavender",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "topic" ? (
          <>
            <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_8rem_auto] md:items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-topic`}>Сэдэв</Label>
                <input
                  id={`${id}-topic`}
                  list={`${id}-topics`}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={120}
                  placeholder="Жишээ нь: Ялгаатай хуваарьтай бутархай нэмэх"
                  className={cn(fieldClass, "h-12")}
                />
                <datalist id={`${id}-topics`}>
                  {curriculum.flatMap((ch) => ch.lessons.map((l) => <option key={`${ch.order}-${l}`} value={l} />))}
                </datalist>
              </div>
              <SubjectField id={`${id}-subject`} value={subject} locked={Boolean(teacherSubject)} onChange={setSubject} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-count`}>Тоо</Label>
                <input id={`${id}-count`} type="number" min={3} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} className={cn(fieldClass, "h-12")} />
              </div>
              <Button size="sm" onClick={() => generate()} disabled={!topic.trim() || busy === "generate"} aria-busy={busy === "generate"}>
                {busy === "generate" ? "Гаргаж байна…" : "✦ AI асуулт гаргах"}
              </Button>
            </div>
            {busy === "generate" && (
              <AiWorking steps={[`«${topic}» сэдвээр асуулт гаргаж байна`]} activity={QUESTION_ACTIVITY} expected="5–20 секунд" />
            )}
          </>
        ) : (
          <MaterialForm
            curriculum={curriculum}
            classes={classes}
            teacherSubject={teacherSubject}
            submitLabel="✦ Материалаас асуулт гаргах"
            onSubmit={async (input, progress) => {
              const { materialId: newId, recognition } = await recognizeMaterialAction(input);
              setLinkedVideo(undefined);
              progress("Асуулт гаргаж байна", QUESTION_ACTIVITY);
              setMaterialId(newId);
              setTopic(recognition.value.topic);
              setSubject(input.subject ?? "math");
              await generate(newId, recognition.value.topic);
            }}
          />
        )}
      </Card>

      {/* 2. The questions, checked as the teacher edits */}
      {questions.length > 0 && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StepTitle n={2} done={errorCount === 0}>
              Асуултаа шалгах, засах
            </StepTitle>
            {source && <SourceBadge source={source} />}
          </div>
          <p className="text-sm text-ink-muted">
            Асуулт бүрд яг 3 зөв, 3 буруу хариулт. Буруу хариулт нь сурагчдын түгээмэл алдаа байвал тоглоомын тайлбар илүү үр дүнтэй. Хариулт {MAX_ANSWER_LENGTH} тэмдэгтээс богино.
          </p>
          <ol className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <li key={q.key} className={cn("rounded-card border-2 p-3 md:p-4", issues[i].some((x) => x.level === "error") ? "border-magenta/60 bg-pink/40" : "border-surface bg-white")}>
                {/* Phones: number and buttons on top, the question full width below. */}
                <div className="flex flex-wrap items-start gap-2 md:flex-nowrap">
                  <span aria-hidden="true" className="mt-2.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-lavender text-xs font-bold">
                    {i + 1}
                  </span>
                  <textarea
                    aria-label={`${i + 1}-р асуулт`}
                    value={q.prompt}
                    rows={1}
                    maxLength={200}
                    onChange={(e) => update(i, { prompt: e.target.value })}
                    className={cn(fieldClass, "order-last min-h-12 basis-full resize-none py-2.5 font-bold field-sizing-content md:order-none md:basis-auto")}
                  />
                  <button type="button" onClick={() => regenerateRow(i)} disabled={busy === `row-${i}`} aria-label={`${i + 1}-р асуултыг дахин үүсгэх`} title="Дахин үүсгэх" className="ml-auto flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary hover:bg-surface disabled:opacity-50">
                    {busy === `row-${i}` ? "…" : "↻"}
                  </button>
                  <button type="button" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} aria-label={`${i + 1}-р асуултыг устгах`} className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-surface">
                    ✕
                  </button>
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-2 md:pl-9">
                  {(["correct", "wrong"] as const).map((list) => (
                    <fieldset key={list} className="flex flex-col gap-1.5">
                      <legend className={cn("mb-1 text-xs font-bold", list === "correct" ? "text-primary" : "text-magenta")}>
                        {list === "correct" ? "Зөв хариулт" : "Буруу хариулт (түгээмэл алдаа)"}
                      </legend>
                      <div className="grid grid-cols-3 gap-1.5">
                        {q[list].map((ans, slot) => (
                          <input
                            key={slot}
                            aria-label={`${i + 1}-р асуулт, ${list === "correct" ? "зөв" : "буруу"} ${slot + 1}`}
                            value={ans}
                            maxLength={MAX_ANSWER_LENGTH}
                            onChange={(e) => setAnswer(i, list, slot, e.target.value)}
                            className={cn(fieldClass, "h-11 px-2.5 text-center font-bold", list === "correct" ? "border-sky bg-[#f5fcff]" : "border-pink")}
                          />
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <input
                    aria-label={`${i + 1}-р асуултын тайлбар`}
                    value={q.explanation}
                    maxLength={400}
                    placeholder="Буруу хариулсан үед харагдах тайлбар"
                    onChange={(e) => update(i, { explanation: e.target.value })}
                    className={cn(fieldClass, "h-11 text-base md:col-span-2")}
                  />
                </div>
                {issues[i].length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5 md:pl-9">
                    {issues[i].map((issue) => (
                      <li key={issue.message} className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", issue.level === "error" ? "bg-magenta text-white" : "bg-surface text-ink-muted")}>
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setQuestions([...questions, blank()])} className="self-start cursor-pointer rounded-full border-2 border-dashed border-line px-4 py-2.5 text-sm font-bold text-primary hover:bg-surface">
            + Асуулт нэмэх
          </button>
        </Card>
      )}

      {/* 3. Games */}
      {questions.length > 0 && (
        <Card className="flex flex-col gap-4">
          <StepTitle n={3} done={games.length > 0}>
            Тоглоом сонгох
          </StepTitle>
          <div role="radiogroup" aria-label="Тоглоом сонгох арга" className="flex flex-wrap gap-2">
            {(
              [
                ["fixed", "Би сонгоно"],
                ["interest", "Сурагчийн сонирхлоор"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={gameMode === value}
                onClick={() => setGameMode(value)}
                className={cn("min-h-11 cursor-pointer rounded-full px-4 text-sm font-bold", gameMode === value ? "bg-primary text-white" : "bg-surface hover:bg-lavender")}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-muted">
            {gameMode === "fixed"
              ? "1–3 тоглоом сонгоно. Сурагч эхнийхийг нь нээнэ."
              : "1–3 тоглоом сонгоно. Сурагч бүр эдгээрээс өөрийн дуртайгаар нь тоглоно."}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {fits.map((g) => {
              const on = games.includes(g.id);
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={!on && games.length >= 3}
                    onClick={() => setGames(on ? games.filter((x) => x !== g.id) : [...games, g.id])}
                    className={cn(
                      "flex h-full w-full cursor-pointer flex-col items-start gap-1 rounded-card border-2 p-3 text-left disabled:cursor-default disabled:opacity-50",
                      on ? "border-primary bg-surface" : "border-lavender bg-white hover:border-primary",
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2 font-bold">
                      {g.title} {on && <span className="text-primary">✓</span>}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", g.fit === "best" ? "bg-sky" : g.fit === "ok" ? "bg-lavender" : "bg-pink")}>
                      {g.fit === "best" ? "Хамгийн тохиромжтой" : g.fit === "ok" ? "Тохирно" : "Тохиромж муу"}
                    </span>
                    <span className="text-xs text-ink-muted">{g.reason}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* 4. Publish */}
      {questions.length > 0 && (
        <Card className="flex flex-col gap-4">
          <StepTitle n={4}>Ангид нийтлэх</StepTitle>
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-title`}>Даалгаврын нэр</Label>
              <input id={`${id}-title`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={cn(fieldClass, "h-12")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-class`}>Анги</Label>
              <select
                id={`${id}-class`}
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className={cn(fieldClass, "h-12 font-bold")}
              >
                {options.length === 0 && <option value="">Анги алга</option>}
                {options.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-due`} hint="заавал биш">
                Хугацаа
              </Label>
              <input id={`${id}-due`} type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={cn(fieldClass, "h-12")} />
            </div>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold">Хэнд</legend>
            <label className="flex min-h-11 items-center gap-2 font-semibold">
              <input type="radio" name={`${id}-target`} checked={target === "class"} onChange={() => setTarget("class")} className="size-5 accent-primary" />
              Бүх анги
            </label>
            <label className="flex min-h-11 flex-wrap items-center gap-2 font-semibold">
              <input type="radio" name={`${id}-target`} checked={target === "weak"} onChange={() => setTarget("weak")} disabled={subtopics.length === 0} className="size-5 accent-primary" />
              Зөвхөн энэ сэдэв дээр сул сурагчид:
              <select
                aria-label="Сэдэв"
                value={targetSubtopicId}
                onChange={(e) => setTargetSubtopicId(e.target.value)}
                disabled={target !== "weak"}
                className={cn(fieldClass, "h-11 w-auto")}
              >
                {subtopics.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-ink-muted">Сул эсэхийг сурагчийн оношлох тестээр тодорхойлно. Хэн болохыг багшид харуулахгүй.</p>
          </fieldset>

          {error && <ErrorNote>{error}</ErrorNote>}
          {errorCount > 0 && <p className="text-sm font-bold text-magenta">{errorCount} асуултад алдаа байгаа тул нийтлэх боломжгүй.</p>}
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => save(false)} disabled={Boolean(busy)}>
              {busy === "save" ? "Хадгалж байна…" : "Ноорог хадгалах"}
            </Button>
            <Button size="sm" onClick={() => save(true)} disabled={Boolean(busy) || errorCount > 0 || games.length === 0}>
              {busy === "publish" ? "Нийтэлж байна…" : "Ангид нийтлэх"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
