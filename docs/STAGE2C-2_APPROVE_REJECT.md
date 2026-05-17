# Stage 2C-2 — Approve / Reject Pending Entries

**סטטוס:** **סגור — מאושר ונבדק** (QA ידני עבר).

**תלות:** [STAGE2C-1](./STAGE2C-1_CREATE_PENDING_ENTRY.md) — סגור.

---

## אימות QA (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| A יוצר pending → B «ממתין לאישור שלך» | ✓ |
| B מאשר → `approved`, `officialBalance` מתעדכן | ✓ |
| `pendingBalanceImpact` יורד באישור | ✓ |
| B דוחה → `rejected`, `officialBalance` ללא שינוי | ✓ |
| `pendingBalanceImpact` יורד בדחייה | ✓ |
| יוצר לא מאשר/דוחה לעצמו | ✓ |
| אישור כפול / דחייה אחרי אישור — חסום | ✓ |
| שני צדדים — אותם מספרים | ✓ |
| Truth Dataset T1–T7 | ✓ |
| Rules — ללא שינוי | ✓ |
| אין `cancelEntry` / עריכה / מחיקה | ✓ |

**פעיל:** `approveEntry`, `rejectEntry` — `europe-west1`, auth חובה.

**יתרות:**
- `officialBalance` מתעדכן **רק באישור**
- `pendingBalanceImpact` מתנקה באישור **ובדחייה** (`-= delta`)

---

## מטרה

לאפשר ל**צד השני** (לא יוצר הרשומה) **לאשר** או **לדחות** רשומה במצב `pending`.

| פעולה | `pendingBalanceImpact` | `officialBalance` |
|--------|------------------------|-------------------|
| **אישור** | `-= delta` | `+= delta` |
| **דחייה** | `-= delta` | **ללא שינוי** |

`delta` נגזר **רק** מנתוני הרשומה השמורים: `effectOnPerspectiveBalance` + `amount` (אותה פונקציה כמו ב-`createEntry`).

---

## מה לא ב-2C-2

| מחוץ לשלב |
|-----------|
| `cancelEntry` (ביטול על ידי יוצר) — **2C-3** |
| עריכה / מחיקת רשומות |
| PDF, encryption מלאה, analytics, WhatsApp Business, Email/SMS |
| PWA onboarding, תשלומים, חשבוניות, קטגוריות, קבצים |
| ניהול משתתפים / קבוצות |
| Truth Dataset — תרגום יתרה מלא לשני צדדים (רק מספרים + תגי סטטוס ב-2C-2) |
| `balance.updated` audit נפרד (אופציונלי — לא חובה אם `entry.approved`/`rejected` מספיק) |

---

## האם לפצל לתת־שלבים?

**המלצה: שלב אחד (2C-2)** עם **סדר מימוש פנימי**:

| שלב פנימי | תוכן | בדיקה |
|-----------|------|--------|
| **A** | Functions + `assertCanApproveEntry` + export + deploy | Callable ידני / emulator |
| **B** | Client wrappers + Rules (אימות ללא שינוי) | — |
| **C** | UI כפתורים + copy + רענון יתרות | QA ידני |
| **D** | Truth Dataset 2C-2 + docs סגירה | רשימת בדיקות |

**לא** לפצל ל-PR נפרדים אלא אם נדרש ביקורת — הלוגיקה צמודה (יתרה + UI).

---

## Balance math

### נוסחת delta (מקור אמת)

```typescript
// functions/src/lib/entryIntent.ts — קיים
balanceDelta(effect: "increase" | "decrease", amount: number): number {
  return effect === "increase" ? amount : -amount;
}
```

**בכל approve/reject:** לקרוא מ-entry:

```text
delta = balanceDelta(entry.effectOnPerspectiveBalance, entry.amount)
```

**אסור:** לחשב מחדש מ-`intent` / `type` בלי `effectOnPerspectiveBalance` השמור — מונע סטייה אם המודל יתפתח.

### טבלת מעברים

| אירוע | `officialBalance` | `pendingBalanceImpact` |
|--------|-------------------|------------------------|
| `createEntry` (2C-1) | — | `+= delta` |
| **approveEntry** | `+= delta` | `-= delta` |
| **rejectEntry** | — | `-= delta` |

