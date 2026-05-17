# כרטיס חשבון (`account-card`)

פנקס חשבון דיגיטלי משותף בין שני צדדים — תיעוד והסכמה, לא העברת כסף.

**סטטוס:** מעגל pending **2C-1**–**2C-4** סגור; **2D-0**, **2D-P1A**, **2D-P1B** סגורים (תשתית בדיקות + light refresh — QA PASS). שלב חדש (כולל **2D-1**) — רק באישור מפורש. [docs/PROJECT_STATE.md](./docs/PROJECT_STATE.md)

**מצב מלא:** [docs/PROJECT_STATE.md](./docs/PROJECT_STATE.md)

## דרישות

- Node.js 20+
- Java JDK 21+ לבדיקות Firebase Emulator; מומלץ Temurin 21 LTS
- Firebase Blaze (ל-Functions) — ראה [docs/STAGE2B-0_FUNCTIONS.md](./docs/STAGE2B-0_FUNCTIONS.md)

## התקנה והרצה

```bash
npm install
cp .env.example .env.local   # השלם Firebase
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000) — ממשק RTL בעברית, גופן Assistant.

```bash
npm run build
npm run lint
```

### בדיקות

```bash
npm run test:functions
npm run test:functions:emulator
npm run test:rules
npm run test:all
```

בדיקות האמולטור דורשות Java 21 ומעלה. התקנה מומלצת ב-macOS:

```bash
brew install --cask temurin@21
java -version
```

### Functions (שרת)

```bash
cd functions && npm install && npm run build
```

## Stages

| Stage | סטטוס |
|-------|--------|
| 0 — יסוד | הושלם |
| 1 — Auth | הושלם |
| 2A — כרטיסים (client) | הושלם |
| 2B-0 — Functions `health` | מאושר |
| 2B-1 — create בשרת | מאושר |
| 2B-2 + 2B-2.1 — Invitation | מאושר (claim-on-accept, wa.me, UX) |
| 2B-3 — Join Preview | מאושר ונסגר |
| 2B-4 — Accept Invitation | מאושר ונסגר — accept, Join UX, Security Audit (A/B) |
| 2C-1 — Create Pending Entry | **סגור** — [מסמך](docs/STAGE2C-1_CREATE_PENDING_ENTRY.md) |
| 2C-2 — Approve / Reject | **סגור** — [מסמך](docs/STAGE2C-2_APPROVE_REJECT.md) |
| 2C-3 — Cancel Pending Entry | **סגור** — [מסמך](docs/STAGE2C-3_CANCEL_PENDING_ENTRY.md) |
| 2C-4 — Edit Pending Entry | **סגור** — [מסמך](docs/STAGE2C-4_EDIT_PENDING_ENTRY.md) |
| 2D-0 — Test Harness Foundation | **סגור** — [מסמך](docs/STAGE2D_RELIABILITY_PRODUCT_SAFETY.md) |
| 2D-P1A — Light Refresh (`createEntry`) | **סגור (QA PASS)** — [מסמך](docs/STAGE2D-P1A_LIGHT_REFRESH_CREATE.md) |
| 2D-P1B — Light Refresh (approve/reject/cancel/edit) | **סגור (QA PASS)** — approve/edit עשן ידני; reject/cancel כיסוי מסלול משותף (לא עשן ידני בדפדפן) — [מסמך](docs/STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md) |
| 2D-1 — Balance & Permission Function Tests | הבא מומלץ — רק באישור מפורש |

## מסמכי יסוד

| מסמך | תוכן |
|------|------|
| [docs/PROJECT_STATE.md](./docs/PROJECT_STATE.md) | סטטוס פרויקט |
| [docs/PRODUCT_SCOPE.md](./docs/PRODUCT_SCOPE.md) | היקף מוצר |
| [docs/STAGE2B-3_JOIN_PREVIEW.md](./docs/STAGE2B-3_JOIN_PREVIEW.md) | Join preview — סגור |
| [docs/STAGE2B-4_ACCEPT_INVITATION.md](./docs/STAGE2B-4_ACCEPT_INVITATION.md) | Accept + Join UX — סגור |
| [docs/STAGE2C_ENTRIES.md](./docs/STAGE2C_ENTRIES.md) | Entries — תכנון |
| [docs/STAGE2D_RELIABILITY_PRODUCT_SAFETY.md](./docs/STAGE2D_RELIABILITY_PRODUCT_SAFETY.md) | בדיקות ויציבות — 2D-0 סגור |
| [docs/STAGE2D-P1A_LIGHT_REFRESH_CREATE.md](./docs/STAGE2D-P1A_LIGHT_REFRESH_CREATE.md) | 2D-P1A — סגור |
| [docs/STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md](./docs/STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md) | 2D-P1B — סגור |
| [docs/PERF_BASELINE.md](./docs/PERF_BASELINE.md) | מדידות ביצועים ועלות Firebase |
| [docs/TRUTH_DATASET.md](./docs/TRUTH_DATASET.md) | רגרסיה יתרות |
| [docs/STAGE2B-2_INVITATION_TOKEN.md](./docs/STAGE2B-2_INVITATION_TOKEN.md) | הזמנות + 2B-2.1 |
| [docs/STAGE2B-1_CREATE_CARD.md](./docs/STAGE2B-1_CREATE_CARD.md) | יצירת כרטיס בשרת |
| [docs/STAGE2B-0_FUNCTIONS.md](./docs/STAGE2B-0_FUNCTIONS.md) | Functions foundation |
| [docs/STAGE2A_CARDS.md](./docs/STAGE2A_CARDS.md) | כרטיסים |
| [docs/STAGE1_AUTH.md](./docs/STAGE1_AUTH.md) | Auth |

## Firebase

- פרויקט: `account-card-18e3a`
- תוכנית: **Blaze** (פעיל)
- Region Functions: `europe-west1` — `health`, `createAccountCard`, `createInvitation`, `getInvitationPreview`, `acceptInvitation`, `createEntry`, `approveEntry`, `rejectEntry`, `cancelEntry`, `editEntry`
- `APP_BASE_URL` — Functions Parameter (ראה `functions/.env.example`)
- Artifact Registry: cleanup תמונות — **7 ימים**
- `firebase deploy --only firestore:rules,firestore:indexes`
- `firebase deploy --only functions`

## נפרד מ-KUPA

פרויקט, Firebase ומודל נתונים נפרדים — ללא העתקת קוד מ-KUPA.
