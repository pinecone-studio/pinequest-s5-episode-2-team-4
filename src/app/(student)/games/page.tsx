import type { Metadata } from "next";
import Link from "next/link";
import { getGameSubjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Тоглоом · LevelUp",
};

const GAMES = [
  {
    href: "/games/snake",
    title: "Мэдлэгийн могой",
    genre: "Хурдан",
    text: "Даалгаварт таарах 3 хариултыг идэж могойгоо томруул. Буруу идвэл тоглоом зогсож, яагаад буруу болохыг тайлбарлана.",
    art: "from-[#e30ba6] to-[#5b00ed]",
    icon: "🐍",
  },
  {
    href: "/games/cards",
    title: "Картын тулаан",
    genre: "Стратеги",
    text: "Хэцүү карт илүү их хохирол учруулна. Зөв хариулт бүрд тэжээвэр чинь мангас руу од шидэнэ.",
    art: "from-[#ffcf5a] to-[#ff4d6d]",
    icon: "🃏",
  },
  {
    href: "/games/race",
    title: "Морин уралдаан",
    genre: "Уралдаан",
    text: "Зөв хариулт бүрд морь чинь нэг нүүдэл урагшилна. 10 асуултын дараа 3 морийг гүйцэж финишд түрүүл.",
    art: "from-[#34d399] to-[#5b00ed]",
    icon: "🐎",
  },
  {
    href: "/games/tug",
    title: "Олс таталт",
    genre: "Хүч",
    text: "Ботууд олсыг зогсолтгүй татна. Зөв хариулт бүрд чиний баг эргүүлж татна, комбо улам хүчтэй. Тугийг шугамаас давуул!",
    art: "from-[#ffcf5a] to-[#e30ba6]",
    icon: "🪢",
  },
  {
    href: "/games/runner",
    title: "Боссын зам",
    genre: "Гүйлт",
    text: "3 замтай замаар гүйж, зөв хариулттай хаалгаар ор. Зөв бүрт томорч хүчтэй болно. Замын төгсгөлд босс хүлээж байна!",
    art: "from-[#8b5cff] to-[#ff4d6d]",
    icon: "🏃",
  },
  {
    href: "/games/mole",
    title: "Мэнгэ цохих",
    genre: "Хурдан",
    text: "Нүхнээс хариулт барьсан мэнгэ цухуйна. Даалгаварт тохирохыг нь цохи, буруу цохивол амь хасагдана. 60 секундэд хэдийг цохих вэ?",
    art: "from-[#34d399] to-[#ffcf5a]",
    icon: "🔨",
  },
];

export default async function GamesPage() {
  const subjects = await getGameSubjects();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      <h1 className="text-[40px] leading-none font-bold tracking-[-0.03em] md:text-[56px]">Тоглоом</h1>
      <p className="mt-3 max-w-160 text-ink-muted md:text-lg">
        Нэг хичээлийн асуултыг өөр өөр тоглоомоор давт. Аль тоглоомд ч буруу хариулбал тайлбар нь гарна.
      </p>

      <ul className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-6">
        {GAMES.map((game) => (
          <li key={game.href}>
            <Link
              href={game.href}
              className="flex h-full flex-col gap-4 rounded-[25px] bg-white p-5 text-ink no-underline shadow-card transition-transform hover:-translate-y-1 hover:text-ink md:rounded-panel md:p-6"
            >
              <span aria-hidden="true" className={`grid h-40 place-items-center rounded-card bg-linear-to-br text-7xl ${game.art}`}>
                {game.icon}
              </span>
              <span className="flex items-center justify-between gap-3">
                <span className="text-2xl leading-tight font-bold">{game.title}</span>
                <span className="rounded-full bg-ink px-2.5 py-0.75 text-xs font-bold text-white">{game.genre}</span>
              </span>
              <span className="text-ink-muted">{game.text}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-2xl font-bold">Хичээлүүд</h2>
      <p className="mt-1 text-ink-muted">Тоглоом бүр эдгээр хичээлийн асуултыг уншдаг. Хичээлээ тоглоом дотроо сонгоно.</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {subjects.map((s) => (
          <li key={s.id} className="rounded-full bg-surface px-3.5 py-1.5 text-sm font-bold">
            {s.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
