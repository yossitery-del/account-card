# Performance Baseline — כרטיס חשבון

מסמך מדידות **אמיתיות** מ-`npm run dev` + DevTools Console (`[perf]`, `__perfReport()`). לוגי `[P1A]` הוסרו אחרי סגירת P1A.

**סביבה:** development, React Strict Mode פעיל — `calls: 2` אפשרי בטעינת עמוד; לא משקף production ב-100%.

**פרויקט:** `account-card-18e3a` · Functions region: `europe-west1` · **ללא** Functions Emulator (`NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR` לא מוגדר).

---

## createEntry — לפני / אחרי 2D-P1A

מדידה: משתמש מחובר, כרטיס טעון, `__perfReset()`, הוספת רשומה אחת.

### לפני P1A (מסלול מלא אחרי create)

| מדד | ערך (ms) | הערות |
|-----|----------|--------|
| `createEntry` (warm, call #2) | **~1781** | Callable |
| `getCardPageContext` (post-create) | **עד ~1730** | `refreshCardData` — כולל `activeParticipantsQuery` |
| `listEntries` (post-create) | **~442–1250** | מקביל ל-context ב-fallback; שונות רשת |
| **סה״כ מורגש (בערך)** | **~3500+** | Callable + max(context, entries) |

**אבחון:** תשובת שרת תקינה עם יתרות, אך Branch B (`context missing`) גרם ל-fallback → `getCardPageContext` + `listEntries`.

### אחרי P1A (מסלול light — QA PASS)

| מדד | ערך (ms) | הערות |
|-----|----------|--------|
| `createEntry` | **1445** | Callable — עדיין דומיננטי |
| `getCardPageContext` (post-create) | **לא במסלול** | מסלול light (אומת ב-QA עם `[P1A]`) |
| `listEntries` (post-create) | **420** | בלבד אחרי patch |
| **סה״כ מורגש (בערך)** | **~1865** | Callable + listEntries |

**שיפור מורגש (הערכה):** הסרת post-create `getCardPageContext` חוסכת בערך **~0.8–1.7s** לעומת fallback כבד (תלוי רשת).

---

## פעולות אחרות (לפני P1A — partial baseline)

מדידות מוקדמות יותר; **לא** עודכנו אחרי P1A.

| operation | ms | calls | הערות |
|-----------|-----|-------|--------|
| `listUserCards` | 776 | 2 | `cardReadsParallel` 515ms |
| `getCardPageContext` (טעינת כרטיס) | 827 | 2 | |
| `listEntries` (טעינת כרטיס) | 438 | 2 | |
| `createInvitation` | 1766 | 1 | invite — יציב |

---

## Callable cold start (הערה)

`createEntry` ראשון בסשן: **~3583ms** — כנראה Functions cold start + עבודה; warm **~1445–1781ms**.

Min instances — **לא** בוצע (מחוץ ל-P1A).

---

## איך למדוד שוב

```text
1. npm run dev
2. DevTools Console → __perfReset()
3. פעולה (למשל הוספת רשומה)
4. בדוק [perf] finished lines (אין [P1A] — הוסר אחרי סגירת P1A)
5. __perfReport()  // זמני אחרון לכל label — לא מבדיל טעינה ראשונית מ-post-create
```

למסלול post-create: סנן לוגים **אחרי** לחיצת «שליחה לאישור»; אמור לראות `listEntries` בלי `getCardPageContext`.

---

## Post-mutation light refresh — 2D-P1B

מדידות סגירת P1B — `npm run dev`, `[perf]`, סינון לוגים **אחרי** לחיצת mutation.

| operation | callable ms | listEntries ms | getCardPageContext post-action | notes |
|-----------|-------------|----------------|--------------------------------|-------|
| createEntry regression #1 | 4679 | 523 | no | P1A regression evidence |
| createEntry regression #2 | 5108 | 1256 | no | P1A regression evidence |
| approveEntry | 5282 | 396 | no | manual smoke PASS |
| editEntry | 5413 | 506 | no | manual smoke PASS |
| rejectEntry | not manually measured | shared-path verified | not directly tested | code-pattern PASS |
| cancelEntry | not manually measured | shared-path verified | not directly tested | code-pattern PASS |

**הערת סיווג:** זמן Callable **~4.7–5.4s** מתועד בנפרד כ-Cloud Functions / Callable latency — **לא** חוסם P1B. יעד מסלול רענון P1B: **ללא** `getCardPageContext` מיידי אחרי mutation; **`listEntries` בלבד** (~396–1256ms במדידות שבוצעו). `getCardPageContext` / `listUserCards` מאוחר יותר = ניווט / טעינה / Strict Mode — לא כשל P1B.

---

## Firebase Cost Risk Baseline — current MVP

**סטטוס:** אודיט ארכיטקטורה (מאי 2026) — baseline לעלות תפעולית, לא אופטימיזציה.

| נושא | מסקנה |
|------|--------|
| **סיכון עלות כולל (MVP)** | **LOW** — מעט כרטיסים למשתמש, ~2 משתתפים לכרטיס, היקף רשומות נמוך בפועל |
| **סיכון עתידי עיקרי** | **`listEntries` ללא גבול** — כל mutation + טעינת כרטיס = קריאת **כל** הרשומות (O(E)) |
| **סיכון משני** | **Callable latency ~4.7–5.4s** — עלות invocations / GB-seconds + UX; נפרד ממסלול רענון P1B |
| **תועלת P1A/P1B** | **`getCardPageContext` הוסר ממסלול happy path אחרי mutation** — חוסך ~4 reads + זמן מורגש לעומת refresh מלא |
| **החלטה נוכחית** | **ללא אופטימיזציה עכשיו** — ניטור בלבד (תקציב GCP, Firebase usage, התראות) |
| **טריגר עתידי** | **Pagination / limit** כשהיסטוריה טיפוסית לכרטיס מתקרבת ל-**100–200** רשומות, או שימוש אמיתי מראה קפיצה ב-reads |

---

## Repo verification gate — מאי 2026

תיעוד **build / lint / test** אחרי סגירת ה-repo המפוצל. **לא** deploy; **לא** 2D-1.

| מדד | ערך |
|-----|-----|
| **HEAD** | `55cbaef` |
| **git status** | נקי |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run test:functions` | PASS |
| `npm run test:rules` | PASS |
| `npm run test:functions:emulator` | PASS |

**Emulator:** `test:rules` ו-`test:functions:emulator` דורשים **Firestore Emulator** (`firebase emulators:exec --only firestore`).  
**לוגים:** `firestore-debug.log` נוצר מקומית — **ב-`.gitignore`**, לא נשמר ב-git.

---

## עדכונים עתידיים

| שלב | מה למדוד |
|-----|----------|
| **2D-3** | production build (`npm start`) — הפחתת כפילויות Strict Mode |
| **2D-1** | הרחבת בדיקות Functions (מסלול נפרד — לא התחיל) |

---

## קישורים

- [STAGE2D-P1A_LIGHT_REFRESH_CREATE.md](./STAGE2D-P1A_LIGHT_REFRESH_CREATE.md) — סגירת P1A
- [STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md](./STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md) — סגירת P1B
- [STAGE2D_RELIABILITY_PRODUCT_SAFETY.md](./STAGE2D_RELIABILITY_PRODUCT_SAFETY.md) — תכנון 2D
