# Stage 2D-P1A — Light Refresh After createEntry

**סטטוס:** **סגור — QA ידני עבר (PASS)** — מאי 2026.

**תלות:** Stage **2C-1** (`createEntry`), מסך כרטיס פעיל עם `CardPageContext` טעון.

**מחוץ להיקף P1A:** `editEntry`, `approveEntry`, `rejectEntry`, `cancelEntry` — טופלו ב-**2D-P1B** ([מסמך](./STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md)).

---

## מטרה

להקטין תחושת איטיות אחרי **הוספת רשומה** (`createEntry`) בלי:

- optimistic `officialBalance`
- שינוי balance math / audit / permissions
- שינוי Firestore Rules

**גישה:** השרת מחזיר יתרות אחרי commit; הקליינט מעדכן context ומרענן **רק** `listEntries`.

---

## בעיה (לפני P1A)

אחרי `createEntry` הצליח, המסך הריץ:

```text
refreshCardData() → getCardPageContext + listEntries (מקביל)
```

במדידות dev (לפני תיקון Branch B):

| שלב | זמן משוער |
|-----|-----------|
| `createEntry` (warm) | ~1781ms |
| `getCardPageContext` (post-create) | עד ~1730ms |
| `listEntries` (post-create) | ~442–1250ms |

**סיבות שזוהו:**

1. Callable `createEntry` החזיר רק `{ entryId }` בתיעוד ישן — בפועל הורחב ב-P1A ליתרות מהשרת.
2. `hasCardBalancePatch` עבר, אך בדיקת `hadContext` בתוך `setContext` הייתה לא אמינה (Branch B) → fallback מלא.
3. `__perfReport` עדיין מציג `getCardPageContext` מטעינה ראשונית / Strict Mode — לא תמיד ממסלול post-create.

---

## פתרון (אחרי P1A)

### Functions — `createEntry` (ללא שינוי לוגיקת transaction)

**Output אחרי commit:**

```typescript
{
  cardId: string;
  entryId: string;
  officialBalance: number;
  pendingBalanceImpact: number;
  updatedAt: string; // ISO
}
```

יתרות נקראות מ-`accountCards/{cardId}` אחרי transaction (`readEntryMutationBalances` ב-`functions/src/lib/entryMutationBalances.ts`).

### Client

| קובץ | תפקיד |
|------|--------|
| `src/lib/cards/patchCardBalances.ts` | עדכון `officialBalance`, `pendingBalanceImpact`, `updatedAt` בלבד |
| `src/app/app/cards/[cardId]/page.tsx` | `refreshAfterEntryMutation` (מ-P1B; כולל create) — patch + `listEntries`; `contextRef` |

**מסלול תקין אחרי create:**

1. `createEntry` Callable
2. `[P1A] branch: "light"` — `patchCardBalances` + `listEntries`
3. **ללא** `getCardPageContext` במסלול post-create

**Fallback ל-`refreshCardData()` מלא רק אם:**

| תנאי | Branch log (dev) |
|------|------------------|
| חסרים שדות יתרה בתשובה | `A` |
| אין context (`contextRef.current === null`) | `B` |
| `listEntries` נכשל | `C` |

### תיקון Branch B (QA סגירה)

`hadContext` בתוך updater הוחלף ב-`contextRef` מסונכרן עם `context` — מונע fallback שגוי כשהכרטיס כבר על המסך.

---

## אימות QA (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| `[P1A] branch: "light"` אחרי create | ✓ |
| `patch + listEntries only` | ✓ |
| `officialBalance` ללא שינוי ב-create | ✓ (0 במקרה הבדיקה) |
| `pendingBalanceImpact` מהשרת | ✓ |
| רשומה חדשה ברשימה | ✓ |
| אין duplicate entry | ✓ |
| אין fallback A/B/C אחרי create מוצלח | ✓ |
| `createEntry` ~1445ms, `listEntries` ~420ms | ✓ (מדידה אחת, dev) |
| `getCardPageContext` במסלול post-create | **לא** (perf ראשוני/Strict Mode עדיין יכול להופיע בטעינת עמוד) |

---

## לוגים `[P1A]` (אבחון — הוסרו)

במהלך אבחון P1A שימשו לוגים `[P1A]` ב-`development` בלבד (`NODE_ENV === "development"`).  
אחרי QA PASS וסגירת השלב — **הוסרו** מ-`page.tsx` (ניקוי סופי). מדידות המשך: `[perf]` / `__perfReport()` בלבד.

---

## מה לא השתנה

- Firestore Rules
- balance math / audit / permissions ב-Functions
- `editEntry` / `approveEntry` / `rejectEntry` / `cancelEntry` (רענון קל — **2D-P1B**)
- עיצוב UI
- dashboard / invite / join

---

## Deploy

| רכיב | נדרש |
|------|------|
| **Functions** `createEntry` | כן — תשובה מורחבת (`europe-west1`) |
| **Client** | כן — `refreshAfterCreateEntry` + `contextRef` |

---

## השלב הבא (אחרי P1A)

**2D-P1B** — **סגור (PASS)** — [STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md](./STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md).

**מומלץ הבא:** **2D-1** — Balance & Permission Function Tests — לא מתחיל בלי אישור מפורש.

פירוט ביצועים: [PERF_BASELINE.md](./PERF_BASELINE.md).  
תכנון כללי: [STAGE2D_RELIABILITY_PRODUCT_SAFETY.md](./STAGE2D_RELIABILITY_PRODUCT_SAFETY.md).
