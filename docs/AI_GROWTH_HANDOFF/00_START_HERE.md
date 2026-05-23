# 00 — Start Here (AI Handoff)

## Product

**Name:** כרטיס חשבון  
**What it is:** A private, Hebrew-first **digital shared account card** (mutual ledger) between two sides. Each action is recorded, the other side approves or rejects, and only **approved** actions affect the **official balance**.  
**What it is not:** ERP, accounting software, payments, banking, Splitwise-style expense splitting, or a one-sided “debt app.”

## Current goal

**Prepare and launch a real-user pilot** — prove that pairs create cards, invite via WhatsApp, join, record actions, and approve without heavy handholding.

## Long-term ambition

Scale to **~30,000 account owners**, each potentially managing **many** shared cards (clients, suppliers, partners, family, etc.).

## Production & infra (public facts only)

| Item | Value |
|------|--------|
| Production URL | https://account-card-prod.vercel.app |
| Firebase project | `account-card-18e3a` |
| Share path (preferred) | `/j/{token}` |
| Legacy join path | `/join/{token}` |

## Critical warnings for the next AI

1. **OG preview ≠ real join page** — WhatsApp/crawlers see `opengraph-image` (static marketing PNG). Humans land on `JoinLandingPage` after click. Do not treat OG mock numbers or headlines as live product data.
2. **Do not mix with BodekLi / bodekli.com** for this pilot — separate brand and domain strategy; branded domain is post-pilot backlog.
3. **No secrets in this folder** — no service accounts, private tokens, or `.env` values.
4. **Do not invent shipped features** — if unsure, mark **Needs verification** and check `docs/PROJECT_STATE.md` or the repo.

## How to read this pack

1. This file (context)  
2. [05_GROWTH_BRIEF.md](./05_GROWTH_BRIEF.md) (your main job)  
3. [04_PILOT_READINESS_CHECKLIST.md](./04_PILOT_READINESS_CHECKLIST.md) (go-live gates)  
4. [08_PILOT_MEASUREMENT_SYSTEM.md](./08_PILOT_MEASUREMENT_SYSTEM.md) (how we know the pilot worked)

See [README.md](./README.md) for the full index.
