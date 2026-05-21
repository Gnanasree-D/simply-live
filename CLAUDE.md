@AGENTS.md

# SimplyLive — Project Conventions

A personal productivity & self-improvement web app: journaling, goals, habits, streaks, to-dos, time-blocking, progress monitoring. **Built for a single user**, deployed as a PWA. Fully free, no billing.

See `docs/DESIGN_BRIEF.md` for the full strategic brief (positioning, modules, roadmap, style direction).

## Stack
- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 (using `@theme inline` in `globals.css`, not `tailwind.config.ts`)
- Prisma 7 + Postgres
- Auth.js v5 (next-auth beta) — credentials provider, JWT session, single-user
- Zod for schema validation
- TanStack Query for client-side optimistic UI
- shadcn/ui (manually configured, `components.json` present, base color `stone`)
- Lucide icons

## Architectural keystone — the `Entry`
All domain objects share a single primitive: an `Entry` with a `kind` discriminator. Journal notes, todos, habit check-ins, time blocks, and goal notes all live in one Postgres `Entry` table (with `kind` + JSONB `data` payload). This is what makes the Today View, search, tagging, and goal rollups trivial — one query surface instead of five.

- TS source of truth: `src/core/entry/schema.ts` (Zod discriminated union)
- DB source of truth: `prisma/schema.prisma` (`Entry` model)
- Keep these in sync. Changes to one require changes to the other.

## Folder structure
```
src/
  app/                      # Next.js routes (thin, compose from features/)
  core/                     # PURE logic. No React, no Next imports. Testable.
    entry/schema.ts         # The Entry Zod union
    streaks/compute.ts      # Streak math
    goals/rollup.ts         # Goal progress rollup
    time/day.ts             # Timezone helpers
  features/                 # UI + server actions per domain
    journal/  todos/  habits/  goals/  today/
  components/               # Design-system primitives (shadcn ui/, shared)
  lib/                      # db, auth, utils
  types/                    # Ambient type augmentations
prisma/schema.prisma
docs/DESIGN_BRIEF.md
```

## Design language — "Quiet Paper"
- Warm off-white background `#FAF8F4`, ink `#1F1B16`
- Accent sage `#6B8F71` (primary), clay `#C97B5A` (destructive), gold `#D4A95A` (streaks)
- Serif for headings & emphasis (**Fraunces**), sans for UI (**Inter**)
- `rounded-lg` (8px), 1px borders rather than shadows, no gradients
- Streak completions: a single gentle bloom — no confetti, no juvenile gamification
- Vibe: "Sunday morning coffee, leather notebook." Calm, intentional, adult.

## Build & run
- `npm run dev` — local dev server
- `npm run build` — production build (includes typecheck)
- `npm run typecheck` — tsc only
- `npm run db:generate` — Prisma client
- `npm run db:migrate` — run a migration
- `npm run db:studio` — Prisma data browser

## Prisma 7 notes
- Connection URL lives in `prisma.config.ts`, **not** in `schema.prisma` (Prisma 7 dropped `datasource.url`).
- Runtime requires a **driver adapter**: we use `@prisma/adapter-pg` + `pg`. See `src/lib/db.ts`.
- `db` is exported as a lazy `Proxy` — `PrismaClient` only instantiates on first property access, so `DATABASE_URL` doesn't need to exist at build time.
- Corporate VPN intercepts TLS and breaks Prisma binary downloads. **Disconnect VPN** before running `prisma generate` / `prisma migrate`. Long-term fix: set `NODE_EXTRA_CA_CERTS=<path-to-corp-ca-bundle>`.

## Roadmap
- **Phase 1 (done):** scaffold ✓ · Entry schema ✓ · Journal feature end-to-end ✓
- **Phase 2 (done):** To-Do ✓ · Habits & Streaks (with categories, weekday + every-N-day cadence) ✓ · QuickCapture (Cmd+K / + FAB) ✓ · Goals (CRUD + entry linking + detail page) ✓ · Today View integration ✓ · PWA install polish ✓ (offline-reads via Serwist deferred)
- **Phase 3 (done):** Timetable ✓ · Weekly review templates ✓ · Progress dashboard ✓ · Nav layout polish ✓ · PDF consistency export ✓ · Insights ✓ · Polish pass ✓
- **Phase 4 (done):** Goal milestones + treasure-map roadmap + living tree visualization ✓ · Global loading feedback (brand pulse + inline button spinners) ✓ · Animated CSS (paper texture, scrollbar, motion tokens, reduced-motion respect) ✓
- **Phase 5 (done):** Vibrant Modern palette rebrand (cobalt + slate, gradients allowed) ✓ · Physical Activity tracking (workouts, water, steps) ✓ · Food Vlog tracking (meals + junk flag) ✓ · Body section on Dashboard / Insights / Today / PDF ✓

