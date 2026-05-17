# Stage 2C — Entries / Pending Records

**סטטוס:** **2C-1–2C-4 סגורים** (מעגל pending לפני אישור — create / approve / reject / cancel / edit).

**2C-1:** [STAGE2C-1_CREATE_PENDING_ENTRY.md](./STAGE2C-1_CREATE_PENDING_ENTRY.md) — **מאושר ונסגר**  
**2C-2:** [STAGE2C-2_APPROVE_REJECT.md](./STAGE2C-2_APPROVE_REJECT.md) — **מאושר ונסגר**  
**2C-3:** [STAGE2C-3_CANCEL_PENDING_ENTRY.md](./STAGE2C-3_CANCEL_PENDING_ENTRY.md) — **מאושר ונסגר**  
**2C-4:** [STAGE2C-4_EDIT_PENDING_ENTRY.md](./STAGE2C-4_EDIT_PENDING_ENTRY.md) — **מאושר ונסגר**

**תלות:** Stage **2B-4** — מאושר, נסגר (כרטיס משותף, 2 participants, Security Audit).

## מטרה

ליבת הערך של כרטיס חשבון:

1. משתתף מוסיף **רשומה**
2. הרשומה נכנסת ל-**ממתין לאישור** (`pending`)
3. הצד השני **מאשר** או **דוחה**
4. רק רשומות **approved** משפיעות על **יתרה רשמית**

---

## מה לא ייבנה ב-2C

| לא ב-2C |
|---------|
| PDF |
| encryption מלאה / CSE |
| analytics |
| WhatsApp Business API, Email/SMS |
| PWA onboarding (2B-6) |
| Visual Mockup (2B-3.1) |
| תשלומים / סליקה / חשבוניות |
| עריכת משתתפים / קבוצות מעבר ל-2 צדדים |
| מחיקת רשומות (hard delete) |
| עריכת רשומה **approved** (רשומת תיקון נפרדת — עתידי) |
| ביטול pending — **2C-3** (סגור) |
| עריכת pending — **2C-4** (סגור) |

---

## מודל Firestore

### נתיב

`accountCards/{cardId}/entries/{entryId}`

### שדות

| שדה | טיפוס | הערות |
|-----|--------|--------|
| `type` | `"charge"` \| `"payment"` \| `"credit"` | במודל — ב-**2C-1 UI** רק **חיוב** / **זיכוי** (ממופה ל-`charge` / `credit`) |
| `amount` | `number` | **חיובי** תמיד (₪) |
| `effectOnPerspectiveBalance` | `"increase"` \| `"decrease"` | יחסית ל-`balancePerspectiveUid` של הכרטיס |
| `title` | `string` | תיאור קצר (חובה) |
| `note` | `string?` | אופציונלי |
| `entryDate` | `Timestamp` | תאריך הרשומה (עסקי) |
| `status` | `"pending"` \| `"approved"` \| `"rejected"` \| `"cancelled"` | |
| `createdByUid` | `string` | |
| `createdAt` | `Timestamp` | |
| `approvedByUid` | `string?` | |
| `approvedAt` | `Timestamp?` | |
| `rejectedByUid` | `string?` | |
| `rejectedAt` | `Timestamp?` | |
| `rejectionNote` | `string?` | אופציונלי בדחייה |

### מיפוי type → effect (שרת)

| type | effectOnPerspectiveBalance | משמעות (נקודת מבט `balancePerspectiveUid`) |
|------|---------------------------|---------------------------------------------|
| `charge` | `increase` | הצד השני «חייב» יותר |
| `credit` (ו-`payment` בעתיד אם יופיע) | `decrease` | הפחתת חוב |

השרת **מחשב/מאמת** `effect` לפי `type` — לא לסמוך על client בלבד.

**2C-1 UI:** רק `charge` (חיוב) ו-`credit` (זיכוי). `payment` לא נחשף בממשק — שמור למודל/עתיד.

### כרטיס — שדות יתרה (ללא שינוי מבנה)

| שדה | כלל |
|-----|-----|
| `officialBalance` | סכום השפעות **approved** בלבד |
| `pendingBalanceImpact` | סכום השפעות **pending** בלבד |
| `balancePerspectiveUid` | **קבוע** מיצירת הכרטיס — לא משתנה ב-2C |

**signed impact** לחישוב:

```text
delta = (effect === "increase" ? +1 : -1) * amount
```

---

