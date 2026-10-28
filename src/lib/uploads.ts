// What teachers may upload with a material, shared by the upload form and
// the server check. The server re-checks everything the browser sends.

export const UPLOAD_LIMITS = {
  "image/jpeg": 5 * 1024 * 1024,
  "image/png": 5 * 1024 * 1024,
  "image/webp": 5 * 1024 * 1024,
  "application/pdf": 10 * 1024 * 1024,
  "text/plain": 200 * 1024,
} as const;

export type UploadMime = keyof typeof UPLOAD_LIMITS;

export const MAX_UPLOAD_FILES = 6;

export const ACCEPT_UPLOADS = Object.keys(UPLOAD_LIMITS).join(",");

export const isUploadMime = (mime: string): mime is UploadMime => mime in UPLOAD_LIMITS;

/** Why a file can't be uploaded, in Mongolian, or undefined if it's fine. */
export function uploadProblem(file: { name: string; mime: string; size: number }): string | undefined {
  if (!isUploadMime(file.mime)) return `${file.name}: зураг (JPG, PNG, WebP), PDF эсвэл .txt файл оруулна уу`;
  const limit = UPLOAD_LIMITS[file.mime];
  if (file.size > limit) return `${file.name}: ${Math.round(limit / 1024 / 1024) || 0.2} MB-аас том байна`;
  if (file.size <= 0) return `${file.name}: хоосон файл`;
  return undefined;
}
