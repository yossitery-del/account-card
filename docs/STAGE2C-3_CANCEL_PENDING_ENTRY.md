# Stage 2C-3 — Cancel Pending Entry

**סטטוס:** **סגור — מאושר ונבדק** (QA ידני עבר).

**תלות:** [STAGE2C-2](./STAGE2C-2_APPROVE_REJECT.md) — סגור.

**פעיל:** `cancelEntry` — `europe-west1`, auth חובה.

---

## אימות QA (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| יוצר רואה **ביטול** רק על pending שלו | ✓ |
| `cancelEntry` | ✓ |
| `status: cancelled` | ✓ |
| `pendingBalanceImpact` יורד לפי delta | ✓ |
| `officialBalance` ללא שינוי | ✓ |
| צד שני רואה **בוטל** | ✓ |
| צד שני לא מבטל רשומה של יוצר | ✓ |
| ביטול על approved/rejected — חסום | ✓ |
| ביטול כפול — חסום | ✓ |
| משתמש זר — חסום | ✓ |
| `approveEntry` / `rejectEntry` — ללא שבירה | ✓ |
| אין מחיקה פיזית | ✓ |
| Rules — ללא שינוי | ✓ |
| אין `editEntry` | ✓ |

**כללים מאושרים:**
- ביטול רק **ליוצר** (`createdByUid`) ורק **`pending`**
- ביטול מנקה **`pendingBalanceImpact` בלבד** (`-= delta`)
- **`officialBalance` לא משתנה** בביטול

---

## מטרה

לאפשר ל**יוצר** הרשומה ל**בטל** רשומה שעדיין **ממתינה לאישור** (`pending`).

| פעולה | `pendingBalanceImpact` | `officialBalance` |
|--------|------------------------|-------------------|
| **ביטול** | `-= delta` | **ללא שינוי** |

`delta` נגזר **רק** מה-entry השמור: `effectOnPerspectiveBalance` + `amount` (אותה נוסחה כמו ב-`createEntry` / `approveEntry` / `rejectEntry`).

**אין מחיקה פיזית** — `status: "cancelled"` + audit.

---

## מה לא ב-2C-3

| מחוץ לשלב |
|-----------|
| `editEntry` — **2C-4** |
| שינוי סכום / פירוט / סוג |
| `approveEntry` / `rejectEntry` חדשים |
| PDF, encryption מלאה, analytics, WhatsApp Business, Email/SMS |
| PWA onboarding, תשלומים, חשבוניות, קטגוריות, קבצים |
| ניהול משתתפים / קבוצות |
| מחיקת document מ-Firestore |

---

## Function — `cancelEntry`

| | |
|--|--|
| Region | `europe-west1` |
| Auth | חובה |
| Callable | v2 `onCall` |

**Input:**

```typescript
{
  cardId: string;
  entryId: string;
}
```

**Output:**

```typescript
{
  cardId: string;
  entryId: string;
}
```

(ללא החזרת balances — client מרענן כרטיס + רשימה.)

### אסור מה-client

כמו ב-2C-2 — `rejectEntryActionControlledFields` / רשימה דומה:

`status`, `amount`, `effectOnPerspectiveBalance`, balances, `createdByUid`, `cancelledByUid`, `cancelledAt`, וכו'.

---

## Helper — `assertCanCancelEntry`

| בדיקה | שגיאה |
|--------|--------|
| כרטיס קיים | `not-found` |
| `card.status === "active"` | `failed-precondition` |
| participant `active` | `permission-denied` |
| `permissions.canAddEntry === true` | `permission-denied` (יוצר = מי שמוסיף/מבטל) |
| entry קיימת | `not-found` |
| `entry.status === "pending"` | `failed-precondition` |
| `entry.createdByUid === uid` | `permission-denied` אם **לא** יוצר |

**הערה:** הצד השני (לא יוצר) — **אין** ביטול; רק אישור/דחייה (2C-2).

אימות חוזר **בתוך transaction** (race / ביטול כפול).

### `assertEntryCancellable(entry, uid)`

```typescript
if (entry.status !== "pending") → failed-precondition
if (entry.createdByUid !== uid) → permission-denied
```

---

## Balance math

```typescript
// functions/src/lib/entryIntent.ts — קיים
balanceDelta(effect, amount):
  effect === "increase" ? amount : -amount
```

### cancel

```text
delta = balanceDelta(entry.effectOnPerspectiveBalance, entry.amount)
pendingBalanceImpact -= delta   // FieldValue.increment(-delta)
officialBalance — ללא שינוי
```

### דוגמאות

| לפני cancel | delta | אחרי pending | official |
|-------------|-------|--------------|----------|
| pending **+500** | +500 | **0** | ללא שינוי |
| pending **−200** (net) | −200 | **0** (מוסיף +200 ל-pending) | ללא שינוי |

---

## Firestore writes (transaction)

### `accountCards/{cardId}/entries/{entryId}`

```typescript
{
  status: "cancelled",
  cancelledByUid: uid,
  cancelledAt: serverTimestamp(),
}
```

**מודל:** להוסיף בשלב מימוש `cancelledByUid`, `cancelledAt` ב-types + `createEntry` יאתחל `null` (אופציונלי — רק אם נדרש עקביות סכמה).

### `accountCards/{cardId}`