## כללי יתרה (Balance Engine — שרת בלבד)

| אירוע | `officialBalance` | `pendingBalanceImpact` |
|--------|-------------------|-------------------------|
| `createEntry` → `pending` | ללא שינוי | `+= delta` |
| `approveEntry` | `+= delta` | `-= delta` |
| `rejectEntry` | ללא שינוי | `-= delta` |
| `cancelEntry` (pending, יוצר בלבד) | ללא שינוי | `-= delta` |
| `editEntry` (pending, יוצר בלבד) | ללא שינוי | `+= (deltaAfter - deltaBefore)` |

**אסור:** עדכון `officialBalance` / `pendingBalanceImpact` מה-client.

**אטומיות:** כל מעבר סטטוס + עדכון יתרה ב-**Firestore transaction** אחת (entry doc + card doc + audit).

---

## חסימות (Business Rules)

| כלל | יישום |
|-----|--------|
| רק **participant active** | `assertActiveParticipant(cardId, uid)` + permissions |
| `canAddEntry` | נדרש ל-`createEntry` / `cancelEntry` / `editEntry` (יוצר) |
| `canApprove` | נדרש ל-`approveEntry` / `rejectEntry` |
| יוצר **לא** מאשר לעצמו | `createdByUid !== actorUid` ב-approve/reject |
| מעברי סטטוס | רק `pending` → `approved` \| `rejected` \| `cancelled` |
| `cancelEntry` | רק `createdByUid`, רק כש-`pending` |
| `editEntry` | רק `createdByUid`, רק כש-`pending`; ללא שינוי אמיתי → ללא audit |
| אין מחיקה | אין `delete` |
| סכום | `amount > 0`, מקסימום סביר (למשל ≤ 999_999_999) |
| כרטיס | `status === "active"` |

---

## Functions (Callable v2, `europe-west1`, auth חובה)

| Function | Input (תמצית) | Output |
|----------|---------------|--------|
| **`createEntry`** | `cardId`, `intent` (`to_receive` \| `to_pay` — זיכוי/חיוב), `amount`, `title` | `{ entryId }` |
| **`approveEntry`** | `cardId`, `entryId` | `{ cardId, entryId }` — **2C-2 פעיל** |
| **`rejectEntry`** | `cardId`, `entryId`, `rejectionNote?` | `{ cardId, entryId }` — **2C-2 פעיל** |
| **`cancelEntry`** | `cardId`, `entryId` | `{ cardId, entryId }` — **2C-3 פעיל** |
| **`editEntry`** | `cardId`, `entryId`, `intent`, `amount`, `title` | `{ cardId, entryId }` — **2C-4 פעיל** |

**Privacy בתשובות:** לא להחזיר רשימת entries מלאה מ-Function אם לא נדרש — העדפה: client קורא `entries` ישירות (Rules).

### זרימת `createEntry`

1. `requireAuthUid`, `assertCanAddEntry` (או assert active + permission)
2. ולידציה intent/amount/title
3. `entryDate` = **היום** (שרת) — לא מה-client ב-2C-1
4. חישוב `type` + `effectOnPerspectiveBalance` מ-`intent` + `balancePerspectiveUid`
5. Transaction: `entries` doc `status: pending` + `pendingBalanceImpact += delta` + `audit entry.created`  
   **לא** מעדכן `officialBalance` ב-2C-1

### זרימת `approveEntry` (2C-2 — מיושם)

פירוט: [STAGE2C-2_APPROVE_REJECT.md](./STAGE2C-2_APPROVE_REJECT.md).

1. `assertCanApproveEntry` — participant active, `canApprove`, לא יוצר
2. `delta = balanceDelta(entry.effectOnPerspectiveBalance, entry.amount)`
3. Transaction: entry → `approved`; `pendingBalanceImpact -= delta`; `officialBalance += delta`; audit `entry.approved`

### זרימת `rejectEntry`

1. כמו approve, entry → `rejected`, `pendingBalanceImpact -= delta` בלבד — **2C-2**

### זרימת `cancelEntry` (2C-3 — סגור)

פירוט: [STAGE2C-3_CANCEL_PENDING_ENTRY.md](./STAGE2C-3_CANCEL_PENDING_ENTRY.md).

1. `assertCanCancelEntry` — participant active, `canAddEntry`, `createdByUid === uid`
2. `status == pending` → `cancelled`; `cancelledByUid`, `cancelledAt`
3. `pendingBalanceImpact -= delta`; `officialBalance` ללא שינוי
4. audit `entry.cancelled` — **אין מחיקה פיזית**