## Current state (2026-05-22)
- Dev server runs on localhost:3000 (Neon `neondb` in us-east-1). Single user: `simplylive82@gmail.com`. **16 protected routes live**: `/today`, `/journal`, `/timetable`, `/todos`, `/habits`, `/goals/[id]`, `/goals`, `/activity`, `/food`, `/review`, `/dashboard`, `/insights`, `/export`, plus `/sign-in`, public landing, and auth API.
- **Goal milestones** are todos with `goalRefs` populated. Conceptually distinct from generic todos: filtered OUT of `/todos` and `/today`'s to-do section. Created via `MilestoneComposer` on goal detail (`goalRefs` preset as hidden input). `TodoComposer` and `TodoCard` edit have GoalPicker removed — generic todos can't be linked to goals from the to-do flow. Existing `goalRefs` on edited todos are preserved via hidden inputs.
- **Treasure-map roadmap** (`src/features/goals/components/GoalRoadmap.tsx`): parchment background with SVG noise texture (`treasure-parchment` CSS class), winding cubic-bezier path with dashed brown + sage-fill "travelled" overlay, zigzag layout (top/bottom rows around center start/goal), numbered milestone stations, green flag at Start + golden Trophy at Goal, custom SVG `<AdventurerFigure>` walker with shaded fills (hat, peach face, sage shirt with darker right side, brown pants, backpack hint) that translates left/top with 900ms transition. Walker position = last-done milestone (stays at Start when 0 done, glides to Goal when all done — morphs to `<CelebrationFigure>`). Milestones use STABLE sort (by due asc, never reorder on done). `useOptimistic` lifted to parent so walker moves instantly on click. Compass-rose decoration in corner. Click milestone title or label area → `MilestoneQuickEdit` modal (uses `useTransition` for delete to avoid nested-form HTML error; Save uses `useActionState`).
- **Living tree** (`src/features/goals/components/GoalTree.tsx`): SVG drawn with Fibonacci-spiral leaf positions (almond-curve `<path>` with central vein + side hatches), 5-petal flower blossoms with gold center, and orange-gradient fruit. `computeTreeState` derives `leafCount = round(3 + progress × 25)`, flowers appear ≥75% progress, fruit ≥85%. Health = `max(20, 100 - overdue × 20)`; leaf color = `color-mix(in oklab, #5d8a64 health%, #a37d52)` so canopy literally browns with overdue and recovers on completion. Wilt also adds canopy droop + fallen leaves on soil. Container capped at `max-w-[260px]` mx-auto so tree is visibly smaller than the roadmap.
- **PDF export** (`src/features/export/pdf.tsx` + `src/core/export/pdf-data.ts`): per-goal card now includes a side-by-side **tree column** (compact 120×120 SVG with Fibonacci leaves + flowers + fruit, captioned "Sapling rooted" → "In full bloom ✦" or wilting variants) AND **roadmap column** (horizontal zigzag with travelled-vs-dashed path, numbered/check stations, green "S" + gold "★" markers, plus a textual milestone list with due-date + overdue highlighting). Existing 12-week linked-entry sparkline retained below.
- **Loading feedback**: brand "SimplyLive" wordmark in nav pulses opacity 100% ↔ 45% (1.1s loop) whenever any request is in flight — global document `click` + `submit` listeners in `useRequestPending()` hook (`src/components/useRequestPending.ts`). All form-action delete buttons use `SubmitIconButton` (built on `useFormStatus`) to swap their icon for `Loader2` while pending. PDF download card has its own per-card spinner via blob-fetch in `ExportDownloadCard`. `loading.tsx` at `(app)/` group provides skeleton fallback for route navigation.
- **CSS enhancements**: `globals.css` has motion tokens (`--ease-paper`), custom thin scrollbars, primary-tinted `::selection`, `caret-color: var(--primary)`, hanging punctuation, font-feature-settings for kerning/ligatures/stylistic-sets on serif headings, `font-optical-sizing: auto` (Fraunces variable). Opt-in utility classes: `paper-fade-in`, `streak-bloom`, `walker-bob`, `tree-sway`, `tree-bloom`, `brand-pulse`, `station-pulse`, `trophy-glow`. `prefers-reduced-motion: reduce` collapses every animation and transition to ~0ms.
- **Aesthetic — Vibrant Modern (default everywhere except goal detail)**: palette rebranded from Quiet Paper to a cooler, brighter system. CSS vars in `globals.css`:
  - `--background: #f6f7fb` (cool off-white) · `--card: #ffffff` (cards lift visibly)
  - `--primary: #4a6cd2` (cobalt) · `--destructive: #e5484d` (red) · `--ring: #4a6cd2`
  - `--foreground: #1a1c25` (slate ink) · `--border: #e4e6ee` (cool gray)
  - `--accent: #fef0e8` with terracotta foreground for a complementary warmth
  - `--streak: #d4a95a` retained as semantic gold
  - Bonus chart accents registered as vars: `--accent-plum`, `--accent-coral`, `--accent-teal`, `--accent-iris`, `--accent-ochre`, `--accent-mint`
  - **Paper-grain noise REMOVED** from body; replaced with two faint radial gradients (cobalt top-left, coral bottom-right) on `background-attachment: fixed`
  - Gradients are now welcome where appropriate; cards get `box-shadow` lift on `.card-hover-lift` instead of being border-only
  - Full dark-mode counterparts defined
