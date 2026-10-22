# Backlog

Issues to create, grouped by owner. When a team member asks Claude to create their issues, create only that person's issues from this file, in order, assigned to them (`gh issue create --assignee <login>`). Show the full list first and wait for approval. Skip any issue that already exists with the same title.

Design screen names below refer to boards in the design (see CLAUDE.md). Every page needs both the 1440 and 390 versions.

## Nyamochir99 — foundation, auth, home

Foundation issues (1–5) unblock everyone else; do them first and keep each PR small.

1. **Add design tokens and fonts**
   Colors, fonts, spacing and radii from the design as Tailwind theme tokens in `src/app/globals.css`; fonts via `next/font`.
2. **Add header and footer layout**
   Shared header (logo, Тоглох, Тэжээвэр, level badge, Багш) and footer with Tuxemon CC BY-SA 4.0 attribution, used in the root layout. Responsive.
3. **Add shared UI components**
   `Button`, `Card`, `ProgressBar`, `StatusBadge` (Сул / Сайн / Эзэмшсэн / Шинэ) in `src/components/ui/`.
4. **Add mock data and types**
   Types in `src/lib/types.ts` (user, pet, topic, subtopic, progress, question, student) and mock data in `src/lib/mock/`, read through functions like `getTopics()`, `getQuestions()`, `getClassProgress()`.
5. **Add pet data and sprite component**
   13 pet lines with element and 3 evolutions (levels 1–2, 3–5, 6+), and a `PetSprite` component. Add a `Fraction` component (numerator over denominator, optional whole part) in `src/components/`.
6. **Build signup page** — design: 0a · Бүртгүүлэх. Route `/signup`: pet picker, username, email, password, optional class code.
7. **Build login page** — design: 0b · Нэвтрэх. Route `/login`: username, password, class code.
8. **Build home page** — design: 1 · Нүүр. Route `/`: hero with pet, topic card with subtopic list and status.

## BaskaLemon — learning flow

Depends on foundation issues 1–5; until they merge, build markup with plain elements.

1. **Build diagnostic test page** — design: 2 · Тест. Route `/test`: 8 questions, progress count, previous/next, finish.
2. **Build lesson results section** — design: 3 · Үр дүн ба хичээл. Route `/lesson/[topic]`: score and weak/strong subtopic list.
3. **Build lesson explanation section** — same screen: the common mistake and the step-by-step visual explanation.
4. **Build lesson practice section** — same screen: practice questions with correct/try-again feedback and "Дахин шалгуулах".
5. **Add AI helper panel** — same screen: chat panel with suggestion chips, canned mock replies.

## azaanm7 — rewards and teacher

Depends on foundation issues 1–5; until they merge, build markup with plain elements.

1. **Build mastered page** — design: 4 · Эзэмшсэн. Route `/mastered/[topic]`: celebration, pet level up, XP bar, next subtopics.
2. **Build pets page** — design: Тэжээвэр. Route `/pets`: the user's pet and the collection of all pet lines with evolutions.
3. **Build teacher heatmap** — design: 5 · Багшийн самбар. Route `/teacher`: class stats and subtopic × student heatmap.
4. **Add teacher assignment drafts** — same screen: AI-drafted assignment with draft/published state, edit, assign to students.
5. **Add teacher notifications** — same screen: notification list.