### זרימת `editEntry` (2C-4 — סגור)

פירוט + QA: [STAGE2C-4_EDIT_PENDING_ENTRY.md](./STAGE2C-4_EDIT_PENDING_ENTRY.md).

1. `assertCanEditEntry` — יוצר, `pending`, `canAddEntry`
2. `deltaBefore` מ-`effectOnPerspectiveBalance` + `amount` השמורים
3. `deltaAfter` מ-`intent` + `balancePerspectiveUid` (מיפוי type/effect בשרת)
4. אם אין שינוי אמיתי — «לא בוצע שינוי»; ללא audit / `editCount`
5. אחרת: `pendingBalanceImpact += (deltaAfter - deltaBefore)`; `officialBalance` ללא שינוי
6. עדכון entry + audit `entry.edited`; `editCount`++

**מדיניות:** **approved / rejected / cancelled לא נערכים לעולם.**

---

## Firestore Rules

### מצב נוכחי

`entries` — `allow read, write: if false`

### מצב מתוכנן (2C)

```text
match /entries/{entryId} {
  allow read: if isActiveParticipant(cardId);
  allow create, update, delete: if false;  // רק Functions (Admin SDK)
}
```

`accountCards` — `update: false` (נשאר).

`auditEvents` — read participant active; write deny.

**deploy:** `firebase deploy --only firestore:rules` אחרי עדכון.

### Indexes (אם נדרש)

שאילתות צפויות: רשימת entries לפי כרטיס, מיון לפי `entryDate` או `createdAt`.

```json
{
  "collectionGroup": "entries",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "entryDate", "order": "DESCENDING" }
  ]
}
```

(ליישום — לבדוק בזמן פיתוח אם Firestore דורש.)

---

## UI — סקירה

### מסך כרטיס `/app/cards/[cardId]`

| אזור | תוכן |
|------|------|
| עליון | **יתרה בכרטיס** + **ממתין לאישור** (מספרים נפרדים — 2C-1) |
| רשימה | רשומות (מיון: חדש למעלה) — **2C-1** |
| CTA ראשי | **הוספת רשומה** → פותח מודל/מסך הוספה (**2C-1**) |

---

## Stage 2C-1 — הוספת רשומה

**סטטוס:** **סגור — QA עבר.** פירוט: [STAGE2C-1_CREATE_PENDING_ENTRY.md](./STAGE2C-1_CREATE_PENDING_ENTRY.md).

### עקרונות UX

- מינימלי, ברור, אנושי, פרימיום
- mobile-first, vault/glass
- **לא** טופס הנהלת חשבונות — כמה שפחות עבודה ללקוח
- שני כפתורי סוג **גדולים**; נבחר מודגש בעדינות

### זרימה

1. במסך כרטיס: כפתור **«הוספת רשומה»**
2. לחיצה → מודל/מסך קטן (sheet או overlay)
3. מילוי → **«שליחה לאישור»**
4. `createEntry` → רשומה `pending`, `pendingBalanceImpact` מתעדכן
5. סגירת מודל + רענון רשימה

### נוסח המודל — סופי

| רכיב | נוסח |
|------|------|
| **כותרת** | מה לעדכן בחשבון? |

**בחירת סוג — שני כפתורים (RTL: זיכוי ימין, חיוב שמאל):**

| כפתור | טקסט עזר | `intent` |
|--------|-----------|----------|
| **זיכוי** | מגדיל את הזכות שלי | `to_receive` |
| **חיוב** | מגדיל את החובה שלי | `to_pay` |

**אחרי בחירת סוג:**

| שדה | תווית | placeholder / הערה |
|-----|--------|----------------------|
| סכום | סכום | מספר חיובי (₪) |
| פירוט | פירוט קצר | לדוגמה: עבודה, מקדמה, החזר, אספקה |

| רכיב | נוסח |
|------|------|
| **כפתור סיום** | שליחה לאישור |
| **הסבר מתחת (קטן)** | הרשומה לא נכנסת ליתרה בכרטיס מיד. היא נשלחת לאישור הצד השני. |

### לא מוצג ב-UI (2C-1)

