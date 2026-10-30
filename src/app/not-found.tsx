import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Хуудас олдсонгүй · LevelUp",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <p className="text-6xl leading-none font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold md:text-3xl">Хуудас олдсонгүй</h1>
      <p className="max-w-100 text-ink-muted">
        Хаяг буруу бичигдсэн эсвэл энэ хуудас устсан байж болзошгүй.
      </p>
      <ButtonLink href="/">Нүүр хуудас руу буцах</ButtonLink>
    </main>
  );
}
