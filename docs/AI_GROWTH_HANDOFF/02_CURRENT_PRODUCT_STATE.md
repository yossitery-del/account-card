# 02 — Current Product State

Summary of **implemented** capabilities (MVP / pre-pilot). Source of truth: repo + `docs/PROJECT_STATE.md`.

## Stack

- **Frontend:** Next.js App Router (see `AGENTS.md` — APIs may differ from classic Next.js)
- **Auth:** Google Sign-In (Firebase Auth)
- **Backend:** Firebase `account-card-18e3a` — Firestore, Callable Functions (`europe-west1`)
- **Hosting:** Production UI on **Vercel** — https://account-card-prod.vercel.app

## Data model (pilot)

- `accountCards/{cardId}` — card root (title, balances, currency ILS, status)
- Subcollections: `participants`, `invitations`, `entries`, `auditEvents`
- Cards are **not** nested under `users/{uid}`; membership via `participants`

## Implemented features

### Account cards

- Server `createAccountCard` — owner participant + audit
- Create UI: **«מול מי הכרטיס?»** — label for creator’s dashboard title (stored `title`)
- Viewer-facing list title: other party’s **clean display name** when exactly two active participants (`resolveViewerCardDisplayTitle`)

### Participants & invitations

- Invitation token (hashed server-side)
- Share URL: **`/j/{token}`** (preferred); **`/join/{token}`** legacy still works
- `getInvitationPreview` — limited public preview (no cardId, balances, entries)
- `acceptInvitation` — second participant, invitation → accepted
- WhatsApp share via `wa.me` intent (client-side, not Business API)

### Entries & approvals (Stage 2C — closed in docs)

- `createEntry` → **pending**; updates `pendingBalanceImpact`
- `approveEntry` / `rejectEntry` → official balance on approve only
- `cancelEntry` (creator, pending only)
- `editEntry` (creator, pending only)
- Light refresh after mutations (2D-P1A/P1B)

### Dashboard

- Command center copy (`dashboardCopy.ts`):
  - **«מוכן לפתיחת כרטיס ראשון»** — 0 cards
  - **«החלטה אחת ממתינה לאישורך»** / **«N החלטות ממתינות לאישורך»**
  - **«הכול מעודכן»** — no pending decisions
  - Meta: **«כרטיס חשבון פעיל אחד»** / **«N כרטיסי חשבון פעילים»**
- Card list: pending badges, quick approve/reject where implemented
- **Needs verification:** exact production HEAD and deploy date

### Join & OG

- **Click path:** `JoinLandingPage` at `/j/[token]` and `/join/[token]`
- **Preview layer:** OG image route — static product creative, **no real user/card data** in PNG
- `NEXT_PUBLIC_APP_URL` / `joinOgPublicOrigin()` for stable `og:image` absolute URLs
- Clean display name step when Google name fails quality checks (`displayNameQuality.ts`)

### Not implemented (do not claim)

- Product analytics pipeline (GA/Mixpanel) — **manual pilot tracking** per [08](./08_PILOT_MEASUREMENT_SYSTEM.md)
- PWA onboarding (2B-6) — planned only
- Short codes instead of long tokens — backlog
- Payments, invoices, PDF export, full encryption — out of pilot scope
- Third-party “summary share” on WhatsApp — backlog

## Privacy note

`docs/PRIVACY_DECISIONS.md`: no analytics on **card content**; system events only if/when added. Pilot may use **manual sheets** or Firestore/admin inspection — not end-user tracking UI yet.