| לא בממשק | המערכת ממלאת |
|----------|----------------|
| תאריך (בוחר) | `entryDate` = היום |
| סטטוס | `pending` |
| מי רשם | `createdByUid` |
| `effectOnPerspectiveBalance` | לפי סוג |
| `note` נפרד | לא ב-2C-1 — רק `title` כפירוט קצר |
| `balancePerspectiveUid` | ללא שינוי |

### Copy — אסור ב-2C-1 UI

debit, credit (אנגלית), טרנזקציה, פעולה כספית, חיוב לקוח, תשלום (כפתור שלישי), קטגוריות, קבצים.

### מיפוי `createEntry` (2C-1)

```typescript
// Input מה-client
{
  cardId: string;
  intent: "to_receive" | "to_pay";  // זיכוי / חיוב
  amount: number;
  title: string;
}
// שרת: intent + balancePerspectiveUid → type + effect
```

### כפתור שלישי «תשלום» — למה לא ב-2C-1

| נימוק | פירוט |
|--------|--------|
| שני כיוונים מספיקים | בחשבון בין שני אנשים: מוסיפים חוב (חיוב) / מפחיתים (זיכוי) |
| זהות לזיכוי | «תשלום» באותו כיוון כמו זיכוי — כפתור נוסף ייצור בלבול |
| מודל גמיש | `type: "payment"` נשאר ב-Firestore לעתיד; Truth Dataset משתמש ב-credit/payment כ-decrease |

אם בעתיד נדרש פיצול סמנטי (תשלום vs זיכוי) — אפשר ב-2C+ בלי שבירת מודל.

### מה **לא** ב-2C-1 (מפורש)

| מחוץ ל-2C-1 |
|-------------|
| `approveEntry` / `rejectEntry` |
| עדכון `officialBalance` (רק `pendingBalanceImpact`) |
| כפתורי אשר / דחה ברשימה |
| Truth Dataset מלא (חלק approved — **2C-2**) |
| `cancelEntry` |
| PDF, תאריך מתקדם, קטגוריות, העלאת קבצים |
| שדה `note` נפרד (אופציונלי בעתיד) |

### רשימת רשומות (2C-1)

| סטטוס | תצוגה |
|--------|--------|
| `pending` | תג **ממתין לאישור** |
| `approved` / `rejected` | תצוגה בלבד אם קיימות מדגמה — **ללא** פעולות אישור ב-2C-1 |

### רשומה בรשימה

| סטטוס | תצוגה |
|--------|--------|
| `pending` | תג **ממתין לאישור** |
| `approved` | תג **אושר** |
| `rejected` | תג **נדחה** |
| `cancelled` | תג **בוטל** (2C-3) |

| תפקיד | פעולות |
|--------|--------|
| צד שני (לא יוצר), `pending` | **אשר** / **דחה** (2C-2) |
| יוצר, `pending` | **ממתין לאישור הצד השני** + **עריכה** + **ביטול** (2C-4 / 2C-3) |

### Copy — אסור / מותר

| אסור | מותר |
|------|------|
| טרנזקציה | **רשומה** |
| | חיוב, זיכוי (ב-UI); תשלום רק במודל/עתיד |
| | ממתין לאישור, אושר, נדחה, בוטל |
| | **יתרה בכרטיס** (2C-1 UI); `officialBalance` במודל |

### תצוגת יתרה לפי נקודת מבט (עתידי בתוך 2C או 2C+)

Truth Dataset מגדיר ניסוח לפי `balancePerspectiveUid` — לתכנן ב-UI אחרי חישובים נכונים (ראה [TRUTH_DATASET.md](./TRUTH_DATASET.md)).

---

## Audit

`accountCards/{cardId}/auditEvents/{eventId}`

| action | מתי |
|--------|-----|
| `entry.created` | createEntry |
| `entry.approved` | approveEntry |
| `entry.rejected` | rejectEntry |
| `entry.cancelled` | cancelEntry |
| `entry.edited` | editEntry — **2C-4** (סגור) |
| `balance.updated` | אופציונלי — אחרי שינוי יתרה (metadata: `officialBalance`, `pendingBalanceImpact` — מספרים בלבד) |

**לא ב-metadata:** token, email מלא, note ארוך, תוכן רגיש מיותר.

---

## Truth Dataset — Yossi & Stav

מקור: [TRUTH_DATASET.md](./TRUTH_DATASET.md)

