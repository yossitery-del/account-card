# 06 — Open Issues & Backlog

## Immediate (pre-pilot / ops)

| Issue | Notes |
|-------|--------|
| Stable OG origin commit/deploy | Ensure `NEXT_PUBLIC_APP_URL` + absolute `og:image` on production; **Needs verification** if latest fix is live |
| WhatsApp preview after Meta cache | Re-scrape link; old 401/icon cache may linger **hours** |
| Join page on iPhone | Full landing, Google sign-in, name step, accept — **Needs verification** on real device |
| Clean display names in production | End-to-end with ugly Google accounts **Needs verification** |
| Functions deploy | If `acceptInvitation` / `displayNameQuality` changed locally — **Needs verification** against `firebase functions:list` |
| OPS_RUNBOOK + INCIDENT_LOG | Not in repo yet — create after production flow green ([07](./07_RECENT_INCIDENTS_SUMMARY.md)) |

## Post-pilot product backlog

| Item | Status |
|------|--------|
| Personal rename / `labelForMe` | Documented in roadmap; `resolveViewerCardDisplayTitle` has hook; not full UX |
| Third-party card **summary** share via WhatsApp | Not invitation — backlog |
| Short codes instead of long tokens | Backlog |
| Branded domain (not bodekli.com now) | Post-pilot |
| In-app analytics dashboard | After pilot manual metrics prove value |
| Stronger onboarding metrics | Tied to 08 events → product analytics |
| Pricing / paywall | Decision after pilot Go/No-Go |
| Join preview visual mockup (2B-3.1) | Future — static demo on join page |
| PWA “Add to Home Screen” (2B-6) | Planned after stable join |
| 2D-1 automated balance/permission tests | Engineering — not growth-blocking |

## Engineering / reliability (awareness)

- Light refresh after mutations — shipped (2D-P1A/P1B)
- No GA/Mixpanel per privacy decisions — pilot uses manual sheet
- Pagination for large entry lists — future (~100–200 entries/card per perf docs)
