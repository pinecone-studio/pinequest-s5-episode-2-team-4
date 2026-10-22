# LevelUp

**Ойлгоогүйгээ ичихгүйгээр нөх.**

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
- Одоогоор mock өгөгдөлтэй. Өгөгдлийн давхарга ([src/lib/data.ts](src/lib/data.ts)) нь жинхэнэ API-аар солигдохоор бэлдэгдсэн.

## Ажиллуулах

Node.js 20.19 буюу түүнээс дээш хувилбар шаардлагатай.

```bash
npm install
npm run dev
```

Дараа нь http://localhost:3000 нээнэ.

## Баг

PineQuest S5 · Episode 2 · Team 4

- [Nyamochir99](https://github.com/Nyamochir99)
- [BaskaLemon](https://github.com/BaskaLemon)
- [azaanm7](https://github.com/azaanm7)

Багийн гишүүдэд зориулсан ажлын заавар: [CONTRIBUTING.md](CONTRIBUTING.md).

## Лиценз ба талархал

Тэжээврийн пиксел зургууд [Tuxemon](https://wiki.tuxemon.org/Completed_Tuxemon) төслөөс авсан бөгөөд [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) лицензтэй.
