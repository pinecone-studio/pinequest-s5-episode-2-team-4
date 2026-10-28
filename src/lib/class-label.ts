/**
 * A class code as people say it: "7А-4821" → "7А". The digits only make the
 * code unique (lib/classes.ts); older hand-typed codes come back unchanged.
 */
export const classLabel = (code: string) => code.replace(/-\d{4}$/, "");
