"use client";

type MergeSelectProps = {
  /** Other groups of the same lesson. */
  targets: { id: string; title: string }[];
  disabled: boolean;
  onMerge: (intoId: string) => void;
};

/** "Нэгтгэх…": moves this group's questions into the picked group. */
export function MergeSelect({ targets, disabled, onMerge }: MergeSelectProps) {
  if (targets.length === 0) return null;
  return (
    <label className="inline-flex items-center gap-1.5 text-[13px] font-bold">
      <span className="sr-only">Өөр бүлэгт нэгтгэх</span>
      <select
        value=""
        disabled={disabled}
        onChange={(e) => e.target.value && onMerge(e.target.value)}
        className="min-h-9 max-w-56 cursor-pointer rounded-full border-2 border-line bg-white px-3 text-[13px] font-bold text-ink"
      >
        <option value="">Нэгтгэх…</option>
        {targets.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
    </label>
  );
}
