import { ButtonLink, PixelIcon } from "@/components/ui";

/** For a student in no class yet: ask the teacher to add them, and practise meanwhile. */
export function ClassNotice() {
  return (
    <section
      aria-labelledby="class-notice-title"
      className="mt-6 flex flex-col gap-4 rounded-panel bg-card p-5 shadow-card md:mt-10 md:flex-row md:items-center md:gap-6 md:p-7"
    >
      <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-card bg-lavender">
        <PixelIcon name="school" className="size-8" />
      </span>
      <div className="flex-1">
        <h2 id="class-notice-title" className="text-xl font-bold">
          Та ангид бүртгэлгүй байна
        </h2>
        <p className="mt-1 text-base text-ink-muted">
          Багшдаа хэлж ангидаа бүртгүүлнэ үү. Тэр болтол хүссэн хичээлээ сонгоод тоглоом тоглож болно.
        </p>
      </div>
      <ButtonLink href="/subject" size="sm" className="self-start md:self-center">
        Хичээл сонгох
      </ButtonLink>
    </section>
  );
}