### דוגמאות

#### א. אישור יחיד — זיכוי 500 (delta +500)

| | official | pending |
|--|----------|---------|
| התחלה | 0 | 0 |
| אחרי create (+500) | 0 | **+500** |
| אחרי approve | **+500** | **0** |

#### ב. דחייה — חיוב 200 pending (delta +200 אם increase)

| | official | pending |
|--|----------|---------|
| אחרי create | 0 | +200 |
| אחרי reject | **0** | **0** |

#### ג. pending מורכב + אישור entry שלילי

- `pendingBalanceImpact = +300` (למשל: +500 מרשומה A pending, −200 מרשומה B pending)
- **אישור** רשומה B בלבד (`delta = -200`):
  - `officialBalance += -200`
  - `pendingBalanceImpact -= (-200)` → `+300 + 200 = +500` (נשארת השפעת A בלבד)
- **דחייה** B: אותו שינוי ב-pending, `official` ללא שינוי

#### ד. Truth Dataset סופי (אחרי 2C-2 מלא)

לאחר אישור #1, #2, דחיית #4, #3 עדיין pending — ראה [TRUTH_DATASET.md](./TRUTH_DATASET.md):

| מדד | ערך |
|-----|-----|
| `officialBalance` | **300** |
| `pendingBalanceImpact` | **100** |

---

## Function design

### משותף — `assertCanApproveEntry(cardId, uid, entry)`

| בדיקה | שגיאה |
|--------|--------|
| כרטיס קיים | `not-found` |
| `card.status === "active"` | `failed-precondition` |
| participant `active` | `permission-denied` |
| `permissions.canApprove === true` | `permission-denied` |
| entry קיים | `not-found` |
| `entry.status === "pending"` | `failed-precondition` |
| `entry.createdByUid !== uid` | `permission-denied` (לא יכול לאשר/לדחות לעצמו) |

**הערה:** בדיקת participant מחוץ ל-transaction (כמו `createEntry`), ואז transaction עם `get` מחדש ל-entry + card.

### `approveEntry`

| | |
|--|--|
| Region | `europe-west1` |
| Auth | חובה |
| Callable | v2 `onCall` |

**Input:**

```typescript
{ cardId: string; entryId: string }
```

**Output:**

```typescript
{ cardId: string; entryId: string }
```

(ללא החזרת balances — client קורא כרטיס מחדש; פחות דליפת מצב.)

**Transaction (אטומי):**

1. `assertCanApproveEntry` (pre) + `rejectClientControlledFields` על payload
2. `transaction.get(entryRef)` + `transaction.get(cardRef)`
3. אימות חוזר: `status === "pending"`, `createdByUid !== uid`, card active
4. `delta = balanceDelta(entry.effectOnPerspectiveBalance, entry.amount)`
5. `transaction.update(entryRef, { status: "approved", approvedByUid, approvedAt, ... })`
6. `transaction.update(cardRef, { officialBalance: currentOfficial + delta, pendingBalanceImpact: currentPending - delta, updatedAt })`
7. `transaction.set(auditRef, { action: "entry.approved", actorUid, entityType: "entry", entityId, metadata: { amount, effectOnPerspectiveBalance } })`

**שדות entry בעדכון:**

- `status: "approved"`
- `approvedByUid: uid`
- `approvedAt: serverTimestamp`
- (אופציונלי) `updatedAt` אם נוסף למודל בעתיד — לא חובה ב-2C-2 אם לא קיים היום

### `rejectEntry`

**Input:**

```typescript
{
  cardId: string;
  entryId: string;
  rejectionNote?: string;  // אופציונלי, קצר
}
```

**Output:** `{ cardId, entryId }`

**ולידציה `rejectionNote`:**

- אופציונלי; אם קיים — `string`, `trim`, אורך 1–200 (או 300 — להחליט במימוש; המלצה **200** כמו `title`)

**Transaction:**

1. כמו approve עד delta
2. `entry.status → "rejected"`, `rejectedByUid`, `rejectedAt`, `rejectionNote` (או `null`)
3. `pendingBalanceImpact -= delta` בלבד
4. audit: `entry.rejected` (+ `hasNote: boolean` ב-metadata, **לא** טקסט note מלא אם רגיש)

