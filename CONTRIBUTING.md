# Багийн ажлын заавар

LevelUp дээр ажиллаж буй багийн гишүүдэд зориулсан заавар. Төслийн тухай ерөнхий мэдээлэл [README.md](README.md)-д байна.

- Дизайн: https://claude.ai/artifact/RDFdbnCNpbGT2L7Wg3PXTc
- Хэн юу хийх: [CLAUDE.md](CLAUDE.md) → Ownership
- Issue-ийн жагсаалт: [docs/backlog.md](docs/backlog.md)

## 1. Нэг удаа тохируулах

1. **Node 22+** (`.nvmrc`-д заасан): `node -v`
2. **GitHub CLI** суулгах (Terminal дээр):
   ```bash
   curl -L -o /tmp/gh.pkg https://github.com/cli/cli/releases/download/v2.103.0/gh_2.103.0_macOS_universal.pkg
   sudo installer -pkg /tmp/gh.pkg -target /
   ```
   Admin эрхгүй бол эхлээд `su <admin-нэр>` хийгээд суулгаад `exit`.
3. **GitHub-д нэвтрэх** (VS Code-ийн терминал дээр, Claude чат дээр биш):
   ```bash
   gh auth login
   ```
   GitHub.com → HTTPS → Yes → Login with a web browser.
4. **Төслөө татах:**
   ```bash
   git clone https://github.com/pinecone-studio/pinequest-s5-episode-2-team-4.git
   cd pinequest-s5-episode-2-team-4
   npm install
   npm run dev
   ```
   http://localhost:3000 нээгдэнэ.
5. VS Code-оо тэр хавтсанд нээгээд Claude Code-оо ажиллуул. Claude `CLAUDE.md`-г автоматаар уншдаг тул багийн дүрмийг өөрөө дагана.

## 2. Issue үүсгэх (нэг удаа)

Claude-д ингэж бич:

> docs/backlog.md-ээс миний issue-нуудыг үүсгэ. Миний GitHub нэр BaskaLemon.

Claude жагсаалтаа харуулна → шалгаад өөрийнхөөрөө зөвшөөр ("за", "тийм", "go" гэх мэт ямар ч тодорхой үг болно).

## 3. Issue бүр дээр ажиллах

Нэг issue = нэг branch = нэг PR. Claude алхам бүрийн өмнө асууна, чи зөвшөөрнө.

| Алхам | Claude-д юу гэж хэлэх | Claude юу хийх |
|---|---|---|
| Эхлэх | `#12 issue дээр ажиллая` | `main`-ээ шинэчлээд `feat/12-...` branch үүсгэхийг асууна |
| Хийх | `дизайны дагуу хуудсаа хий` | Код бичнэ. Чи `npm run dev` дээр шалгана |
| Commit | `commit хий` | lint + build шалгаад `feat: ...` мессежийг асууна |
| Push + PR | `push хийгээд PR нээ` | PR-ийн гарчиг, тайлбарыг харуулаад асууна (`Closes #12`) |
| Merge | — | Багийн нэг гишүүн GitHub дээр харж, merge хийнэ |
| Дараагийнх | `main-ээ шинэчлээд дараагийн issue` | `git switch main && git pull` → дахин эхнээс |

## Дүрэм (товч)

- `main` руу шууд push хийхгүй, зөвхөн PR-ээр.
- Branch, commit, PR-ийн нэр **англиар**, богино: `feat/12-login-form`, `feat: add login form`.
- Бусдын route/хуудсанд хүрэхгүй. Нийтлэг зүйл хэрэгтэй бол эзэнд нь хэл.
- Commit, PR-д Claude-ийн нэр орохгүй.
- Том ажлыг жижиг issue болгож хуваа.
