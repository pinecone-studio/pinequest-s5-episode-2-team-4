"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { createVideoAction, recognizeMaterialAction } from "@/lib/teacher-actions";
import type { CurriculumChapter, Recognition, ClassOption } from "@/lib/types";
import { AiWorking } from "../../_content/AiWorking";
import { MaterialForm } from "../../_content/MaterialForm";
import { RecognitionEditor } from "../../_content/RecognitionEditor";
import { ErrorNote, SourceBadge, StepTitle } from "../../_content/ui";

type Recognized = {
  materialId: string;
  classCode: string;
  recognition: Recognition;
  source: "ai" | "demo";
  topicDetected: boolean;
};

/** Material → what the AI recognised (teacher fixes it) → draft reel script. */
export function NewVideoFlow({
  curriculum,
  classes,
  teacherSubject,
}: {
  curriculum: CurriculumChapter[];
  classes: ClassOption[];
  /** The subject the teacher teaches */
  teacherSubject?: string;
}) {
  const router = useRouter();
  const [recognized, setRecognized] = useState<Recognized>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function writeScript() {
    if (!recognized) return;
    setBusy(true);
    setError(undefined);
    const result = await createVideoAction(recognized).catch(() => undefined);
    if (!result?.ok) {
      setBusy(false);
      return setError(result?.error ?? "Видеоны зохиол үүсгэж чадсангүй. Дахин оролдоно уу.");
    }
    router.push(`/teacher/videos/${result.id}`);
  }

  return (
    <div className="flex flex-col gap-5 md:gap-7">
      <Card className="flex flex-col gap-4">
        <StepTitle n={1} done={Boolean(recognized)}>
          Материал оруулах
        </StepTitle>
        {recognized ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-ink-muted">
              Материалыг уншсан. Сэдэв: <strong className="text-ink">{recognized.recognition.topic}</strong>. Доор
              шалгаж, засна уу.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setRecognized(undefined)}>
              Өөр материал
            </Button>
          </div>
        ) : (
          <MaterialForm
            curriculum={curriculum}
            classes={classes}
            withClass
            teacherSubject={teacherSubject}
            submitLabel="✦ AI-аар уншуулах"
            onSubmit={async (input) => {
              const { materialId, recognition, topicDetected } = await recognizeMaterialAction(input);
              setRecognized({
                materialId,
                classCode: input.classCode ?? "",
                recognition: recognition.value,
                source: recognition.source,
                topicDetected,
              });
            }}
          />
        )}
      </Card>

      {recognized && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StepTitle n={2}>Материалаас ялгасан агуулгыг хянах</StepTitle>
            <SourceBadge source={recognized.source} />
          </div>
          <p className="text-sm text-ink-muted">
            Танигдсан агуулгыг нягталж, алдаатай эсвэл шаардлагагүй хэсгийг засаарай. Видеоны зохиолыг зөвхөн энэ агуулгад үндэслэн үүсгэнэ.
          </p>
          <RecognitionEditor
            // Only the AI really reads a topic; demo content just borrows the first line.
            topicDetected={recognized.topicDetected && recognized.source === "ai"}
            value={recognized.recognition}
            onChange={(recognition) => setRecognized({ ...recognized, recognition })}
          />
          {error && <ErrorNote>{error}</ErrorNote>}
          {busy && (
            <AiWorking
              steps={["Видеоны зохиол болон унших тайлбар бэлтгэж байна"]}
              activity={[
                "Сонирхол татах эхлэл бодож байна…",
                "Алхам алхмаар тайлбар бичиж байна…",
                "Жишээ бодлого сонгож байна…",
                "Унших тайлбар бэлтгэж байна…",
                "Томъёонуудыг шалгаж байна…",
                "Бараг боллоо…",
              ]}
              expected="10–40 секунд"
            />
          )}
          <Button onClick={writeScript} disabled={busy} aria-busy={busy} className="self-start">
            {busy ? "Видеоны зохиол бэлтгэж байна…" : "✦ Видеоны зохиол бэлтгэх"}
          </Button>
        </Card>
      )}
    </div>
  );
}
