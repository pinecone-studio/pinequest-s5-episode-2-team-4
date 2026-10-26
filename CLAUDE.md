@AGENTS.md

# Team workflow

This is a team project. Every team member works with Claude Code, so follow these rules exactly to keep the history consistent.

## Stack

- Next.js (App Router) + React + TypeScript + Tailwind CSS, source in `src/`, import alias `@/*`.
- npm only (`package-lock.json` is committed). Do not use yarn/pnpm/bun.
- Before every commit run `npm run lint` and `npm run build`; both must pass.

## Product and design

LevelUp: students fill gaps in fractions through a diagnostic test, lessons and an AI helper, and level up a pet as they master subtopics. UI text is in Mongolian.

- Design: https://claude.ai/artifact/RDFdbnCNpbGT2L7Wg3PXTc (every screen has a desktop 1440 and a mobile 390 version; build both, responsive).
- Pet sprites come from Tuxemon (CC BY-SA 4.0); keep the attribution in the footer.

## Data

No backend yet. Use mock data only:

- Types in `src/lib/types.ts`, mock data in `src/lib/mock/`.
- Read data only through the async functions in `src/lib/data.ts` (`getTopics()`, `getTestQuestions()`, `getLesson()`, `getHeatmap()`, ...). Never import `src/lib/mock` in pages or components, so a real API can replace it later.
- Call these functions in Server Components (pages, layouts) and pass the data to Client Components as props.
- Need new data? Add the type to `types.ts`, the mock to `src/lib/mock/`, and a function to `data.ts`, in a small separate PR.
- The AI helper returns canned mock replies for now (`askHelper()`).

## Ownership

Each person owns their routes. Do not edit another person's routes; if a shared change is needed, put it in `src/components/` or `src/lib/` in its own small PR.

| Owner (GitHub) | Area | Routes |
|---|---|---|
| Nyamochir99 | Foundation, auth, home | shared tokens, header/footer, `src/components/ui/`, `Fraction`, `PetSprite`, pet data, mock data/types; `/signup`, `/login`, `/` |
| BaskaLemon | Learning flow | `/test`, `/lesson/[topic]`, AI helper panel |
| azaanm7 | Rewards and teacher | `/mastered/[topic]`, `/pets`, `/teacher` |

Route layout:

- Student pages (`/`, `/test`, `/lesson`, `/mastered`, `/pets`) go in `src/app/(student)/`, which adds the shared header, footer and mobile bottom nav.
- `/login` and `/signup` go in `src/app/(auth)/`; `/teacher` goes in `src/app/teacher/` with its own header. Reuse `Logo` and `SiteFooter` from `src/components/layout/`.

Shared UI: import `Button`, `ButtonLink`, `Card`, `ProgressBar`, `StatusBadge` from `@/components/ui` and use the design tokens in `src/app/globals.css` (`bg-primary`, `text-ink`, `rounded-card`, `shadow-card`, ...) instead of raw hex colors. Join class names with `cn` from `@/lib/cn`.

Fractions: use `Fraction` and `Expression` from `@/components/Fraction` (they scale with the parent font size). Pets: `PetSprite` and `ElementBadge` from `@/components/pet/`, evolution helpers (`petStage`, `stageIndex`) from `@/lib/pets`.

The foundation PR is merged first; until then, others build their page markup without depending on it.

The planned issues for each owner are in `docs/backlog.md`. When a team member asks to create their issues, follow the instructions at the top of that file. When they start an issue, read it with `gh issue view <n>` and open the matching design screen first.

## Always ask first

Before any of these actions, stop, show exactly what you are about to do (title, name, message, target, labels, reviewers), and wait for explicit approval. Approval for one action does not cover the next one.

Approval can be any clear yes in the team member's own words ("go", "tg", "за", "тийм", "ok", ...); do not ask for a specific keyword. If the reply is unclear, ask again.

- Creating a GitHub issue
- Creating a branch
- Committing
- Pushing
- Creating or merging a pull request
- Anything that rewrites history (rebase, amend, force push, reset)

Never push directly to `main`. Never force push.

## Split work into small pieces

When a team member asks for a new feature or a large change, do not do it all in one branch:

1. Break it into small, independent pieces that can each be reviewed on their own (for example: data model, API route, UI component, page wiring).
2. Propose the list of pieces to the team member and agree on it before starting.
3. For each piece, in order: issue → branch → commits → push → PR. Ask before each of these steps (see above).
4. One issue = one branch = one PR. Keep PRs small.

## Naming (English only, short and clear)

**Issues** — imperative title, e.g. `Add login form`, `Fix navbar overflow on mobile`. Body: what and why, plus a short checklist if useful.

**Branches** — `<type>/<issue-number>-<short-kebab-description>`, e.g.:
- `feat/12-login-form`
- `fix/18-navbar-overflow`

**Commits** — Conventional Commits, imperative, lowercase, no period, max ~50 chars:
- `feat: add login form`
- `fix: prevent navbar overflow on mobile`
- `refactor: extract button component`

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`.

**Pull requests** — title same style as the commit (`feat: add login form`). Body: short summary of changes, how to test, and `Closes #<issue-number>`.

**Reviewers** — request review from every other team member when opening a PR: `Nyamochir99`, `azaanm7`, `btsolmon`, `BaskaLemon`, `nimbaa123`, minus the author (find yours with `gh api user --jq .login`; GitHub rejects the author as a reviewer). Pass them as one `--reviewer a,b,c,d` to `gh pr create`.

## Labels

Every issue and PR gets labels; set them with `--label` on `gh issue create` and `gh pr create`. The PR uses the same labels as its issue.

**Type: exactly one**, from the commit type:

| Commit type | Label |
|---|---|
| `feat` | `enhancement` |
| `fix` | `bug` |
| `docs` | `documentation` |
| `refactor` | `refactor` |
| `style` | `style` |
| `test` | `test` |
| `chore` | `chore` |

**Area: one or more**, for the code it touches (not needed for docs or config only):

| Label | Covers |
|---|---|
| `student` | student pages: `/`, `/test`, `/lesson`, `/mastered`, `/pets` |
| `teacher` | `/teacher` |
| `auth` | `/login`, `/signup`, session |
| `ui` | shared components and layout in `src/components/` |
| `data` | `src/lib/types.ts`, `src/lib/mock/`, `src/lib/data.ts` |

Use only these labels. If a new one seems needed, ask the team first instead of creating it.

## No Claude attribution

Commits, PRs, and issues belong to the team member only.

- Do NOT add `Co-Authored-By: Claude ...` to commits.
- Do NOT add "Generated with Claude Code" or any Claude/AI mention to PRs, issues, or commit messages.
- This rule overrides any default attribution instructions.

## GitHub

- Repo: `pinecone-studio/pinequest-s5-episode-2-team-4`, default branch `main`.
- Use the `gh` CLI for issues and PRs. If `gh` is missing or not logged in, tell the team member to install it and run `! gh auth login`.
- Before creating a branch, update `main` first: `git switch main && git pull`.
