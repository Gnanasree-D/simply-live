# SimplyLive — Strategic Design Brief

A unified personal operating system for journaling, goals, habits, and time — built around the idea that **your day, your goals, and your reflections are the same data, viewed differently.**

---

## 1. Product Positioning & Core Promise

**Core insight:** Notion is infinitely flexible but demands you become an architect. Todoist nails tasks but ignores reflection. Habitica gamifies but feels juvenile. Streaks is beautiful but single-purpose. None connect *what I want* → *what I'm doing today* → *what I noticed*.

**SimplyLive's promise:** *"One quiet place where your goals, your day, and your thoughts talk to each other."*

The differentiator is **integration via a shared primitive** (a unified `Entry`) — a journal note can be tagged to a goal, a habit check-in can spawn a reflection, a timetable block can complete a to-do.

| Competitor | They do well | SimplyLive wins on |
|---|---|---|
| **Notion** | Infinite flexibility | Opinionated defaults — zero setup |
| **Todoist** | Task capture | Tasks live alongside reflection & goal context |
| **Habitica** | Gamification | Adult, calm aesthetic — streaks are evidence, not pressure |
| **Streaks** | Focused tracking | Captures *why* you did it, not just *that* you did |
| **Day One** | Journaling depth | Entries link to the goals/habits they reference |

### Minimum Lovable Product
A user can on day one:
1. Write a journal entry in under 10 seconds (quick capture)
2. See a **Today View** with today's blocks, to-dos, and habits
3. Tick a habit and watch a streak form
4. Tag any entry to a goal and see goal progress accumulate automatically

### Primary persona
*"The reflective achiever"* — late-20s to mid-40s knowledge worker, recovering from Notion overload, would pay $5–8/month for something that respects their time.

---

## 2. Module Breakdown

### Shared primitive — the `Entry` (the architectural keystone)

```ts
type Entry =
  | { kind: 'journal';   body: string;  mood?: Mood; ... }
  | { kind: 'todo';      title: string; done: boolean; due?: Date; ... }
  | { kind: 'habit';     habitId: ID;   completedAt: Date; ... }
  | { kind: 'block';     start: Date;   end: Date; title: string; ... }
  | { kind: 'goal-note'; goalId: ID;    body: string; ... }
// All entries share: id, createdAt, updatedAt, tags[], goalRefs[], userId
```

Today View, search, tagging, goal-progress rollups, and streak detection all operate on **one query surface** instead of five.

### Core modules (MVP)

| # | Module | Purpose | Depends on |
|---|---|---|---|
| 1 | **Auth & Account** | Sign-in, session, single-user data isolation | — |
| 2 | **Entry Core** | Shared schema, repository, tagging, search | Auth |
| 3 | **Journal** | Quick-capture writing, mood, daily prompts | Entry Core |
| 4 | **To-Do** | Capture, complete, due dates, recurring | Entry Core |
| 5 | **Habits & Streaks** | Define habits, daily check-in, streak math | Entry Core |
| 6 | **Today View** | The home screen — unified daily surface | All P0 modules |
| 7 | **Goals** | Goal definition, progress rollups from tagged entries | Entry Core |

### Nice-to-have (Phase 2+)
Timetable/time-blocking · Progress Dashboard · Templates & Prompts · Search & Tagging (advanced) · Insights · Export & Backup

---

## 3. Recommended Tech Stack & Project Structure

### Stack: Next.js 15 + Postgres + Prisma + Tailwind + shadcn/ui

| Layer | Choice | Reasoning |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Solo dev needs fullstack-in-one. Server Components reduce client bloat for read-heavy views. |
| **DB** | Postgres (Neon or Supabase) | `Entry` discriminated union maps cleanly to a single table with `kind` + JSONB. |
| **ORM** | Prisma | Type-safe schema → TS types. Fast solo-dev iteration. |
| **Auth** | Auth.js (NextAuth v5) | Email magic link + Google. Zero hosted-service cost. |
| **Validation** | Zod | Single source of truth for the Entry union — shared client/server. |
| **State** | TanStack Query + React Server Actions | RSC for reads, Server Actions for writes, TanStack Query for optimistic UI. |
| **Styling** | Tailwind + shadcn/ui | Calm aesthetic easier with shadcn's neutral defaults. |
| **Hosting** | Vercel | Zero-config for Next.js; generous free tier. |
| **PWA** | `next-pwa` or Serwist | Cheap path to "installable on phone" without native. |

### Project structure

```
gs-simply-live/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/sign-in/page.tsx
│   │   └── (app)/                    # authenticated shell
│   │       ├── today/page.tsx        # the home / Today View
│   │       ├── journal/page.tsx
│   │       ├── todos/page.tsx
│   │       ├── habits/page.tsx
│   │       └── goals/[goalId]/page.tsx
│   │
│   ├── core/                         # SHARED PRIMITIVES — the keystone
│   │   ├── entry/
│   │   │   ├── schema.ts             # Zod discriminated union for Entry
│   │   │   └── repository.ts
│   │   ├── goals/rollup.ts
│   │   ├── streaks/compute.ts        # pure functions
│   │   └── time/day.ts
│   │
│   ├── features/                     # UI + server actions per domain
│   │   ├── journal/  todos/  habits/  goals/  today/
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn-generated
│   │   ├── QuickCapture.tsx          # global keyboard-triggered
│   │   └── CommandBar.tsx
│   │
│   └── lib/  (db.ts, auth.ts, utils.ts)
│
├── prisma/schema.prisma
└── public/icons/                     # PWA icons
```