### חסימות חובה (שרת)

| מצב | תוצאה |
|-----|--------|
| יוצר מנסה approve/reject לעצמו | `permission-denied` |
| `status !== "pending"` | `failed-precondition` |
| אישור כפול / דחייה אחרי אישור | `failed-precondition` |
| משתמש לא participant / לא active | `permission-denied` |
| `canApprove === false` | `permission-denied` |
| שדות אסורים ב-payload (`status`, balances, …) | `invalid-argument` |

### שגיאות מומלצות (עברית, עקבי עם 2C-1)

| מצב | הודעה (דוגמה) |
|-----|----------------|
| לא pending | הרשומה כבר לא ממתינה לאישור |
| self-approve | אין אפשרות לאשר רשומה שהוספת |
| self-reject | אין אפשרות לדחות רשומה שהוספת |
| אין הרשאה | אין לך הרשאה לפעולה זו |

---

## Firestore Rules

**ללא שינוי נדרש** אם המצב הנוכחי נשמר:

```text
accountCards/{cardId}           — read: active participant; write: deny
accountCards/.../entries        — read: active participant; write: deny
accountCards/.../auditEvents    — read: active participant; write: deny
```

Functions Admin SDK מעדכן balances ו-status.

---

## Audit

| action | מתי | metadata (מינימלי) |
|--------|-----|---------------------|
| `entry.approved` | approveEntry | `amount`, `effectOnPerspectiveBalance` |
| `entry.rejected` | rejectEntry | `amount`, `effectOnPerspectiveBalance`, `hasNote?: boolean` |

**לא** ב-metadata: `rejectionNote` מלא, email, token.

---

## Client — קבצים

### ייווצרו

| קובץ | תפקיד |
|------|--------|
| `functions/src/entries/approveEntry.ts` | Callable |
| `functions/src/entries/rejectEntry.ts` | Callable |
| `functions/src/lib/assertCanApproveEntry.ts` | הרשאות + entry preconditions |
| `src/lib/entries/approveEntry.ts` | wrapper + `withPerf` |
| `src/lib/entries/rejectEntry.ts` | wrapper + `withPerf` |

### ישתנו

| קובץ | שינוי |
|------|--------|
| `functions/src/index.ts` | export `approveEntry`, `rejectEntry` |
| `functions/src/lib/entryIntent.ts` | (אופציונלי) ייצוא `balanceDelta` אם לא מיוצא — כבר קיים |
| `src/lib/entries/entriesCopy.ts` | אישור, דחייה, אושר, נדחה, ממתין…, loading |
| `src/components/entries/EntryListItem.tsx` | כפתורים + מצבי טעינה + תגים לפי status |
| `src/components/entries/EntryList.tsx` | העברת callbacks / `onActionComplete` |
| `src/app/app/cards/[cardId]/page.tsx` | רענון שקט אחרי approve/reject (כמו אחרי create) |
| `src/types/entry.ts` | (אם חסר) שדות `approved*` / `rejected*` |

### לא ב-2C-2

- `cancelEntry.ts` (functions + client)
- שינוי `createEntry` / Rules (אלא אם מתגלה חור)

---

## UI flow

### רשימת רשומות — `EntryListItem`

| `status` | `createdByUid` | תצוגה |
|----------|----------------|--------|
| `pending` | `!== currentUid` | תג **ממתין לאישור שלך** + כפתורים **אישור** / **דחייה** |
| `pending` | `=== currentUid` | תג **ממתין לאישור** + טקסט **ממתין לאישור הצד השני** (ללא כפתורים) |
| `approved` | — | תג **אושר** |
| `rejected` | — | תג **נדחה** |

### בזמן פעולה

| פעולה | טקסט (דוגמה) |
|--------|----------------|
| אישור בתהליך | מאשרים… |
| דחייה בתהליך | דוחים… |

- כפתורים `disabled` בזמן בקשה
- שגיאה: toast / הודעה קצרה בעברית (לא `approve` / `reject` באנגלית)

### דחייה + `rejectionNote`

| אפשרות | המלצה |
|--------|--------|
| **מינימלי (2C-2)** | דחייה בלחיצה אחת, בלי note |
| **מורחב** | דיאלוג אופציונלי «סיבה קצרה» לפני שליחה |

