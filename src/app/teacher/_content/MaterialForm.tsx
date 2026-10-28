"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MaterialInput } from "@/lib/teacher-actions";
import type { ClassOption, CurriculumChapter } from "@/lib/types";
import { uploadMaterialFiles } from "@/lib/upload-client";
import { ACCEPT_UPLOADS, MAX_UPLOAD_FILES, uploadProblem } from "@/lib/uploads";
import { AiWorking } from "./AiWorking";
import { ErrorNote, Label, SubjectField, fieldClass } from "./ui";

type MaterialFormProps = {
  curriculum: CurriculumChapter[];
  /** The teacher's classes, the current one first */
  classes: ClassOption[];
  /** Asks for the class too (videos are made for one class). */
  withClass?: boolean;
  submitLabel: string;
  /**
   * Called after the files are uploaded. `progress` adds a step to the
   * loading panel (e.g. writing questions after reading).
   */
  onSubmit: (input: MaterialInput, progress: Progress) => Promise<void>;
  /** The subject the teacher teaches; fixed when set. */
  teacherSubject?: string;
};

export type Progress = (step: string, activity: string[]) => void;
type Step = { label: string; activity: string[] };

const UPLOAD_STEP: Step = { label: "Файлуудыг илгээж байна", activity: ["Файлуудыг аюулгүй хадгалж байна…"] };
const readStep = (hasImages: boolean): Step => ({
  label: "AI материалыг уншиж байна",
  activity: [
    hasImages ? "Зураг дээрх текст, томъёог уншиж байна…" : "Текстийг уншиж байна…",
    "Сэдвийг тодорхойлж байна…",
    "Гол ойлголтуудыг ялгаж байна…",
    "Жишээ бодлогуудыг олж байна…",
    "Сурагчдын түгээмэл алдааг бодож байна…",
    "Бараг боллоо…",
  ],
});

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

/**
 * A lesson topic plus any mix of text, book page photos, screenshots, PDFs
 * and .txt files. Files go to Storage when the teacher submits.
 */
export function MaterialForm({ curriculum, classes, withClass, submitLabel, onSubmit, teacherSubject }: MaterialFormProps) {
  const id = useId();
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState(7);
  const [subject, setSubject] = useState(teacherSubject ?? "math");
  const [classCode, setClassCode] = useState(classes[0]?.code ?? "");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, MAX_UPLOAD_FILES);
    const problem = next.map((f) => uploadProblem({ name: f.name, mime: f.type, size: f.size })).find(Boolean);
    setError(problem);
    if (!problem) setFiles(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // With text or files the AI finds the topic; with neither there is nothing to go on.
    if (!topic.trim() && !text.trim() && files.length === 0) {
      return setError("Сэдвээ бичих эсвэл текст, файл оруулна уу");
    }
    if (withClass && !classCode.trim()) return setError("Ангийн кодоо бичнэ үү");
    setBusy(true);
    setError(undefined);
    const addStep = (step: Step) => setSteps((all) => [...all, step]);
    setSteps(files.length ? [UPLOAD_STEP] : []);
    try {
      const uploaded = await uploadMaterialFiles(files);
      addStep(readStep(files.some((f) => f.type.startsWith("image/"))));
      await onSubmit({ topicTitle: topic, grade, subject, classCode, text, files: uploaded }, (label, activity) =>
        addStep({ label, activity }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
      setSteps([]);
    }
  }

  if (busy && steps.length > 0) {
    return (
      <AiWorking
        steps={steps.map((s) => s.label)}
        activity={steps[steps.length - 1].activity}
        files={files}
        text={text.trim() || undefined}
        expected="10–40 секунд"
      />
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-topic`} hint="хоосон орхивол AI материалаас таньж бөглөнө">
            Сэдэв
          </Label>
          <input
            id={`${id}-topic`}
            list={`${id}-topics`}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={120}
            placeholder="Заавал биш: AI зураг, текстээс таньна"
            className={cn(fieldClass, "h-12")}
          />
          <datalist id={`${id}-topics`}>
            {curriculum.flatMap((ch) => ch.lessons.map((l) => <option key={`${ch.order}-${l}`} value={l}>{`${ch.order}-р бүлэг`}</option>))}
          </datalist>
        </div>
        <SubjectField id={`${id}-subject`} value={subject} locked={Boolean(teacherSubject)} onChange={setSubject} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-grade`}>Анги</Label>
          <select id={`${id}-grade`} value={grade} onChange={(e) => setGrade(Number(e.target.value))} className={cn(fieldClass, "h-12")}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                {g}-р анги
              </option>
            ))}
          </select>
        </div>
      </div>

      {withClass && (
        <div className="flex flex-col gap-1.5 md:max-w-xs">
          <Label htmlFor={`${id}-class`} hint="видео энэ ангид харагдана">
            Анги
          </Label>
          <select
            id={`${id}-class`}
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            className={cn(fieldClass, "h-12 font-bold")}
          >
            {classes.length === 0 && <option value="">Анги алга</option>}
            {classes.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-text`} hint="заавал биш">
          Текст
        </Label>
        <textarea
          id={`${id}-text`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={20000}
          rows={4}
          placeholder="Хичээлийн тайлбар, дүрэм, жишээ бодлогоо энд буулгаж болно"
          className={cn(fieldClass, "py-3")}
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-card border-2 border-dashed px-4 py-6 text-center",
          dragging ? "border-primary bg-surface" : "border-line bg-white",
        )}
      >
        <p className="font-bold">Номын хуудасны зураг, screenshot, PDF, .txt</p>
        <p className="text-sm text-ink-muted">
          Энд чирж оруулах эсвэл{" "}
          <button type="button" onClick={() => input.current?.click()} className="cursor-pointer font-bold text-primary underline">
            файл сонгох
          </button>
          . Хамгийн ихдээ {MAX_UPLOAD_FILES} файл, зураг 5 MB, PDF 10 MB.
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT_UPLOADS}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="sr-only"
          aria-label="Файл сонгох"
        />
        {files.length > 0 && (
          <ul className="mt-2 flex w-full flex-wrap justify-center gap-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="inline-flex items-center gap-2 rounded-full bg-surface py-1 pr-1 pl-3 text-sm font-semibold">
                {f.name} <span className="text-xs text-ink-muted">{kb(f.size)}</span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  aria-label={`${f.name}-ийг хасах`}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-full hover:bg-lavender"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      <Button type="submit" disabled={busy} aria-busy={busy} className="self-start">
        {busy ? "AI уншиж байна…" : submitLabel}
      </Button>
    </form>
  );
}
