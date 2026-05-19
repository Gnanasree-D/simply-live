---
name: simplylive-positioning-decisions
description: Three open positioning decisions for SimplyLive that need user input before architecture is finalized
metadata:
  type: project
---

Three positioning decisions were surfaced for SimplyLive on 2026-05-19 and are still **open** — user has not yet decided:

1. **Solo-only forever, or eventually social?** (Recommended: solo-only — it's the moat)
2. **Web-only or PWA/mobile from day one?** (Recommended: PWA-first because journaling and habit check-ins are mobile behaviors)
3. **Free tier or paid-only?** (Recommended: paid-only with optional 14-day trial — filters for commitment)

**Why:** These decisions change the data model (multi-user vs. solo), the deployment surface (PWA manifests, offline-first sync), and the onboarding flow. Architecting before deciding risks rework.

**How to apply:** Before helping with any implementation work, confirm where the user landed on these three. If they want to start coding without deciding, flag the risk and propose a default (likely: solo-only, PWA-first, paid-only). See [[simplylive-project]].