- **Aesthetic exception — goal detail (`/goals/[id]`)**: keeps the warm parchment treasure-map palette via the unchanged `treasure-parchment` CSS class. The two visual languages coexist by being scoped to distinct surfaces. See `feedback-quiet-paper.md` memory for rationale.
- **Physical Activity (`/activity`)**: data is `Entry kind=ACTIVITY` with `data.subtype: "workout" | "water" | "steps"`. Schema in `src/features/activity/`. Server actions: `logWater` (append +1 cup), `logWorkout` (title + duration + notes), `setSteps` (upsert today's count), `deleteActivity`. Page has 3 quick-action cards (Water tap-to-log with `useOptimistic`, Steps inline number form, Workout collapsible composer) and a chronological today log. `getDailyActivitySummary` aggregates cups/steps/workouts for today.
- **Food Vlog (`/food`)**: data is `Entry kind=FOOD` with `data: { name, isJunk, meal?, notes? }` where meal is `breakfast | lunch | dinner | snack`. Schema in `src/features/food/`. Server actions: `createFood`, `updateFood`, `deleteFood`. Page has a composer (name input + meal toggle pills + Junk toggle pill that turns red destructive) and today's list (cards with red border when junk). Bottom card shows 7-day total + junk percentage.
- **Body integration**:
  - **Today page**: two new sections between To-Do and Habits — "Activity" (3-column stat row: water, steps, workouts) and "Food" (compact list of up to 6 entries with optional junk badge + meal label). Section headers link to the dedicated pages.
  - **Dashboard**: new "Body" section with 4-row card (Workouts, Water, Steps, Food), each showing icon + label + sub-stat + 14-day sparkline. Workouts use binary filled/empty bars; water + steps use intensity gradients; food uses two-tone (mint clean + red junk) stacked bars per day. Backed by `buildBodySummary()` in `src/features/dashboard/queries.ts`.
  - **Insights**: two new sections — "Workout days" (7-bar weekday chart over 12 weeks with total/min footer) and "Food trend" (4 weekly stacked bars mint/red with junk % footer). Compute in `src/core/insights/compute.ts` (`computeBodyInsights`), backed by activities + foods arrays added to `InsightInput`.
  - **PDF**: new "Body" section between Habits and Goals — only renders if there's at least one activity or food entry in last 14 days. Contains 4 stat tiles (workouts/water/steps/food%junk), two side-by-side mini-sparklines (workout days + food/junk per day), and a weekday workout distribution bar chart. Built via `buildBodyReport()` in `pdf-data.ts`.
- **Schema additions**: `EntryKind` enum extended with `ACTIVITY` and `FOOD`. Synced via `prisma db push` (project has no migration history). `ActivityEntrySchema` and `FoodEntrySchema` added to `src/core/entry/schema.ts` discriminated union with matching TypeScript types.
- **Timetable** (unchanged): 30-min snapping on drop/click. Drop accounts for grab-offset (cursor's Y inside the dragged block) so dropping a 10:00–12:00 block by its middle lands the BLOCK TOP at the cursor's row, not the cursor itself.
- **Deferred PWA polish**: PNG icons (manifest still references SVGs at 192/512) + `screenshots` array. Needs manual PNG export + screenshot capture.

## Conventions
- Server Components by default; `"use client"` only when needed
- Server Actions for mutations, not API routes (api/ reserved for webhooks/Auth.js)
- Zod schemas are the single source of truth — share between server actions and forms
- `core/` is pure — no Next/React imports. Test in isolation.
- Don't add comments unless the *why* is non-obvious.
- Don't introduce abstractions until there are 3+ concrete uses.
