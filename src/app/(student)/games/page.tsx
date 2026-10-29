import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getGameSubjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Тоглоом · LevelUp",
};

const GAMES = [
  {
    href: "/games/hangman",
    title: "Hangman",
    genre: "Үг таах",
    text: "Монгол орчуулгыг ашиглан англи үгийг үсэг үсгээр таа. 6 удаа алдахаас өмнө бүх үсгийг олоорой!",
    shot: "/games/hangman.svg",
    focus: "50% 50%",
  },
  {
    href: "/games/snake",
    title: "Мэдлэгийн могой",
    genre: "Хурдан",
    text: "Даалгаварт таарах 3 хариултыг идэж могойгоо томруул. Буруу идвэл тоглоом зогсож, яагаад буруу болохыг тайлбарлана.",
    shot: "/games/snake.jpg",
    /** Part of the screenshot kept in the 4:3 card. */
    focus: "50% 45%",
  },
  {
    href: "/games/cards",
    title: "Картын тулаан",
    genre: "Стратеги",
    text: "Хэцүү карт илүү их хохирол учруулна. Зөв хариулт бүрд тэжээвэр чинь мангас руу од шидэнэ.",
    shot: "/games/cards.jpg",
    focus: "68% 50%",
  },
  {
    href: "/games/race",
    title: "Морин уралдаан",
    genre: "Уралдаан",
    text: "Ботуудын морь зогсолтгүй давхина. Зөв хариулт бүрд чиний морь нэг нүүдэл урагшилна. Хурдан, зөв хариулж финишд түрүүл!",
    shot: "/games/race.jpg",
    focus: "50% 50%",
  },
  {
    href: "/games/tug",
    title: "Олс таталт",
    genre: "Хүч",
    text: "Ботууд олсыг зогсолтгүй татна. Зөв хариулт бүрд чиний баг эргүүлж татна, комбо улам хүчтэй. Тугийг шугамаас давуул!",
    shot: "/games/tug.jpg",
    focus: "50% 50%",
  },
  {
    href: "/games/runner",
    title: "Боссын зам",
    genre: "Гүйлт",
    text: "3 замтай замаар гүйж, зөв хариулттай хаалгаар ор. Зөв бүрт томорч хүчтэй болно. Замын төгсгөлд босс хүлээж байна!",
    shot: "/games/runner.jpg",
    focus: "50% 78%",
  },
  {
    href: "/games/mole",
    title: "Мэнгэ цохих",
    genre: "Хурдан",
    text: "Нүхнээс хариулт барьсан мэнгэ цухуйна. Даалгаварт тохирохыг нь цохи, буруу цохивол амь хасагдана. 60 секундэд хэдийг цохих вэ?",
    shot: "/games/mole.jpg",
    focus: "50% 45%",
  },
  {
    href: "/games/hoops",
    title: "Сагсан бөмбөг",
    genre: "Шидэлт",
    text: "Бөмбөг бүр дээр хариулт бий. Зөвийг нь дээш гулсуулж сагсанд хий, буруугаа доош гулсуулж хая. Дараа нь цагираг хөдөлнө!",
    shot: "/games/hoops.jpg",
    focus: "50% 28%",
  },
  {
    href: "/games/penalty",
    title: "Пенальти",
    genre: "Тулаан",
    text: "Бот багийн эсрэг пенальтийн цуврал. Зөв хариулттай булан руу өшиглө, бот өшиглөхөөс өмнө зөв хариулж хаалгаа хамгаал!",
    shot: "/games/penalty.jpg",
    focus: "50% 22%",
  },
  {
    href: "/games/flight",
    title: "Мэдлэгийн нислэг",
    genre: "Нислэг",
    text: "Шонхороо товшиж дүүлгэ. Хаалга бүр 3 завсартай: зөв хариулттай завсраар нис. Буруу завсраар орвол тайлбар гарна.",
    shot: "/games/flight.jpg",
    focus: "50% 40%",
  },
  {
    href: "/games/slice",
    title: "Мэдлэгийн зүсэлт",
    genre: "Хурдан",
    text: "Хариултууд доороос шидэгдэнэ. Таарахыг нь хуруугаараа зүс, бурууг нь орхи. Таамаглаж зүсвэл тоглоом удааширч, бодох хугацаа өгнө.",
    shot: "/games/slice.jpg",
    focus: "50% 70%",
  },
];

export default async function GamesPage() {
  const subjects = await getGameSubjects();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-2 pb-10 md:px-[clamp(16px,4vw,40px)]">
      <h1 className="type-page-title">Тоглоом</h1>
      <p className="mt-3 max-w-160 text-ink-muted md:text-lg">
        Нэг хичээлийн асуултыг өөр өөр тоглоомоор давт. Аль тоглоомд ч буруу хариулбал тайлбар нь гарна.
      </p>

      <ul className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {GAMES.map((game) => (
          <li key={game.href}>
            <Link
              href={game.href}
              className="flex h-full flex-col gap-4 rounded-[25px] bg-white p-5 text-ink no-underline shadow-card transition-transform hover:-translate-y-1 hover:text-ink md:rounded-panel md:p-6"
            >
              <span className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink">
                <Image
                  src={game.shot}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: game.focus }}
                />
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
