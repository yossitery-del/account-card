# 05 — Growth Brief (main assignment)

## Role you need

**Chief Growth Architect** — not a generic social media manager.

You own: ICP, offer, funnel design, WhatsApp-native GTM, pilot instrumentation, objection handling, pricing **direction**, and a **14-day launch plan** with measurable gates.

## Business context

| Dimension | Target |
|-----------|--------|
| North Star (pilot) | Active cards with **two sides** and **≥1 approved entry** — [08](./08_PILOT_MEASUREMENT_SYSTEM.md) |
| Scale ambition | ~**30,000 account owners**, many cards each |
| Production | https://account-card-prod.vercel.app |
| Language / market | Hebrew, RTL, Israel-first relationships |
| Channel | **WhatsApp-first** acquisition and invites |

## Deliverables requested from you

1. **ICP** — 2–3 wedges (e.g. freelancer–client, supplier–buyer) with sharp pain and trigger moments  
2. **Offer** — one-sentence promise + what we ask users to do in week 1  
3. **Funnel** — map to events in doc 08; benchmarks per step  
4. **14-day launch plan** — day-by-day: outreach, demos, reminders, founder touchpoints  
5. **WhatsApp scripts** — invite (existing copy), follow-up nudges, “second side didn’t join” recovery  
6. **Status / content** — 5–10 LinkedIn or WhatsApp Status angles (Hebrew), premium tone  
7. **Demo assets** — what to screen-record; what **not** to show (OG vs app)  
8. **Objection handling** — “why not Excel”, “why should they join”, “is this legal/tax”, “another app?”  
9. **Metrics & sheet** — adopt [08](./08_PILOT_MEASUREMENT_SYSTEM.md); suggest weekly readout format  
10. **Pricing direction** — hypotheses only (per card? per seat? freemium cap?) — no code

## Constraints

- **Do not** position as BodekLi / bodekli.com in this pilot.  
- **Do not** promise payments, invoices, or bank-grade security.  
- Product has **no** in-app analytics yet — pilot tracking is **manual** unless founder adds events.  
- Respect privacy: no scraping card balances for marketing.

## Reference docs in this folder

| File | Use |
|------|-----|
| [01_PRODUCT_STRATEGY.md](./01_PRODUCT_STRATEGY.md) | Positioning |
| [02_CURRENT_PRODUCT_STATE.md](./02_CURRENT_PRODUCT_STATE.md) | What exists |
| [03_INVITATION_AND_JOIN_UX.md](./03_INVITATION_AND_JOIN_UX.md) | Invite/join copy |
| [04_PILOT_READINESS_CHECKLIST.md](./04_PILOT_READINESS_CHECKLIST.md) | Go-live gates |
| [08_PILOT_MEASUREMENT_SYSTEM.md](./08_PILOT_MEASUREMENT_SYSTEM.md) | Metrics |

---

## Prompt to paste into the next AI chat

```
You are Chief Growth Architect for «כרטיס חשבון» — a Hebrew, premium digital shared account card (mutual ledger) between two sides. Not payments, not ERP, not Splitwise.

Production: https://account-card-prod.vercel.app
Invite path: /j/{token}
Firebase: account-card-18e3a

Read these files in order:
1) docs/AI_GROWTH_HANDOFF/00_START_HERE.md
2) docs/AI_GROWTH_HANDOFF/05_GROWTH_BRIEF.md (this brief)
3) docs/AI_GROWTH_HANDOFF/08_PILOT_MEASUREMENT_SYSTEM.md
4) docs/AI_GROWTH_HANDOFF/03_INVITATION_AND_JOIN_UX.md
5) docs/AI_GROWTH_HANDOFF/04_PILOT_READINESS_CHECKLIST.md

Your job:
- Define ICP and wedge for first 20–50 pilot users
- Build a 14-day pilot GTM plan (WhatsApp-first)
- Write outreach scripts, follow-ups, and objection handling in Hebrew
- Align funnel to the event names in 08_PILOT_MEASUREMENT_SYSTEM.md
- Propose Go/No-Go criteria after 14 days using the Green/Yellow/Red framework in doc 08
- Suggest pricing direction hypotheses only (no implementation)

Warnings:
- OG WhatsApp preview is static marketing; real app is JoinLandingPage after click
- Do not mix brand with BodekLi/bodekli.com in this pilot
- Do not invent product features; check 02_CURRENT_PRODUCT_STATE.md

Deliver: ICP doc, funnel table with benchmarks, 14-day calendar, WhatsApp scripts, status content ideas, demo storyboard, weekly metrics template, and recommended pilot cohort list structure.
```
