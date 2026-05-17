# Stage 2D-P1B — Light Refresh After approve / reject / cancel / edit

**סטטוס:** **סגור — QA עבר (PASS)** — מאי 2026.

**תלות:** Stages **2C-2** (`approveEntry`, `rejectEntry`), **2C-3** (`cancelEntry`), **2C-4** (`editEntry`); **2D-P1A** (`createEntry` + `readEntryMutationBalances`); מסך כרטיס עם `CardPageContext` טעון.

**מחוץ להיקף P1B:** Firestore Rules; balance math / audit / permissions ב-Functions; עיצוב UI; optimistic `officialBalance`; חישוב יתרות בקליינט.

---

## מטרה

להרחיב את דפוס **2D-P1A** לכל פעולות ה-mutation על רשומות pending:

- `approveEntry`
- `rejectEntry`
- `cancelEntry`
- `editEntry`

**גישה:** אחרי commit, השרת מחזיר יתרות מ-`accountCards/{cardId}`; הקליינט מריץ `refreshAfterEntryMutation` — `patchCardBalances` + `listEntries` בלבד.

`createEntry` נשאר ב-**P1A** (אותו helper בקליינט); נבדק ברגרסיה כחלק מסגירת P1B.

---

## Functions — deployed

| Callable | Region | Project |
|----------|--------|---------|
| `approveEntry` | `europe-west1` | `account-card-18e3a` |
| `rejectEntry` | `europe-west1` | `account-card-18e3a` |
| `cancelEntry` | `europe-west1` | `account-card-18e3a` |
| `editEntry` | `europe-west1` | `account-card-18e3a` |

**לא ב-deploy P1B:** `createEntry` (כבר נפרס ב-P1A עם תשובת יתרות).

**שינוי בשרת (ללא שינוי transaction / audit):** אחרי `runTransaction` מוצלח — `return readEntryMutationBalances(cardId, entryId)` מ-`functions/src/lib/entryMutationBalances.ts`.

---

## Deploy

```bash
firebase deploy --only functions:approveEntry,functions:rejectEntry,functions:cancelEntry,functions:editEntry
```

**תוצאה:** ארבעת ה-Callables עודכנו בהצלחה ב-`europe-west1`.

---

## Callable response shape (כל ארבעת ה-mutations)

```typescript
{
  cardId: string;
  entryId: string;
  officialBalance: number;
  pendingBalanceImpact: number;
  updatedAt: string; // ISO
}
```

יתרות נקראות מהמסמך המחויב בשרת — **לא** מחושבות בקליינט.

---

## Client

| קובץ | תפקיד |
|------|--------|
| `src/lib/firebase/functions.ts` | `EntryMutationCallableResult` (alias ל-P1A) |
| `src/lib/entries/approveEntry.ts` … `editEntry.ts` | מחזירים תשובה מלאה |
| `src/lib/cards/patchCardBalances.ts` | patch יתרות ב-context בלבד |
| `src/app/app/cards/[cardId]/page.tsx` | `refreshAfterEntryMutation`; `contextRef` |
| `src/components/entries/EditEntrySheet.tsx` | `onEdited(result)` |

**מסלול light (אחרי mutation מוצלח):**

```text
Callable → hasCardBalancePatch + contextRef.current
  → patchCardBalances(setContext)
  → listEntries(cardId)
  → applyEntriesResult
```

**ללא** `getCardPageContext` בחלון 3–5 שניות אחרי ה-mutation (מסלול post-mutation).

---

## Fallback — `refreshCardData()` מלא

| תנאי | Branch |
|------|--------|
| חסרים `officialBalance` / `pendingBalanceImpact` בתשובה | A — missing patch |
| `contextRef.current === null` | B — no context |
| `listEntries` נכשל | C — `console.error` + full refresh |

---

## אימות QA (סגירה)

**חוזה P1B (מסלול רענון):** mutation מסתיים → `listEntries` אחרי mutation → **ללא** `getCardPageContext` מיידי בחלון 3–5s אחרי mutation → UI מתעדכן → ללא loading תקוע / כפילות פעולה.

