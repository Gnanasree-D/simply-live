---
name: simplylive-project
description: SimplyLive is a solo-dev personal productivity web app (journaling + goals + habits + tasks + schedule + streaks + progress) being designed from scratch in C:\PProject\gs-simply-live
metadata:
  type: project
---

SimplyLive is a new web app being designed by the user (solo developer). Working directory: C:\PProject\gs-simply-live (empty as of 2026-05-19).

Scope: journaling, goal setting, schedules/timetables, todos, habits, streaks, progress monitoring, goal planning (milestones).

**Why:** User wants strategic design guidance before writing code. Stated explicit preference for opinionated recommendations over option lists.

**How to apply:** When the user returns for follow-up design or implementation work, anchor on the recommended positioning ("The Loop + Calm by default", solo-only, intentional-generalist persona) and the recommended stack (Next.js 15 + Drizzle + Postgres + Better Auth + Tailwind v4 + shadcn + Tiptap). The core architectural primitive proposed is an "Entry" discriminated union shared by journal/task/habit_log/block/milestone — this is the load-bearing abstraction. Top style pick: "Quiet Paper" (warm off-white #FBF8F3, Fraunces + Inter, sage success #6B8E5A). See [[simplylive-positioning-decisions]].