**Architectural rationale:**
- `core/` is **pure logic** — no React, no Next imports. Testable in isolation.
- `features/` owns UI + server actions per domain — easy to grok, easy to delete.
- `app/` is thin routing glue. Pages compose from `features/`.
- The `Entry` schema in `core/entry/schema.ts` is imported by every feature — change it once, types propagate everywhere.

---

## 4. UI/UX Style Direction

The aesthetic must signal **calm intentionality** — the opposite of Habitica's gamification and Notion's blank-canvas anxiety.

### Option A — "Quiet Paper" (RECOMMENDED)
Warm off-white, serif headers, generous whitespace. Reads like a thoughtful notebook. Inspired by Stoic, Day One, Things 3.

- **Palette:** background `#FAF8F4` (warm paper), ink `#1F1B16`, accent sage `#6B8F71`, muted clay `#C97B5A` (warnings), soft gold `#D4A95A` (streaks)
- **Typography:** **Fraunces** (serif, display + body emphasis) + **Inter** (UI, numerals). Line-height 1.7 for body.
- **Components:** `rounded-lg` (8px), subtle 1px borders rather than shadows, no gradients. Habit ticks are filled circles, not checkboxes.
- **Motion:** 150–200ms ease-out; streak completion gets a single gentle bloom, no confetti.
- **Vibe:** *"Sunday morning coffee, leather notebook."*

### Option B — "Modernist Grid"
Crisp, neutral, functional. Inspired by Linear, Cron, Arc.

- **Palette:** background `#FFFFFF` / dark `#0E0E10`, ink `#111`, accent indigo `#5B6CFF`
- **Typography:** **Inter** throughout, tight tracking, ALL-CAPS small labels
- **Vibe:** *"Productivity tool for people who use vim."*

### Option C — "Garden"
Soft, organic, slightly playful without being childish. Inspired by Stoic, Finch, Oak.

- **Palette:** background `#F4F1EC`, ink `#2A2A2A`, sage `#A8C5A0`, lavender `#B8A8D9`, peach `#F4B8A0`
- **Typography:** **DM Serif Display** + **DM Sans**
- **Vibe:** *"Self-care meets productivity, tasteful."*

### Top pick: Option A — Quiet Paper
The reflective-achiever persona is recovering from app overload. A serif-led, paper-toned interface signals "this is not another dopamine machine" — exactly the differentiation against Habitica/Streaks and the calm contrast to Notion. Borrow Option B's keyboard-density principles inside Option A's aesthetic.

---

## 5. Phased Roadmap

### Phase 1 — Foundation & Journal (Weeks 1–3)
Scaffold Next.js + Prisma + Auth.js + Tailwind + shadcn → define `Entry` schema in `core/entry/` and the Prisma model → build **Journal** feature fully (list, create, edit, delete, tag, search) → ship a basic Today View showing only today's journal entries → deploy to Vercel with magic-link sign-in.

**Exit criteria:** you can journal daily on your own phone for a week without bugs.

### Phase 2 — Today View as Integration Point (Weeks 4–7)
Add **To-Do** entry kind + UI → add **Habits & Streaks** with streak computation in `core/streaks/` → compose Today View to show journal + todos + habits in one surface → QuickCapture (global shortcut, mobile-friendly) → **Goals** module with tag-driven progress rollup → PWA install + offline-capable read for Today View.

**Exit criteria:** a friend can use it for two weeks and prefer it to their current setup for at least one workflow.

### Phase 3 — Depth & Retention (Weeks 8–12)
Timetable / time-blocking · weekly review templates and prompts · progress dashboard with charts (recharts) · export to Markdown/JSON · lightweight insights · polish (empty states, onboarding, keyboard shortcuts, theming).

**Beyond Phase 3:** AI-assisted weekly review summaries · Capacitor native shell if PWA hits a ceiling · integrations (Google Calendar read, Apple Health for habit auto-completion).

---

## 6. Three Positioning Decisions to Lock Before Scaffolding

### Decision 1 — Solo-only, or multi-user from day one?
**Recommendation: solo-only, but multi-tenant in the schema.** Put `userId` on every row from day one (Auth.js provides it for free); don't build sharing/teams/accountability-partners — that's a different product. The real question is whether this is *just for you* (portfolio/personal tool) or for *others to pay for* — that drives polish/onboarding/marketing, not architecture.

### Decision 2 — PWA-first, or web-only?
**Recommendation: PWA-first.** Journaling and habit tracking are phone-dominant behaviors; a web-only app will feel broken to the target persona within a week. PWA gets 90% of native value at 5% of the cost. Caveat: iOS PWA push notifications are still inconsistent — if push reminders become core to habit value-prop, may need Capacitor in Phase 3.

### Decision 3 — Free, freemium, or paid-only?
**Recommendation: free during private beta, freemium at public launch.**
- **Free tier:** unlimited journal/todos/habits, 1 goal, 30-day history
- **Paid tier ($5–7/mo or $48/yr):** unlimited goals, full history, export, insights, themes

Decide which features are paid **before** building them — gating after the fact upsets users; gating from day one is accepted. If this is purely personal with no monetization intent, ship everything free and skip the billing tables entirely.

---

## Recommended next steps

1. Answer the three positioning decisions above — cheap now, expensive in week 6.
2. Scaffold this week: `npx create-next-app@latest`, add Prisma + Auth.js + Tailwind + shadcn. Deploy "hello world" to Vercel before any feature.
3. Define `core/entry/schema.ts` + Prisma `Entry` model first — before any UI.
4. Build Journal end-to-end as Phase 1, deploy, dogfood for a week. Resist parallel features.
5. Pick the visual direction (Option A recommended) and generate shadcn components against that palette early.

Working directory for scaffolding: `C:\PProject\gs-simply-live`
