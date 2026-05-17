# Stage 2C-4 — Edit Pending Entry

**סטטוס:** **סגור — מאושר ונבדק** (QA ידני עבר).

**תלות:** [STAGE2C-3](./STAGE2C-3_CANCEL_PENDING_ENTRY.md) — סגור.

**פעיל:** `editEntry` — `europe-west1`, auth חובה.

---

## אימות QA (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| עריכת `pending` — **יוצר בלבד** | ✓ |
| זיכוי 500 → זיכוי 300; `pendingBalanceImpact` מתעדכן נכון | ✓ |
| זיכוי 300 → חיוב 200; `pendingBalanceImpact` מתעדכן נכון | ✓ |
| `officialBalance` ללא שינוי בעריכה | ✓ |
| הרשומה נשארת `pending` | ✓ |
| הצד השני רואה ערכים מעודכנים | ✓ |
| הצד השני **ללא** כפתור עריכה | ✓ |
| עריכת `approved` / `rejected` / `cancelled` — חסום | ✓ |
| שמירה ללא שינוי → «לא בוצע שינוי» | ✓ |
| שמירה ללא שינוי — **ללא** audit, **ללא** `editCount` | ✓ |
| עריכה אמיתית — `editCount` עולה, audit `entry.edited` | ✓ |
| Rules — ללא שינוי | ✓ |
| אין כתיבה ישירה מה-client ל-entries / card / audit | ✓ |

**כללים מאושרים:**
- עריכה רק **ליוצר** (`createdByUid`) ורק **`pending`**
- `pendingBalanceImpact += (deltaAfter - deltaBefore)` — קנוני לפי `balancePerspectiveUid`
- **`officialBalance` לא משתנה** בעריכה
- **`approved` / `rejected` / `cancelled` לא נערכים לעולם**

---

## מטרה

לאפשר ל**יוצר** הרשומה **לתקן** רשומה **pending** לפני שהצד השני אישר/דחה — סכום, פירוט, זיכוי/חיוב (`intent`).

| פעולה | `pendingBalanceImpact` | `officialBalance` |
|--------|------------------------|-------------------|
| **עריכה** | `+= (deltaAfter - deltaBefore)` | **ללא שינוי** |

**מדיניות מוצר (חובה):**
- רשומה **approved / rejected / cancelled** — **לא נערכת לעולם**
- תיקון אחרי אישור = רשומת תיקון **חדשה** בעתיד (מחוץ ל-2C-4)

---

## מה לא ב-2C-4

| מחוץ לשלב |
|-----------|
| עריכת `approved` / `rejected` / `cancelled` |
| עריכה אחרי אישור |
| מחיקה פיזית |
| `editEntry` על ידי צד שני |
| PDF, encryption, analytics, WhatsApp Business, Email/SMS, PWA |
| תשלומים, חשבוניות, קטגוריות, קבצים, משתתפים, קבוצות |

---

