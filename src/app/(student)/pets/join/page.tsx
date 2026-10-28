import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { getActiveGroupBattleId } from "@/lib/data";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = {
  title: "Бүлэгт нэгдэх · LevelUp",
};

export default async function JoinPage() {
  const groupBattleId = await getActiveGroupBattleId();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-2 md:px-[clamp(16px,4vw,40px)]">
      <h1 className="type-page-title">Нэгдэх</h1>
      <p className="mt-3 text-ink-muted md:text-lg">
        Найзынхаа лобби эсвэл багшийн дэлгэц дээр харагдах 6 тэмдэгттэй кодыг, эсвэл ангийнхаа кодыг
        (жишээ нь 7А) оруулаад хамтдаа боссыг ялаарай.
      </p>

      {groupBattleId ? (
        <div className="mt-6 flex flex-col gap-3 rounded-card bg-sky p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <p className="font-bold">Чи бүлгийн тулаанд байна.</p>
          <ButtonLink href={`/pets/battle/${groupBattleId}`} size="sm">
            Бүлэг рүү очих
          </ButtonLink>
        </div>
      ) : null}

      <section className="mt-6 rounded-panel bg-white p-5 shadow-card md:p-7">
        <JoinForm />
      </section>

      <p className="mt-5 text-ink-muted">
        Өөрөө бүлэг үүсгэх бол{" "}
        <Link href="/pets/battle" className="font-bold">
          Боссууд
        </Link>{" "}
        хэсгээс «Найзуудтайгаа»-г дар.
      </p>
    </div>
  );
}
