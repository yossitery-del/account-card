# Stage 2B-1 — Server Create Card

**סטטוס: מאושר ונסגר** — אימות ידני בפרודקשן בוצע. אין קוד פתוח ב-2B-1.

## סיכום (נעול)

| נושא | מצב |
|------|-----|
| `createAccountCard` | **בשרת** (Callable, `europe-west1`) |
| client `writeBatch` | **הוסר** |
| `accountCards` / `participants` create מהלקוח | **חסום** ב-Rules |
| audit לכרטיס חדש | `card.created` + `participant.added` |
| כרטיסי 2A | קריאה — ללא audit היסטורי |

## אימות שלב (בוצע)

| בדיקה | תוצאה |
|--------|--------|
| יצירת כרטיס מהאפליקציה | הצלחה |
| מקור יצירה | `createAccountCard` Function |
| Firestore | card + participant + 2 audit events |
| דשבורד | כרטיס חדש מוצג |
| כרטיסים ישנים (2A) | עדיין קריאים |
| `health` callable | regression — עובד |

## מה נבנה

- Callable Function `createAccountCard` (`europe-west1`)
- יצירה אטומית בשרת: `accountCards/{cardId}` + `participants/{uid}` + 2 `auditEvents`
- לקוח: `src/lib/cards/createAccountCard.ts` קורא ל-Function במקום `writeBatch`
- `firestore.rules`: deny create/update/delete מהלקוח על כרטיסים ומשתתפים; read ל-audit ל-participant פעיל
- תיעוד + עדכון `PROJECT_STATE.md`

## למה העברנו create לשרת

ב-Stage 2A יצירת כרטיס הייתה **client `writeBatch`** עם `getAfter()` ב-Rules — פתרון זמני על Spark.

מ-2B-0 יש Blaze ו-Functions. ב-2B-1:

- לוגיקת יצירה ריכוזית בשרת (Admin SDK)
- audit מינימלי ב-commit אחד
- הלקוח **לא יכול** ליצור כרטיסים/משתתפים ישירות — מוכן ל-invitations ופעולות עתידיות

## איך ה-Function עובדת

| פריט | ערך |
|------|-----|
| שם | `createAccountCard` |
| סוג | Callable v2 |
| Region | `europe-west1` |
| Auth | חובה — `unauthenticated` אם לא מחובר |
| Input | `{ title: string }` — trim, אורך 1–200 |
| Output | `{ cardId: string }` |

### זרימה

1. `requireAuthUid(request)`
2. ולידציית `title`
3. `email` / `displayName` מ-`request.auth.token` (fallback: שם ← אימייל ← «משתמש»)
4. `db.batch()`: card + participant + 2 audit events
5. `commit` → `{ cardId }`

## מה נכתב ל-Firestore

### `accountCards/{cardId}`

`title`, `currency: "ILS"`, `status: "active"`, `createdByUid`, `balancePerspectiveUid`, `createdAt`, `updatedAt`, `officialBalance: 0`, `pendingBalanceImpact: 0`, `encryptionMode: "none"`, `dataSchemaVersion: 1`

### `participants/{uid}`

`uid`, `email`, `displayName`, `role: "owner"`, `status: "active"`, `joinedAt`, `invitedByUid: null`, `permissions` (כולם `true`)

### `auditEvents` (2 מסמכים)

| action | entityType | entityId | metadata |
|--------|------------|----------|----------|
| `card.created` | `card` | cardId | `{}` |
| `participant.added` | `participant` | uid | `{ role: "owner" }` |

## Rules שהשתנו

| path | לפני (2A) | אחרי (2B-1) |
|------|-----------|-------------|
| `accountCards` create | client + getAfter | **deny** |
| `participants` create | client + getAfter | **deny** |
| `auditEvents` read | deny | **participant active** |
| `auditEvents` write | deny | deny (רק שרת) |

**הוסרו:** `validCardResource`, `ownerParticipantAfter`, `getAfter` ליצירה מהלקוח.

**נשאר:** users (Stage 1), read כרטיס/participant לפי participant פעיל, collection group `participants`.

## איך בודקים

### סדר deploy (חובה)

```bash
cd functions && npm run build && cd ..
firebase deploy --only functions
firebase deploy --only firestore:rules
npm run dev
```

1. התחברות → **כרטיס חדש** → שם → יצירה → redirect לכרטיס
2. Firestore Console: `accountCards/{id}`, `participants/{uid}`, `auditEvents` × 2
3. דשבורד מציג את הכרטיס החדש
4. כרטיסים מ-2A (למשל «בדיקה») — עדיין נראים בדשבורד
5. Console (אופציונלי): `setDoc` ישיר ל-`accountCards` → `permission-denied`

### build / lint

```bash
npm run build && npm run lint
cd functions && npm run build && npm run lint
```

## מה לא נבנה

- invitations, join, acceptInvitation, WhatsApp Share
- צד שני, entries, approve/reject, balance engine
- PDF, encryption מלאה, analytics
- מיגרציה רטרואקטיבית של audit לכרטיסי 2A

## השלב הבא

**2B-2 — Invitation Token** — לא התחיל. רק באישור מפורש («מאושר — בצע 2B-2»).

## קבצים

| קובץ | תפקיד |
|------|--------|
| `functions/src/cards/createAccountCard.ts` | לוגיקת יצירה |
| `functions/src/lib/auth.ts` | `requireAuthUid` |
| `src/lib/cards/createAccountCard.ts` | קריאת Callable מהלקוח |
| `firestore.rules` | deny client create |
