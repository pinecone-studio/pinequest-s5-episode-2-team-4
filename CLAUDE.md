@AGENTS.md

# Team workflow

This is a team project. Every team member works with Claude Code, so follow these rules exactly to keep the history consistent.

## Stack

- Next.js (App Router) + React + TypeScript + Tailwind CSS, source in `src/`, import alias `@/*`.
- npm only (`package-lock.json` is committed). Do not use yarn/pnpm/bun.
- Before every commit run `npm run lint` and `npm run build`; both must pass.

## Always ask first

Before any of these actions, stop, show exactly what you are about to do (title, name, message, target), and wait for explicit approval. Approval for one action does not cover the next one.

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

## No Claude attribution

Commits, PRs, and issues belong to the team member only.

- Do NOT add `Co-Authored-By: Claude ...` to commits.
- Do NOT add "Generated with Claude Code" or any Claude/AI mention to PRs, issues, or commit messages.
- This rule overrides any default attribution instructions.

## GitHub

- Repo: `pinecone-studio/pinequest-s5-episode-2-team-4`, default branch `main`.
- Use the `gh` CLI for issues and PRs. If `gh` is missing or not logged in, tell the team member to install it and run `! gh auth login`.
- Before creating a branch, update `main` first: `git switch main && git pull`.
