/** Error under a form's fields, announced by screen readers. */
export function FormError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="rounded-tile border-2 border-magenta bg-pink px-4 py-3 text-sm font-semibold text-ink"
    >
      {children}
    </p>
  );
}
