/** Shown while a page that reads the session streams in. */
export function PageLoading() {
  return (
    <div
      role="status"
      className="flex flex-1 flex-col items-center justify-center gap-4 py-24"
    >
      <span
        aria-hidden="true"
        className="size-12 animate-spin rounded-full border-4 border-lavender border-t-primary"
      />
      <span className="text-sm font-bold text-ink-muted">Ачаалж байна…</span>
    </div>
  );
}