| # | פעולה | official | pending |
|---|--------|----------|---------|
| 1 | חיוב 500 approved | +500 | — |
| 2 | זיכוי 200 approved | −200 → **300** | — |
| 3 | חיוב 100 pending | — | +100 |
| 4 | זיכוי 50 rejected | — | 0 (לא משפיע) |

**צפוי סופי:**

| מדד | ערך |
|-----|-----|
| `officialBalance` | **300** |
| `pendingBalanceImpact` | **100** |

בדיקות רגרסיה חובה אחרי יישום 2C.

---

## קבצים שייווצרו / ישתנו

### Functions

```
functions/src/entries/createEntry.ts
functions/src/entries/approveEntry.ts
functions/src/entries/rejectEntry.ts
functions/src/entries/cancelEntry.ts
functions/src/lib/entries.ts          # validators, delta, assertCanApproveEntry
functions/src/lib/balance.ts        # apply delta to card in transaction
functions/src/index.ts
```

### Client

```
src/types/entry.ts
src/lib/entries/createEntry.ts
src/lib/entries/approveEntry.ts
src/lib/entries/rejectEntry.ts
src/lib/entries/cancelEntry.ts
src/lib/entries/listCardEntries.ts    # Firestore read (Rules)
src/lib/firebase/functions.ts
src/components/entries/EntryList.tsx
src/components/entries/EntryListItem.tsx
src/components/entries/AddEntrySheet.tsx   # מודל «מה לעדכן בחשבון?»
src/lib/dev/perfLog.ts                     # [perf] ב-development
src/lib/entries/entriesCopy.ts             # נוסח מודל הוספה (מוצע)
src/app/app/cards/[cardId]/page.tsx        # CTA + רשימה
```

### Rules & indexes

```
firestore.rules
firestore.indexes.json
```

### Docs

```
docs/STAGE2C_ENTRIES.md
docs/PROJECT_STATE.md
docs/TRUTH_DATASET.md              # עדכון checkboxes אחרי יישום
README.md
docs/ROADMAP.md
```

---

## סדר מומלץ — תת־שלבים

| שלב | תוכן | סיבה |
|-----|------|------|
| ~~**2C-1**~~ | **סגור** — `createEntry` + intent (זיכוי/חיוב) + UI + `pendingBalanceImpact` | ללא approve / officialBalance |
| ~~**2C-2**~~ | **סגור** — `approveEntry`, `rejectEntry`, UI אישור/דחייה | ללא cancel / edit |
| ~~**2C-3**~~ | **סגור** — `cancelEntry`, UI ביטול, תג בוטל | ללא מחיקה / edit |
| ~~**2C-4**~~ | **סגור** — `editEntry`, `EditEntrySheet`, עריכה+ביטול ליוצר | ללא עריכת approved |

כל תת־שלב: build/lint + deploy functions/rules לפי צורך.

---

## בדיקות (חובה)

### פונקציונלי

| # | בדיקה |
|---|--------|
| 1 | `createEntry` → `pending`, `pendingBalanceImpact` מתעדכן |
| 2 | `approveEntry` → `officialBalance` +, pending − |
| 3 | `rejectEntry` → official ללא שינוי, pending − |
| 4 | `cancelEntry` → רק יוצר, pending − |
| 5 | יוצר לא יכול `approveEntry` על רשומה שלו |
| 6 | משתמש שלא participant — deny |
| 7 | שני הצדדים רואים אותה יתרה אחרי כל פעולה |
| 8 | Truth Dataset Yossi/Stav — 300 / 100 |

### טכני

```bash
npm run build && npm run lint
cd functions && npm run build && npm run lint
firebase deploy --only functions,firestore:rules,firestore:indexes
```

---

## סיכונים

| סיכון | הפחתה |
|--------|--------|
| race על אישור כפול | transaction + בדיקת `status === pending` |
| drift בין יתרה לסכום entries | balance רק ב-transaction; בדיקת Truth Dataset |
| client מעדכן יתרה | Rules deny update על card |
| self-approve | בדיקת `createdByUid` בשרת |
| סכום שלילי/ענק | ולידציה בשרת |
| אי-הבנת charge vs credit | copy ברור + type קבוע ב-UI |

---

## השלב הבא אחרי 2C

- תצוגת יתרה לפי נקודת מבט (Truth Dataset UI)
- PDF (שלב נפרד)
- encryption שדות טקסט (שלב נפרד)

**שלבים חדשים ב-2C:** רק באישור מפורש — מעגל pending (2C-1–2C-4) **סגור**.
