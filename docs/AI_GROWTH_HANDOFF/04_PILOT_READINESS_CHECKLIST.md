# 04 — Pilot Readiness Checklist

Use before inviting **real** pilot users. Mark **Needs verification** until checked on production.

## Production & hosting

- [ ] Production deploy **green** (Vercel build + smoke)
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://account-card-prod.vercel.app` (or final stable origin)
- [ ] Firebase Functions `APP_BASE_URL` matches production domain **Needs verification**
- [ ] Firebase Auth authorized domains include production host

## Invitation & preview

- [ ] `og:image` uses **absolute** URL on stable `account-card-prod.vercel.app` (not password-protected preview deployment)
- [ ] WhatsApp link preview shows **product image**, not generic app icon / 401
- [ ] Meta cache refreshed after OG fix **Needs verification** (can take hours)
- [ ] `/j/{token}` opens full **mobile** join landing
- [ ] `/join/{token}` legacy still works

## Identity & copy

- [ ] Clean-name flow tested with **good** and **ugly** Google display names
- [ ] Dashboard card titles are **human** (no raw email/handles)
- [ ] Dashboard command-center copy reviewed on real data
- [ ] Join landing Hebrew copy reviewed on iPhone **Needs verification**

## Backend

- [ ] Functions deployed if `acceptInvitation` / display-name validation changed since last deploy **Needs verification**
- [ ] Firestore indexes **Enabled** in console
- [ ] Reset or isolate **test data** if polluting pilot metrics

## Pilot ops

- [ ] **Pilot measurement sheet/system ready** — see [08_PILOT_MEASUREMENT_SYSTEM.md](./08_PILOT_MEASUREMENT_SYSTEM.md)
- [ ] Create **3** intentional pilot cards (distinct relationship types)
- [ ] Identify **first 5** pilot users (names + relationship type + WhatsApp send date)
- [ ] Qualitative interview script printed (section 7 in doc 08)
- [ ] Incident channel / founder on-call for first 48h

## Launch batch

- [ ] Send invites with approved WhatsApp copy
- [ ] Log each invite in measurement sheet (`invite_created`, `invite_shared_whatsapp`)
- [ ] Track activation metrics daily for 14 days — North Star in doc 08

## Documentation (post-green)

- [ ] **OPS_RUNBOOK** and **INCIDENT_LOG** created after production flow stable — see [07_RECENT_INCIDENTS_SUMMARY.md](./07_RECENT_INCIDENTS_SUMMARY.md)
