# LevelUp

**Ойлгоогүйгээ өөрийн хурдаар нөх.**

LevelUp бол сурагчдад математикийн ойлгоогүй үлдсэн сэдвээ олж, өөрийн хурдаар нөхөхөд тусалдаг вэб апп. Сурагч сэдэв эзэмших бүрт тэжээвэр нь түвшин ахиж, хувьсан өсдөг. Багш ангийнхаа аль сурагч, аль дэд сэдэв дээр сул байгааг нэг дор хардаг.

> *LevelUp helps students find and close gaps in math at their own pace. Every subtopic they master levels up their pet, and teachers see at a glance where the class is struggling. Built for PineQuest S5 around UN SDG 4: Quality Education.*

<!-- Screenshots: add to docs/screenshots/ and uncomment
![Нүүр хуудас](docs/screenshots/home.png)
-->

## Хэрхэн ажилладаг вэ

1. **Оношлох тест.** Сурагч 8 асуулттай богино тест өгнө. LevelUp дэд сэдэв бүрээр (ижил хуваарь, ялгаатай хуваарь, хураах, холимог тоо) сул ба сайн талыг нь тодорхойлно.
2. **Хичээл ба дасгал.** Сул сэдэв бүрд түгээмэл алдааг харуулж, алхам алхмаар тайлбарлаад, дасгал ажиллуулна.
3. **AI туслах.** Хариуг шууд хэлэхгүй. Асуулт асууж, жишээ, зургаар сурагчийг өөрөө олоход нь тусална.
4. **Эзэмших.** Дахин шалгалтад тэнцвэл сэдвийг эзэмшсэнд тооцож, тэжээвэр нь түвшин ахина. 3 ба 6-р түвшинд тэжээвэр хувьсана. Тэжээвэр хэзээ ч үхэхгүй, тиймээс алдахаас айх шаардлагагүй.
5. **Багшийн самбар.** Дэд сэдэв ба сурагчаар heatmap, AI-ийн бэлдсэн даалгаврын ноорог, "2 удаа тэнцээгүй" гэх мэт мэдэгдлүүд харагдана.

## Технологи

- [Next.js](https://nextjs.org) (App Router), React, TypeScript
- Tailwind CSS
- Supabase (тоглоом, тулаан, шагналын төлөв). Хичээл, тест, дасгалын агуулга одоогоор mock өгөгдөлтэй.
- Vitest (цэвэр логикийн unit тест)

## Ажиллуулах

Node.js 22 буюу түүнээс дээш хувилбар шаардлагатай (`nvm use` нь `.nvmrc`-ээс уншина).

```bash
npm install
cp .env.example .env.local   # утгуудыг бөглөнө
npm run dev
```

Дараа нь http://localhost:3000 нээнэ.

| Скрипт | Үүрэг |
|---|---|
| `npm run dev` | хөгжүүлэлтийн сервер |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (тест нэмсэн PR merge хийгдсэний дараа) |
| `npm run build` | production build |

Commit хийхээс өмнө `npm run lint` ба `npm run build` амжилттай байх ёстой.

### Орчны хувьсагч

[.env.example](.env.example) файлд бүгд бий. Supabase-ийн түлхүүрүүд (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) хэрэгтэй. `SESSION_SECRET` нь хөгжүүлэлтэд заавал биш, production-д заавал шаардлагатай. `SUPABASE_SERVICE_ROLE_KEY` нь зөвхөн серверийн талд ашиглагдана. Хүснэгтүүдийг [supabase/migrations](supabase/migrations) дахь SQL файлуудыг дарааллаар нь ажиллуулж үүсгэнэ.

## Хуудсууд

| Зам | Агуулга |
|---|---|
| `/` | нүүр, явц, тэжээвэр |
| `/test`, `/test/retest/[subtopic]` | оношлох тест ба дахин шалгалт |
| `/lesson/[topic]` | хичээл, дасгал, нэргүй асуулт хариулт |
| `/mastered/[topic]` | сэдэв эзэмшсэний шагнал |
| `/pets`, `/pets/eggs`, `/pets/progress`, `/pets/history` | тэжээвэр, өндөг, англи хэлний явц, тулааны түүх |
| `/pets/battle`, `/pets/join` | ганцаарчилсан, бүлгийн, ангийн тулаан |
| `/games/*` | сурах тоглоомууд |
| `/teacher`, `/teacher/english` | багшийн самбар, heatmap, ангийн англи хэлний явц |
| `/login`, `/signup` | нэвтрэх, бүртгүүлэх |

## Архитектур

```
src/
  app/            хуудсууд. (student), (auth), (battle) бүлэг, teacher
  components/     хуваалцсан UI: ui/, layout/, pet/, Fraction
  lib/
    types.ts      бүх төрөл
    mock/         mock өгөгдөл
    data.ts       өгөгдөл унших цорын ганц хаалга (async функцүүд)
    pets.ts       түвшин, хувирал, XP-ийн цэвэр логик
    streak.ts     өдрийн streak
supabase/migrations/   өгөгдлийн сангийн схем
```

Өгөгдлийн урсгал: хуудас (Server Component) `data.ts`-ийн async функцийг дуудаад, үр дүнг Client Component-д props-оор дамжуулна. Хуудас, компонент `src/lib/mock`-ийг шууд импортлодоггүй, тиймээс mock-ийг жинхэнэ API-аар сольсон ч UI өөрчлөгдөхгүй. AI туслах нь одоогоор бэлтгэсэн хариултыг (`askHelper()`) буцаадаг.

## Баг

PineQuest S5 · Episode 2 · Team 4

- [Nyamochir99](https://github.com/Nyamochir99)
- [BaskaLemon](https://github.com/BaskaLemon)
- [azaanm7](https://github.com/azaanm7)
- [btsolmon](https://github.com/btsolmon)
- [nimbaa123](https://github.com/nimbaa123)

Багийн гишүүдэд зориулсан ажлын заавар: [CONTRIBUTING.md](CONTRIBUTING.md).

## Лиценз ба талархал

Тэжээврийн пиксел зургууд [Tuxemon](https://wiki.tuxemon.org/Completed_Tuxemon) төслөөс авсан бөгөөд [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) лицензтэй.
