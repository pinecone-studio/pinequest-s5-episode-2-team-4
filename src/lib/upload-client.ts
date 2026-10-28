"use client";

// Browser side of material uploads: asks the server for signed URLs, then
// sends each file straight to Supabase Storage, so big files never pass
// through a server function. Only the public (anon) key is used here; the
// signed URL is what allows the upload.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createUploadUrlsAction } from "./teacher-actions";
import type { MaterialFile } from "./types";
import { MAX_UPLOAD_FILES, uploadProblem } from "./uploads";

let client: SupabaseClient | null | undefined;
function browserClient() {
  if (client === undefined) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  }
  return client;
}

/** Uploads the files and returns where they are, or throws a message to show. */
export async function uploadMaterialFiles(files: File[]): Promise<MaterialFile[]> {
  if (files.length === 0) return [];
  if (files.length > MAX_UPLOAD_FILES) throw new Error(`${MAX_UPLOAD_FILES}-аас олон файл оруулах боломжгүй`);
  const problem = files.map((f) => uploadProblem({ name: f.name, mime: f.type, size: f.size })).find(Boolean);
  if (problem) throw new Error(problem);

  const supabase = browserClient();
  if (!supabase) throw new Error("Файл хадгалах сан тохируулагдаагүй байна");
  const answer = await createUploadUrlsAction(files.map((f) => ({ name: f.name, mime: f.type, size: f.size })));
  if (!answer.ok) throw new Error(answer.error);

  await Promise.all(
    answer.uploads.map(async ({ file, token }, i) => {
      const { error } = await supabase.storage.from("materials").uploadToSignedUrl(file.path, token, files[i], {
        contentType: file.mime,
      });
      if (error) throw new Error(`${files[i].name}: оруулж чадсангүй`);
    }),
  );
  return answer.uploads.map((u) => u.file);
}