**תכנון:** להתחיל **ללא** note ב-UI; השרת כבר תומך `rejectionNote?` — ניתן להוסיף בשלב polish בלי שינוי חוזה.

### אחרי הצלחה

1. רענון `getCardPageContext` + `listEntries` (מקביל, כמו 2C-1)
2. **יתרה בכרטיס** (`officialBalance`) מתעדכנת רק אחרי אישור
3. **ממתין לאישור** (`pendingBalanceImpact`) יורד בשני המקרים
4. שני הצדדים רואים אותם מספרים (קריאת כרטיס משותפת)

### Copy — אסור / מותר

| אסור | מותר |
|------|------|
| approve, reject, transaction | אישור, דחייה, אושר, נדחה, ממתין לאישור, ממתין לאישור שלך, ממתין לאישור הצד השני |

---

## Truth Dataset — בדיקות 2C-2

עדכון ב-[TRUTH_DATASET.md](./TRUTH_DATASET.md). תרחישים ידניים:

| # | תרחיש | צפוי |
|---|--------|------|
| T1 | זיכוי 500 pending → Stav מאשר | official **+500**, pending **0** |
| T2 | חיוב 200 pending → דחייה | official **ללא שינוי**, pending **0** |
| T3 | Yossi יוצר pending → Yossi מאשר | **חסום** |
| T4 | approve פעמיים על אותה entry | **חסום** |
| T5 | reject אחרי approve | **חסום** |
| T6 | משתמש C (לא participant) | **חסום** read/approve |
| T7 | מסלול מלא Dataset (#1–#4) | official **300**, pending **100** |

---

## בדיקות QA (בוצע — סגירה)

### פונקציונלי

- [x] A יוצר pending → B מאשר → `officialBalance` מתעדכן, `pendingBalanceImpact` יורד
- [x] A יוצר pending אחר → B דוחה → `officialBalance` ללא שינוי, pending יורד
- [x] יוצר לא רואה כפתורי אישור/דחייה; רואה «ממתין לאישור הצד השני»
- [x] B רואה «ממתין לאישור שלך» + כפתורים
- [x] אישור כפול נדחה
- [x] דחייה אחרי אישור נדחית
- [x] שני צדדים — אותה יתרה בכרטיס ובממתין

### טכני

- [x] `npm run build` + `npm run lint` (root)
- [x] `npm run build` + `npm run lint` (functions)
- [x] Deploy: `approveEntry`, `rejectEntry` (Rules — לא שונו)
- [x] אין UID/email חדשים ב-UI

---

## סיכונים

| סיכון | הקלה |
|--------|------|
| **Race** — שני לחיצות approve | Transaction + בדיקת `status` בתוך transaction |
| **Delta שגוי** | רק `effectOnPerspectiveBalance` + `amount` מה-entry; שימוש ב-`balanceDelta` משותף |
| **Drift** official/pending | לא להחזיר balances מ-client; transaction אטומי |
| **Self-approve** | `createdByUid !== uid` + UI מסתיר כפתורים |
| **Stale UI** | רענון מקביל אחרי פעולה; disable בזמן loading |
| **rejectNote** רגיש | לא ב-audit מלא; אופציונלי ב-UI |
| **Cold start** | אותו אזור `europe-west1`; QA עם `[perf]` ב-dev |

---

## Deploy

נפרס: `approveEntry`, `rejectEntry` — `europe-west1`. Rules — **ללא שינוי**.

---

## קישורים

- [STAGE2C_ENTRIES.md](./STAGE2C_ENTRIES.md) — מודל Entries מלא
- [STAGE2C-1_CREATE_PENDING_ENTRY.md](./STAGE2C-1_CREATE_PENDING_ENTRY.md) — create pending
- [BALANCE_RULES.md](./BALANCE_RULES.md) — כללי יתרה
- [TRUTH_DATASET.md](./TRUTH_DATASET.md) — רגרסיה

**המשך:** **2C-3** — `cancelEntry` (ביטול על ידי יוצר) — **נדחה; לא לבנות בלי אישור מפורש** («מאושר — בצע 2C-3»).