## Function — `editEntry`

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
  intent: "to_receive" | "to_pay";
  amount: number;
  title: string;
}
```

**Output:**

```typescript
{
  cardId: string;
  entryId: string;
}
```

### אסור מה-client

`effectOnPerspectiveBalance`, `type`, `delta`, `deltaBefore`, `deltaAfter`, `createdByUid`, `status`, `officialBalance`, `pendingBalanceImpact`, `editCount`, שדות audit.

`parseEditEntryPayload` — רשימת forbidden ייעודית לעריכה (לא `parseEntryActionPayload` של approve/cancel).

---

## Helper — `assertCanEditEntry`

| בדיקה | שגיאה |
|--------|--------|
| כרטיס קיים, `active` | `not-found` / `failed-precondition` |
| participant `active`, `canAddEntry` | `permission-denied` |
| entry קיימת | `not-found` |
| `entry.status === "pending"` | `failed-precondition` |
| `entry.createdByUid === uid` | `permission-denied` אם לא יוצר |

אימות חוזר **בתוך transaction**.

---

## Balance math

### מקור אמת — `functions/src/lib/entryIntent.ts`

```typescript
balanceDelta(effect, amount) = effect === "increase" ? amount : -amount
```

### deltaBefore (מה-entry השמור)

```typescript
deltaBefore = balanceDelta(
  entry.effectOnPerspectiveBalance,
  entry.amount
)
```

### deltaAfter (מה-input + שרת)

```typescript
type = resolveTypeFromIntent(intent, uid, card.balancePerspectiveUid)
effectAfter = effectForType(type)
deltaAfter = balanceDelta(effectAfter, amount)
```

### התאמת יתרה

```typescript
adjustment = deltaAfter - deltaBefore
pendingBalanceImpact += adjustment   // FieldValue.increment(adjustment)
officialBalance — ללא שינוי
```

### דוגמאות

| לפני (deltaBefore) | אחרי (deltaAfter) | adjustment |
|--------------------|-------------------|------------|
| +500 | +300 | **−200** |
| +500 | −200 | **−700** |
| −200 | +500 | **+700** |

### עריכה ללא שינוי

אם `title`, `intent` ו-`delta` (balance) לא השתנו:
- אין עדכון entry / card
- אין audit
- אין `editCount`
- `failed-precondition`: «לא בוצע שינוי»

---

## Transaction

1. `assertCanEditEntry` (pre)
2. `transaction.get(cardRef)`, `transaction.get(entryRef)`
3. אימות: card active, `status === pending`, `createdByUid === uid`
4. `deltaBefore`, `deltaAfter`
5. `transaction.update(entryRef, { ... })`
6. `transaction.update(cardRef, { pendingBalanceImpact: increment(adjustment), updatedAt })`
7. `transaction.set(auditRef, { action: "entry.edited", ... })`

---

## Firestore writes

### `entries/{entryId}`

`intent`, `type`, `effectOnPerspectiveBalance`, `amount`, `title`, `updatedAt`, `editedAt`, `editedByUid`, `editCount: increment(1)`.

**לא** משנים: `status`, `createdByUid`, `createdAt`, `entryDate`, `approved*`, `rejected*`, `cancelled*`.

### `accountCards/{cardId}`

`pendingBalanceImpact: FieldValue.increment(deltaAfter - deltaBefore)`, `updatedAt`.

### `auditEvents`

`action: "entry.edited"` — metadata: `amountBefore/After`, `effectBefore/After`, `deltaBefore/After`, `deltaAdjustment`, `titleChanged`, `intentChanged` — **ללא** title מלא.

---

## Firestore Rules

**ללא שינוי** — entries / accountCards / audit: read participant, write deny.

---

## Client — קבצים (מיושם)

| קובץ | תפקיד |
|------|--------|
| `functions/src/entries/editEntry.ts` | Callable |
| `functions/src/lib/assertCanEditEntry.ts` | הרשאות |
| `functions/src/lib/parseEditEntryPayload.ts` | ולידציה + forbidden |
| `functions/src/lib/intentFromTypeForActor.ts` | רשומות ישנות בלי `intent` |
| `src/lib/entries/editEntry.ts` | wrapper + מיפוי שגיאות |
| `src/lib/firebase/functions.ts` | `callEditEntryFunction` |
| `src/components/entries/EditEntrySheet.tsx` | מודל «עריכת רשומה» |
| `src/components/entries/EntryListItem.tsx` | **עריכה** + **ביטול** (יוצר) |
| `src/types/entry.ts` | `intent?`, `editedAt`, `editedByUid`, `editCount`, `updatedAt` |

---

## UI flow (מיושם)

### רשומה `pending` — **יוצר**

| רכיב | נוסח / התנהגות |
|------|----------------|
| כפתורים | **עריכה** · **ביטול** |
| מודל | **עריכת רשומה** — זיכוי/חיוב, סכום, פירוט |
| שמירה | **שמירת שינוי** · **שומרים…** |
| אחרי | נשאר **pending**; ערכים + `pendingBalanceImpact` מעודכנים |

### רשומה `pending` — **צד שני**

אישור / דחייה בלבד (2C-2) — **ללא** עריכה.

### רשומות ישנות בלי `intent`

תצוגה: `intentFromTypeForActor` / `getCreatorIntent`; אחרי עריכה — `intent` נשמר.

---

## Deploy

```bash
cd functions && npm run build && npm run lint
firebase deploy --only functions:editEntry
```

`editEntry` נפרס ל-`europe-west1` יחד עם עדכון שאר ה-Callables בסביבת הפרויקט.

---

## קישורים

- [STAGE2C_ENTRIES.md](./STAGE2C_ENTRIES.md)
- [STAGE2C-1_CREATE_PENDING_ENTRY.md](./STAGE2C-1_CREATE_PENDING_ENTRY.md)
- [STAGE2C-3_CANCEL_PENDING_ENTRY.md](./STAGE2C-3_CANCEL_PENDING_ENTRY.md)
- [BALANCE_RULES.md](./BALANCE_RULES.md)
- [PROJECT_STATE.md](./PROJECT_STATE.md)
- [ROADMAP.md](./ROADMAP.md)

**השלב הבא:** לא מתחילים שלב חדש בלי אישור מפורש.
