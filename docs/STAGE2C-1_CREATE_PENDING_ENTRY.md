# Stage 2C-1 — Create Pending Entry

**סטטוס:** **סגור — מאושר ונבדק** (QA ידני עבר, מאי 2026).

**תלות:** Stage **2B-4** — כרטיס משותף, 2 participants פעילים.

## מטרה

משתתף פעיל מוסיף רשומה במצב `pending` בלבד.  
`pendingBalanceImpact` מתעדכן; `officialBalance` **לא** משתנה (יעודכן רק ב-**2C-2** אחרי אישור).

---

## אימות QA (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| מודל הוספת רשומה | עובד |
| `createEntry` Callable | עובד — `europe-west1`, auth חובה |
| רשומה `status: pending` | ✓ |
| `pendingBalanceImpact` | מתעדכן |
| `officialBalance` | **לא** משתנה ב-2C-1 |
| שני participants | רואים רשומות |
| אין אשר/דחה ב-UI | ✓ |
| אין UID/email בממשק | ✓ |
| build/lint | עברו |

---

## Callable — `createEntry`

| | |
|--|--|
| Region | `europe-west1` |
| Auth | חובה |

**Input (client):**

```typescript
{
  cardId: string;
  intent: "to_receive" | "to_pay";  // UI: זיכוי / חיוב
  amount: number;
  title: string;
}
```

**Output:** `{ entryId: string }`

ה-client **לא** שולח `type`, `effect`, balances, `status`, `createdByUid`.

### מיפוי intent → type (שרת)

השרת קורא `balancePerspectiveUid` מהכרטיס ומחשב `type` + `effectOnPerspectiveBalance`:

| UI | `intent` | משמעות למשתמש |
|----|----------|----------------|
| **זיכוי** | `to_receive` | מגדיל את הזכות שלי |
| **חיוב** | `to_pay` | מגדיל את החובה שלי |

| `intent` | אם `actorUid === balancePerspectiveUid` | אחרת |
|----------|----------------------------------------|------|
| `to_receive` | `charge` / `increase` | `credit` / `decrease` |
| `to_pay` | `credit` / `decrease` | `charge` / `increase` |

נשמר ב-Firestore: `type` (`charge` \| `credit`), `effectOnPerspectiveBalance`, `amount`, `title`, וכו'.

### Transaction

1. `entries/{entryId}` — `pending`
2. `accountCards/{cardId}` — `pendingBalanceImpact += delta` בלבד
3. `auditEvents` — `entry.created` (metadata: `intent`, `type`, `effect`, `amount` — **ללא** title)

---

## Firestore Rules

```text
entries: read — isActiveParticipant(cardId); write — deny
```

---

## UI — copy מאושר (נוכחי)

### מודל הוספת רשומה

| רכיב | נוסח |
|------|------|
| **כותרת** | מה לעדכן בחשבון? |
| **כפתור ימין (RTL)** | **זיכוי** — מגדיל את הזכות שלי |
| **כפתור שמאל (RTL)** | **חיוב** — מגדיל את החובה שלי |
| שדות | סכום · פירוט קצר |
| סיום | שליחה לאישור |
| הסבר | הרשומה לא נכנסת ליתרה בכרטיס מיד. היא נשלחת לאישור הצד השני. |

### מסך כרטיס

| אזור | נוסח / התנהגות |
|------|----------------|
| יתרה | **יתרה בכרטיס** — תמיד מספר (`₪0`, `₪300`, …); «מאוזן» רק משני כש-0 |
| ממתין | **ממתין לאישור** — רק `pendingBalanceImpact` (`+₪` / `-₪` / `₪0`) |
| רשימה | **רשומות בכרטיס** — שורות פנקס (זיכוי/חיוב, סכום, פירוט) |
| שיתוף | status strip «מחובר» כש-2 participants |

---

## Client (עיקרי)

| קובץ | תפקיד |
|------|--------|
| `functions/src/entries/createEntry.ts` | Callable |
| `functions/src/lib/entryIntent.ts` | מיפוי intent |
| `src/lib/entries/createEntry.ts` | wrapper |
| `src/lib/entries/listEntries.ts` | רשימה (2 queries, לא N+1) |
| `src/lib/entries/entryIntent.ts` | תצוגת זיכוי/חיוב לצופה |
| `src/lib/entries/entriesCopy.ts` | נוסח UI |
| `src/components/entries/AddEntrySheet.tsx` | מודל |
| `src/components/entries/EntryList*.tsx` | רשימה |
| `src/lib/cards/cardsCopy.ts` | יתרה בכרטיס / ממתין |
| `src/lib/dev/perfLog.ts` | `[perf]` ב-development בלבד (`__perfReport()`) |

---

## Performance (development)

- `withPerf` על wrappers מרכזיים — לא משנה production
- `__perfReport()` בקונסול — סיכום זמנים אחרון לפי תווית
- אבחון: cold start אפשרי ב-Callable ראשון; `listUserCards` — N קריאות כרטיס במקביל (לא batch API)

---

## מה לא ב-2C-1

| מחוץ לשלב |
|-----------|
| `approveEntry` / `rejectEntry` / `cancelEntry` |
| עדכון `officialBalance` |
| Truth Dataset מלא |
| PDF, קטגוריות, קבצים, `note` נפרד |

---

## השלב הבא

**2C-2** — `approveEntry` / `rejectEntry`, עדכון `officialBalance`, Truth Dataset — **רק באישור מפורש** («מאושר — בצע 2C-2»).

**לא לכתוב קוד 2C-2 עד אישור.**