```typescript
{
  pendingBalanceImpact: FieldValue.increment(-delta),
  updatedAt: serverTimestamp(),
}
```

### `auditEvents`

```typescript
{
  action: "entry.cancelled",
  actorUid: uid,
  entityType: "entry",
  entityId: entryId,
  createdAt: serverTimestamp(),
  metadata: {
    amount,
    effectOnPerspectiveBalance,
    delta,
  },
}
```

**לא** ב-metadata: title מלא, email, token, note רגיש.

---

## Firestore Rules

**ללא שינוי צפוי:**

```text
entries        — read: active participant; write: deny
accountCards   — update: deny (client)
auditEvents    — write: deny (client)
```

Functions Admin SDK בלבד.

---

## Client — קבצים

### ייווצרו

| קובץ | תפקיד |
|------|--------|
| `functions/src/entries/cancelEntry.ts` | Callable |
| `functions/src/lib/assertCanCancelEntry.ts` | הרשאות + preconditions |
| `src/lib/entries/cancelEntry.ts` | wrapper + `withPerf` |

### ישתנו

| קובץ | שינוי |
|------|--------|
| `functions/src/index.ts` | export `cancelEntry` |
| `functions/src/entries/createEntry.ts` | (אופציונלי) `cancelledByUid: null`, `cancelledAt: null` ב-create |
| `src/lib/firebase/functions.ts` | `callCancelEntryFunction` |
| `src/lib/entries/entriesCopy.ts` | ביטול, מבטלים…, בוטל |
| `src/types/entry.ts` | `cancelledByUid`, `cancelledAt` |
| `src/components/entries/EntryListItem.tsx` | כפתור ביטול ליוצר + תג בוטל |
| `src/components/entries/EntryList.tsx` | `onCancel`, `actingKind` כולל `"cancel"` |
| `src/app/app/cards/[cardId]/page.tsx` | `handleCancel`, רענון שקט |

### שימוש חוזר

- `parseEntryActionPayload` / `entryActionPayload.ts`
- `parseEntryDelta` — מ-`assertCanApproveEntry` או ייצוא ל-`entryDelta.ts` משותף
- `parseCardId`, `parseEntryId` — `validators.ts`

---

## UI flow

### רשומה `pending` — **יוצר** (`createdByUid === currentUid`)

| רכיב | נוסח / התנהגות |
|------|----------------|
| טקסט | **ממתין לאישור הצד השני** (קיים) |
| כפתור | **ביטול** — קטן, ghost / border דק, **לא** אדום אגרסיבי |
| בזמן פעולה | **מבטלים…** |
| disable | כל פעולות הרשומה (approve/reject/cancel) בזמן loading |

### רשומה `pending` — **צד שני** (לא יוצר)

| רכיב | התנהגות |
|------|----------|
| | **ללא** כפתור ביטול |
| | אישור / דחייה כמו **2C-2** |

### אחרי ביטול

| סטטוס | תג |
|--------|-----|
| `cancelled` | **בוטל** |

עיצוב תג: עדין (mist / border) — לא כמו rejected אדום.

### Copy — אסור / מותר

| אסור | מותר |
|------|------|
| cancel (אנגלית ב-UI) | ביטול, מבטלים…, בוטל |
| מחיקה | ביטול (סטטוס cancelled) |

### Refresh

אחרי `cancelEntry` — כמו 2C-2: `getCardPageContext` + `listEntries` במקביל; ללא reload מלא.

---

## בדיקות QA (בוצע — סגירה)

| # | תרחיש | תוצאה |
|---|--------|--------|
| C1 | יוצר רואה **ביטול** על pending שלו | ✓ |
| C2 | ביטול → `cancelled`, pending יורד, official ללא שינוי | ✓ |
| C3 | צד שני רואה **בוטל** | ✓ |
| C4 | צד שני לא מבטל רשומה של יוצר | ✓ |
| C5 | ביטול על approved/rejected | חסום ✓ |
| C6 | ביטול כפול | חסום ✓ |
| C7 | משתמש זר | חסום ✓ |
| C8–C9 | delta +500 / −200 | ✓ |

### טכני

- [x] build/lint root
- [x] build/lint functions
- [x] deploy `cancelEntry` (Rules — לא שונו)
- [x] `approveEntry` / `rejectEntry` ללא שבירה

---

## סיכונים

| סיכון | הקלה |
|--------|------|
| Race — ביטול + אישור במקביל | transaction + `status === pending` |
| Self vs other | `createdByUid === uid` בשרת + UI |
| Delta שגוי | רק מ-entry שמור; `balanceDelta` משותף |
| ביטול כפול | `failed-precondition` |
| שדות חסרים ב-entry ישן | null ב-create לעתיד; cancel רק על pending תקין |

---

## Deploy

נפרס: `cancelEntry` — `europe-west1`. **Rules — ללא שינוי.**

---

## קישורים

- [STAGE2C_ENTRIES.md](./STAGE2C_ENTRIES.md)
- [STAGE2C-2_APPROVE_REJECT.md](./STAGE2C-2_APPROVE_REJECT.md)
- [BALANCE_RULES.md](./BALANCE_RULES.md)
- [ROADMAP.md](./ROADMAP.md)

**המשך:** **2C-4** — `editEntry` — **לא לבנות בלי** «מאושר — בצע 2C-4».