| פעולה | סוג אימות | תוצאה |
|--------|-----------|--------|
| **createEntry** (רגרסיה P1A) | עשן ידני בדפדפן | ✓ PASS |
| **approveEntry** | עשן ידני בדפדפן | ✓ PASS |
| **editEntry** | עשן ידני בדפדפן | ✓ PASS |
| **rejectEntry** | כיסוי קוד + אותו מסלול כמו approve/edit — **לא** עשן ידני בדפדפן | ✓ PASS (סגירה) |
| **cancelEntry** | כיסוי קוד + אותו מסלול כמו approve/edit — **לא** עשן ידני בדפדפן | ✓ PASS (סגירה) |

### rejectEntry / cancelEntry — ניסוח מדויק

- **לא בוצע** עשן ידני בדפדפן ל-`rejectEntry` ול-`cancelEntry` במסגרת סגירת P1B.
- **כיסוי קוד:** PASS — אותו `readEntryMutationBalances`, אותו צורת wrapper, אותו `refreshAfterEntryMutation`.
- **כיסוי דפוס:** PASS — זהה ל-`approveEntry` / `editEntry` שאומתו ידנית.
- **סגירת שלב:** מתקבלים לסגירת P1B **בלי** לטעון שעברו עשן ידני ישיר בדפדפן.

---

## מדידות ביצועים (עדות QA)

מקור: `npm run dev`, `[perf]` / `__perfReport()`, סינון לוגים אחרי פעולה.

| operation | Callable (ms) | listEntries (ms) | post-action `getCardPageContext` |
|-----------|---------------|------------------|----------------------------------|
| createEntry #1 (רגרסיה) | 4679 | 523 | לא |
| createEntry #2 (רגרסיה) | 5108 | 1256 | לא |
| approveEntry | 5282 | 396 | לא |
| editEntry | 5413 | 506 | לא |
| rejectEntry | לא נמדד ידנית | מסלול משותף — לא נבדק ישירות | לא נבדק ישירות |
| cancelEntry | לא נמדד ידנית | מסלול משותף — לא נבדק ישירות | לא נבדק ישירות |

**סיווג:**

- זמן Callable **~4.7–5.4s** — תצפית נפרדת על latency של Cloud Functions / Callable; **לא** חוסם P1B.
- יעד מסלול רענון P1B מוצלח: `listEntries` אחרי mutation, בערך **~396–1256ms** במדידות שבוצעו.
- `getCardPageContext` / `listUserCards` כפולים **מאוחר יותר** — ניווט / טעינה / Strict Mode; **לא** כשל P1B.

פירוט: [PERF_BASELINE.md](./PERF_BASELINE.md).

---

## ידוע / לא חוסם

- Node.js 20 deprecation warning ב-deploy CLI.
- `firebase-functions` — הודעת upgrade ב-CLI (לא חוסם).
- `getCardPageContext` בטעינת עמוד ראשונית — תקין; לא לבלבל עם post-mutation.
- לפני deploy P1B: תשובה ישנה `{ cardId, entryId }` → Branch A (full refresh) — נפתר אחרי deploy.

---

## מה לא השתנה

- Firestore Rules
- לוגיקת transaction / audit / הרשאות
- עיצוב UI
- dashboard / invite / join
- **2D-1** — לא התחיל

---

## קישורים

- [STAGE2D-P1A_LIGHT_REFRESH_CREATE.md](./STAGE2D-P1A_LIGHT_REFRESH_CREATE.md) — P1A
- [PERF_BASELINE.md](./PERF_BASELINE.md) — מדידות
- [STAGE2D_RELIABILITY_PRODUCT_SAFETY.md](./STAGE2D_RELIABILITY_PRODUCT_SAFETY.md) — תכנון 2D
- [PROJECT_STATE.md](./PROJECT_STATE.md) · [ROADMAP.md](./ROADMAP.md)
