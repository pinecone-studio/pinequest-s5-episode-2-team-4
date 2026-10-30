"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Expression } from "@/components/Fraction";
import { Button, ButtonLink } from "@/components/ui";
import { reviewMistake } from "@/lib/mistake-actions";
import type { NotebookItem } from "@/lib/mistakes";

type ReviewResult = Awaited<ReturnType<typeof reviewMistake>>;

export function MistakeNotebook({ items }: { items: NotebookItem[] }) {
  const [tab, setTab] = useState<"pending" | "resolved">("pending");
  const [subject, setSubject] = useState("all");
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const [updates, setUpdates] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const isResolved = (item: NotebookItem) => updates[item.id] ?? item.resolved;
  const pending = items.filter((item) => !isResolved(item)).length;
  const subjects = [...new Set(items.map((item) => item.subject))];
  const normalizeSearch = (text: string) => text.normalize("NFC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
  const search = normalizeSearch(query);
  const visible = items.filter((item) =>
    isResolved(item) === (tab === "resolved") &&
    (subject === "all" || item.subject === subject) &&
    (!search || normalizeSearch(`${item.prompt} ${item.display ?? ""}`).includes(search)),
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-4 pb-12 md:px-8">
      <h1 className="type-page-title">Алдааны дэвтэр</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">Тест, дасгал, дахин тест болон boss тулаанд алдсан асуултаа давтаарай. Зөв хариулбал “Давтсан” хэсэгт орно.</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label="Алдааны төлөв">
          <Button size="sm" variant={tab === "pending" ? "primary" : "secondary"} aria-pressed={tab === "pending"} onClick={() => setTab("pending")}>Давтах · {pending}</Button>
          <Button size="sm" variant={tab === "resolved" ? "primary" : "secondary"} aria-pressed={tab === "resolved"} onClick={() => setTab("resolved")}>Давтсан · {items.length - pending}</Button>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">Хичээл
          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-field border border-line bg-white px-3 text-ink">
            <option value="all">Бүгд</option>
            {subjects.map((title) => <option key={title} value={title}>{title}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-5">
        <label htmlFor="mistake-search" className="text-sm font-semibold">Асуулт хайх</label>
        <div className="mt-2 flex gap-2">
          <input
            ref={searchInput}
            id="mistake-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Асуултын текстээр хайх…"
            maxLength={150}
            aria-describedby={search ? "mistake-search-count" : undefined}
            className="min-h-12 w-full min-w-0 rounded-field border border-line bg-white px-4 text-ink placeholder:text-ink-muted"
          />
          {query && <Button variant="secondary" size="sm" onClick={() => {
            setQuery("");
            searchInput.current?.focus();
          }}>Арилгах</Button>}
        </div>
        <p id="mistake-search-count" role="status" aria-live="polite" className="mt-2 text-sm text-ink-muted">
          {search ? `${visible.length} асуулт олдлоо` : ""}
        </p>
      </div>
      <p role="status" aria-live="polite" className="mt-4 min-h-6 text-sm font-semibold">{notice}</p>
      {!visible.length ? (
        <div className="glass-panel mt-3 rounded-panel border border-line bg-surface p-8 text-center">
          <p className="text-xl font-bold">{items.length === 0 ? "Одоогоор бүртгэгдсэн алдаа алга" : search ? "Хайлтад тохирох асуулт олдсонгүй" : tab === "pending" ? "Давтах алдаа алга!" : "Одоогоор давтсан асуулт алга"}</p>
          <p className="mt-3 text-sm text-ink-muted">{items.length === 0 ? "Тест, дасгал эсвэл boss-ийн асуултад буруу хариулбал энд автоматаар нэмэгдэнэ." : search ? "Өөр түлхүүр үгээр хайх эсвэл хайлтаа арилгаарай. Хичээл болон төлөвийн шүүлтүүр мөн үйлчилж байна." : "Хичээлийн шүүлтүүрээ солих эсвэл бусад асуултаа давтаарай."}</p>
          {search && items.length > 0
            ? <Button variant="secondary" size="sm" className="mt-5" onClick={() => {
              setQuery("");
              searchInput.current?.focus();
            }}>Хайлт арилгах</Button>
            : <ButtonLink href="/test" size="sm" className="mt-5">Тест рүү очих</ButtonLink>}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-5">
          {visible.map((item) => <ReviewCard key={item.id} item={{ ...item, resolved: isResolved(item) }} onReviewed={(correct) => {
            setUpdates((previous) => ({ ...previous, [item.id]: correct }));
            setNotice(correct ? "✓ Зөв хариуллаа! Асуулт “Давтсан” хэсэгт орлоо." : "Хариултаа тайлбартай харьцуулаад дахин оролдоорой.");
          }} />)}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ item, onReviewed }: { item: NotebookItem; onReviewed: (correct: boolean) => void }) {
  const [answer, setAnswer] = useState<number | string>(item.options ? -1 : "");
  const [result, setResult] = useState<ReviewResult>();
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const response = await reviewMistake(item.id, answer);
      setResult(response);
      if (response.correct !== undefined) onReviewed(response.correct);
    } catch {
      setResult({ error: "Хадгалж чадсангүй. Дахин оролдоорой." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="glass-panel rounded-panel border border-line bg-white p-5 shadow-card md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
        <span className="rounded-full bg-surface px-3 py-1.5">{item.subject}</span>
        <span className="text-ink-muted">{item.resolved ? "✓ Давтсан" : "Давтах"}</span>
      </div>
      <h2 className="mt-4 text-lg font-bold">{item.prompt}</h2>
      {item.expression && <Expression tokens={item.expression} className="mt-3 text-2xl font-bold" />}
      {item.display && <p className="mt-3 rounded-field bg-surface p-3 text-lg">{item.display}</p>}
      {item.previousAnswer !== undefined && <p className="mt-3 text-sm text-ink-muted">Сүүлд өгсөн хариулт: <span className="font-semibold">{item.previousAnswer}</span></p>}
      <form onSubmit={submit} className="mt-4">
        {item.options ? (
          <fieldset disabled={busy}>
            <legend className="mb-2 text-sm font-semibold">Дахин бодоод хариултаа сонго</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {item.options.map((option, index) => <label key={index} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-field border-2 p-3 ${answer === index ? "border-primary bg-surface" : "border-line"}`}>
                <input type="radio" name={item.id} checked={answer === index} onChange={() => setAnswer(index)} value={index} required className="accent-primary" />
                <span>{option}</span>
              </label>)}
            </div>
          </fieldset>
        ) : <label className="block text-sm font-semibold">Таны хариулт
          <input type="text" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={300} disabled={busy} required autoComplete="off" className="mt-2 block min-h-12 w-full rounded-field border border-line bg-white px-3 font-normal text-ink" />
        </label>}
        <Button type="submit" size="sm" disabled={busy || (item.options ? answer === -1 : !String(answer).trim())} className="mt-4">{busy ? "Шалгаж байна…" : "Хариу шалгах"}</Button>
      </form>
      <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold">{result?.error ?? (result?.correct === false ? "Буруу байна. Тайлбарыг уншаад дахин бодоорой." : "")}</p>
      <details className="mt-4 border-t border-line pt-4">
        <summary className="cursor-pointer text-sm font-semibold">Зөв хариу, тайлбар харах</summary>
        <p className="mt-3 font-bold">Зөв хариу: {item.expected}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{item.explanation}</p>
        {item.lessonHref && <Link href={item.lessonHref} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold">Хичээлээ давтах →</Link>}
      </details>
    </article>
  );
}
