import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SchoolClass } from "@/lib/types";
import { createClass } from "./actions";

const fieldClass =
  "h-12 min-w-0 flex-1 rounded-tile border-2 border-lavender bg-white px-4 text-base text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none";

/** Form to create a class; the code is generated. */
export function CreateClassForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action={createClass} className="flex flex-col gap-2.5 sm:flex-row">
      <label htmlFor={compact ? "new-class-compact" : "new-class"} className="sr-only">
        Ангийн нэр
      </label>
      <input
        id={compact ? "new-class-compact" : "new-class"}
        name="name"
        placeholder="Ангийн нэр, жишээ нь 7А"
        maxLength={20}
        className={fieldClass}
      />
      <button type="submit" className={buttonClass({ size: "sm" })}>
        Анги үүсгэх
      </button>
    </form>
  );
}

/** Shown before the teacher has a class. */
export function FirstClassCard() {
  return (
    <section
      aria-labelledby="first-class-title"
      className="mx-auto mt-4 max-w-xl rounded-panel bg-white p-6 shadow-float md:p-9"
    >
      <h2 id="first-class-title" className="text-2xl font-bold md:text-[28px]">
        Эхлээд ангиа үүсгэ
      </h2>
      <p className="mt-2 text-[15px] text-ink-muted">
        7-р анги · Математик · Бутархай. Анги үүсгэхэд код гарна. Сурагчид
        бүртгүүлэхдээ тэр кодыг оруулж танай ангид нэгдэнэ.
      </p>
      <div className="mt-6">
        <CreateClassForm />
      </div>
    </section>
  );
}

type ClassBarProps = {
  classes: SchoolClass[];
  current: SchoolClass;
  joinedCount: number;
};

/** Class switcher, the join code to share, and a new-class form. */
export function ClassBar({ classes, current, joinedCount }: ClassBarProps) {
  return (
    <section
      aria-label="Анги"
      className="flex flex-col gap-4 rounded-[25px] bg-white p-5 shadow-card md:mb-5 md:flex-row md:flex-wrap md:items-center md:justify-between md:rounded-panel md:p-6"
    >
      <nav aria-label="Ангиуд" className="flex flex-wrap gap-2">
        {classes.map((c) => {
          const on = c.code === current.code;
          return (
            <Link
              key={c.code}
              href={`/teacher?class=${c.code}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold no-underline",
                on ? "bg-primary text-white hover:text-white" : "bg-surface text-ink hover:text-ink",
              )}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs font-bold text-ink-muted">Нэгдэх код</p>
          <p className="text-[28px] leading-none font-bold tracking-[0.2em] text-primary">
            {current.code}
          </p>
        </div>
        <p className="max-w-56 text-xs font-semibold text-ink-muted">
          Сурагчид бүртгүүлэхдээ энэ кодыг оруулна.{" "}
          {joinedCount > 0
            ? `${joinedCount} сурагч нэгдсэн.`
            : "Одоогоор жишээ өгөгдөл харагдаж байна."}
        </p>
      </div>

      <details className="group md:basis-full">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-primary">
          + Шинэ анги
        </summary>
        <div className="mt-2 max-w-lg">
          <CreateClassForm compact />
        </div>
      </details>
    </section>
  );
}
