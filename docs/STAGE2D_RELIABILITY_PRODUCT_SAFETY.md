# שלב 2D — שכבת יציבות ובטיחות מוצר

**סטטוס:** **2D-0 סגור** — תשתית בדיקות מינימלית פעילה. אין להתחיל 2D-1 בלי אישור מפורש.

**תלות:** Stages 2C-1 עד 2C-4 **סגורים** (מעגל pending מלא). Stage 2D **אינו** פיצ'ר מוצרי — שכבת בטיחות, מדידה וחוזים.

**מטרה:** להפוך את האפליקציה מ«עובד ב-QA ידני» למערכת עם **בטיחות אוטומטית** סביב יתרות, הרשאות, מצבי טעינה, חוזי נתונים וביצועים.

**מחוץ להיקף 2D:** PDF, encryption מלאה, analytics, תשלומים, PWA onboarding, Personal Card Alias, שלבי 2C חדשים, שינוי UX/עיצוב מלבד hardening טעינה/שגיאה.

---

## עקרונות

| עיקרון | משמעות |
|--------|---------|
| **אין production Firebase ב-CI** | בדיקות רצות מול Emulator או יחידה טהורה |
| **יתרות = מקור אמת בשרת** | בדיקות אינטגרציה קוראות `officialBalance` / `pendingBalanceImpact` אחרי Callable |
| **Rules = קו הגנה אחרון** | בדיקות Rules מינימליות אך חובה — לא מחליפות Functions |
| **מספרים אמיתיים ב-2D-3** | לא הערכות ארכיטקטורה — רק מדידות מ-`[perf]` / סקריפט |
| **לא מסגרת כבדה ללא הצדקה** | Vitest + Emulator; ולידציה קלה ב-Functions |

---

## מפת תת־שלבים

| שלב | שם | מטרה |
|-----|-----|------|
| **2D-0** | Test Harness Foundation | **סגור** — כלי בדיקה, סקריפטים, Emulator smoke, Rules smoke |
| **2D-1** | Balance & Permission Function Tests | Callables + יתרות + TRUTH_DATASET |
| **2D-2** | Firestore Rules Safety Tests | read/write deny/allow מינימלי |
| **2D-3** | Performance Measurement Pass | מספרים אמיתיים + baseline |
| **2D-4** | Loading/Error Hardening Pass | success/error/retry/timeout בכל זרימה |
| **2D-5** | Data Contract Validation | צורות Firestore + helpers בשרת |

**סדר מומלץ:** 2D-0 → 2D-1 → 2D-2 (מקביל אפשרי אחרי 0) → 2D-3 → 2D-4 → 2D-5.

---

# 2D-0 — יסודות תשתית בדיקות

## סטטוס מימוש

2D-0 הוסיף וסגר תשתית בדיקות מינימלית בלבד:

- Vitest ל-Functions.
- בדיקת יחידה קטנה ללוגיקת `entryIntent` / `balanceDelta`.
- בדיקת עשן אחת מול Firestore Emulator ל-`createEntry`.
- בדיקת Firestore Rules אחת שמוודאת שכתיבת קליינט ל-`entries` נחסמת.
- סקריפטים להרצה מקומית.
- דרישת Java 21 / Temurin להפעלת Firebase Emulator.

אימות סגירה:

| בדיקה | תוצאה |
|-------|--------|
| `npm run test:functions` | עבר — בדיקת יחידה ל-`entryIntent` / `balanceDelta` |
| `npm run test:functions:emulator` | עבר — Firestore Emulator עלה; `createEntry` יצר pending; `pendingBalanceImpact` עודכן |
| `npm run test:rules` | עבר — כתיבת קליינט ל-`entries` נחסמה כמצופה |
| `npm run test:all` | עבר — unit + emulator smoke + rules |

לא נבנו תרחישי `TRUTH_DATASET` מלאים, לא נפתח 2D-1, לא שונו Rules, לא שונה UI ולא שונתה לוגיקה עסקית. לא בוצע deploy.

## דרישות מקומיות לבדיקות Emulator

- Node.js 20+
- Java JDK 21 ומעלה; מומלץ Temurin 21 LTS.

התקנה ב-macOS עם Homebrew:

```bash
brew install --cask temurin@21
```

אימות:

```bash
java -version
```

התוצאה צריכה להציג גרסת `21` ומעלה.

## הרצת בדיקות

```bash
npm run test:functions
```

מריץ בדיקות יחידה של Functions.

```bash
npm run test:functions:emulator
```

מעלה Firestore Emulator ומריץ את בדיקת העשן האינטגרטיבית של Functions.

```bash
npm run test:rules
```

מעלה Firestore Emulator ומריץ את בדיקת ה-Rules.

```bash
npm run test:all
```

מריץ את שלושת המסלולים ברצף.

## החלטת כלי בדיקה (מומלץ)

| שכבה | כלי | סיבה |
|------|-----|------|
| **Functions unit** | [Vitest](https://vitest.dev/) | מהיר, TypeScript native, תואם Node 20 |
| **Functions integration** | Vitest + `@firebase/rules-unit-testing` + Firebase Emulator Suite | Callable + Firestore אמיתי מקומי |
| **Client unit (אופציונלי ב-2D-0)** | Vitest (`environment: node`) | `viewerDelta`, formatters — ללא React בהתחלה |
| **Client component** | **לא ב-2D-0** | Playwright / RTL — שלב עתידי אם נדרש |
| **Rules** | `@firebase/rules-unit-testing` | סטנדרט Firebase ל-Rules |
| **E2E** | **לא ב-2D** | ידני + Emulator; Playwright רק אם יידרש מאוחר יותר |

**לא מומלץ כרגע:** Jest (כבד יותר), Cypress מלא, Detox.

## גישת בדיקה ל-Functions

```
┌─────────────────────────────────────────────────────────┐
│ Tier A — Pure unit (ללא Emulator)                       │
│  entryIntent, balanceDelta, resolveTypeFromIntent,      │
│  parse*Payload validators (עם mock HttpsError)          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Tier B — Integration (Emulator)                         │
│  seed Firestore → wrap Callable → assert docs + balances │
│  createEntry, approve, reject, cancel, edit, invitations  │
└─────────────────────────────────────────────────────────┘
```

- **ייצוא לוגיקה:** פונקציות ב-`functions/src/lib/*` כבר ניתנות לבדיקה ישירה (Tier A).
- **Callables:** ב-Tier B — `firebase-functions-test` או קריאה ל-handler אחרי `initializeTestEnvironment` + Admin seed.

## שימוש ב-Emulator

כבר מוגדר ב-`firebase.json`:

| שירות | פורט |
|--------|------|
| Auth | 9099 |
| Firestore | 8080 |
| Functions | 5001 |
| Emulator UI | 4000 |

**מה אפשר לבדוק בלי production:**

- כל Tier A
- Tier B מול Emulator (Auth מזויף, Firestore מקומי, Functions מקומיות)
- Rules unit tests (Firestore emulator בלבד)
- **לא** לבדוק: cold start אמיתי ב-production, Vercel edge, Google OAuth אמיתי

**משתני סביבה לבדיקות:**

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
GCLOUD_PROJECT=account-card-18e3a-test  # project ID לבדיקות
```

## מבנה קבצים מוצע (ביישום)

```
account-card/
├── vitest.config.ts                 # root — client pure tests (אופציונלי)
├── package.json                     # scripts: test, test:watch
├── tests/
│   └── perf/                        # 2D-3 — סקריפטים למדידה (לא assert)
│       └── README.md
├── functions/
│   ├── vitest.config.ts
│   ├── package.json                 # test, test:integration, test:rules
│   └── src/
│       ├── **/*.test.ts             # unit ליד lib (או __tests__)
│       └── test/
│           ├── setup.ts             # emulator hooks, global beforeAll
│           ├── helpers/
│           │   ├── seedCard.ts      # card + 2 participants
│           │   ├── callCallable.ts
│           │   └── assertBalances.ts
│           └── integration/
│               ├── entries.lifecycle.test.ts
│               └── permissions.test.ts
├── firestore.rules
└── tests/rules/
    └── firestore.rules.test.ts      # @firebase/rules-unit-testing
```

## סקריפטים מוצעים ב-`package.json`

**Root:**

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:rules": "firebase emulators:exec --only firestore 'vitest run tests/rules'",
  "test:functions": "firebase emulators:exec --only auth,firestore,functions 'npm run test:integration --prefix functions'",
  "test:all": "npm run test && npm run test:rules && npm run test:functions"
}
```

**`functions/package.json`:**

```json
{
  "test": "vitest run",
  "test:unit": "vitest run --exclude '**/integration/**'",
  "test:integration": "vitest run src/test/integration"
}
```

## תוצרי 2D-0 (PASS)

| תוצר | PASS |
|------|------|
| `npm run test:functions` עובר מקומית | ✓ |
| Emulator עולה עם `firebase emulators:exec` | ✓ |
| דוגמת בדיקת יחידה + דוגמת בדיקת עשן אינטגרטיבית | ✓ |
| בדיקת Rules מינימלית ל-deny write | ✓ |
| תיעוד הרצה ודרישת Java 21 | ✓ |
| ללא שינוי התנהגות מוצר / ללא deploy | ✓ |

## BLOCKER ל-2D-1

2D-0 אינו חוסם עוד את 2D-1.  
**2D-1 הוא השלב הבא המומלץ, אך לא מתחילים אותו בלי אישור מפורש.**

---

# 2D-1 — Balance & Permission Function Tests

## מטרה

כיסוי אוטומטי ללוגיקת יתרות והרשאות ב-Callables — מקור האמת ל-[TRUTH_DATASET.md](./TRUTH_DATASET.md).

## Functions בכיסוי

| Callable | קובץ |
|----------|------|
| `createEntry` | `entries/createEntry.ts` |
| `editEntry` | `entries/editEntry.ts` |
| `cancelEntry` | `entries/cancelEntry.ts` |
| `approveEntry` | `entries/approveEntry.ts` |
| `rejectEntry` | `entries/rejectEntry.ts` |

**מחוץ לליבה (אופציונלי בסוף 2D-1):** `createInvitation`, `acceptInvitation`, `createAccountCard`.

## תרחישי בדיקה — יתרות

### יחידה (Tier A)

| ID | תרחיש | קלט | צפוי |
|----|--------|-----|------|
| U1 | `balanceDelta(increase, 500)` | | `+500` |
| U2 | `balanceDelta(decrease, 200)` | | `-200` |
| U3 | Yossi `to_receive`, perspective=Yossi | | `charge`, `increase` |
| U4 | Stav `to_receive`, perspective=Yossi | | `credit`, `decrease` |
| U5 | edit delta adjustment | before/after intent+amount | `deltaAfter - deltaBefore` |

### אינטגרציה (Tier B) — TRUTH_DATASET מלא

הקשר: `balancePerspectiveUid = Yossi`, פתיחה `0/0`.

| צעד | פעולה | אחרי צעד: official | pending |
|-----|--------|-------------------|---------|
| 1 | Yossi charge 500 → Stav approves | 500 | 0 |
| 2 | Stav credit 200 → Yossi approves | 300 | 0 |
| 3 | Yossi charge 100 pending | 300 | 100 |
| 4 | Stav credit 50 → Yossi rejects | 300 | 100 |

**סיום:** `officialBalance === 300`, `pendingBalanceImpact === 100`.

### אינטגרציה — מעגל pending

| ID | תרחיש | צפוי |
|----|--------|------|
| E1 | create pending | pending += delta, official ללא שינוי |
| E2 | approve | official += delta, pending -= delta |
| E3 | reject | official ללא שינוי, pending -= delta |
| E4 | cancel (creator) | pending -= delta |
| E5 | edit amount (creator, pending) | pending += (new-old) delta |
| E6 | edit no-op | `failed-precondition`, ללא audit |

## תרחישי הרשאות

| ID | תרחיש | צפוי |
|----|--------|------|
| P1 | self-approve | `permission-denied` / assert |
| P2 | self-reject | `permission-denied` |
| P3 | stranger Callable | `permission-denied` |
| P4 | approve twice | `failed-precondition` |
| P5 | reject after approved | `failed-precondition` |
| P6 | cancel by non-creator | `permission-denied` |
| P7 | edit by non-creator | `permission-denied` |
| P8 | edit approved entry | `failed-precondition` |

## מיפוי ל-TRUTH_DATASET T1–T7

| Truth ID | כיסוי אוטומטי |
|----------|----------------|
| T1 | E2 — approve credit 500 |
| T2 | E3 — reject charge 200 |
| T3 | P1 |
| T4 | P4 |
| T5 | P5 |
| T6 | P3 |
| T7 | סיום Dataset מלא |

## PASS / BLOCKER — 2D-1

| PASS | BLOCKER |
|------|---------|
| כל U1–U5 ירוקים | כלל יתרה נכשל ב-Dataset |
| TRUTH_DATASET end-state ירוק | self-approve עובר |
| P1–P8 ירוקים | stranger קורא/כותב יתרה |
| `npm run test:functions` ב-CI/local | אין integration בלי Emulator |

---

# 2D-2 — Firestore Rules Safety Tests

## מטרה

לוודא שהלקוח **לא** יכול לעקוף Functions — read מצומצם, write חסום.

## כלי

`@firebase/rules-unit-testing` + Firestore Emulator בלבד (ללא Functions).

## תרחישים

| ID | פעולה | Auth | צפוי |
|----|--------|------|------|
| R1 | read `accountCards/{cardId}` | active participant | **allow** |
| R2 | read `accountCards/{cardId}` | stranger | **deny** |
| R3 | read `entries` | active participant | **allow** |
| R4 | read `entries` | stranger | **deny** |
| R5 | read `auditEvents` | active participant | **allow** |
| R6 | create `entries` | participant | **deny** |
| R7 | update `accountCards` (officialBalance) | participant | **deny** |
| R8 | create `auditEvents` | participant | **deny** |
| R9 | write `invitations` | participant | **deny** |
| R10 | `collectionGroup(participants)` own active | owner uid | **allow** |
| R11 | read other user's participant doc | stranger | **deny** |

## seed מינימלי לכל test

```text
accountCards/{cardId}
  participants/{yossiUid}  status: active
  participants/{stavUid}   status: active
  entries/{entryId}        (אופציונלי)
```

## PASS / BLOCKER — 2D-2

| PASS | BLOCKER |
|------|---------|
| R1–R11 עוברים | client יכול `set` על entries |
| `npm run test:rules` | Rules לא נטענות ב-emulator |

---

# 2D-3 — Performance Measurement Pass

## מטרה

**מספרים אמיתיים** — לא הערכות. יצירת baseline לפני אופטימיזציה עתידית.

## מקורות מדידה

| מקור | שימוש |
|------|--------|
| `[perf]` / `__perfReport()` | Client — dev בלבד (`src/lib/dev/perfLog.ts`) |
| סקריפט `tests/perf/run-baseline.mjs` | אופציונלי — חוזר על wrappers עם Auth אמיתי ב-dev |
| Integration tests | זמן Callable מול Emulator (חם, לא cold start production) |

## פעולות למדידה

| תווית | סוג | הערות |
|--------|-----|--------|
| `listUserCards` | Firestore | כולל `cardReadsParallel` |
| `getCardPageContext` | Firestore | 3 שלבים |
| `listEntries` | Firestore | entries + participants |
| `createInvitation` | Callable | cold start רק ב-production |
| `createEntry` | Callable | |
| `editEntry` | Callable | |
| `approveEntry` | Callable | |
| `rejectEntry` | Callable | |
| `cancelEntry` | Callable | |

## תהליך מדידה (חובה)

1. `npm run dev` — אפליקציה מחוברת ל-Firebase dev/project.
2. בצע סדר פעולות קבוע (מסמך checklist ב-`tests/perf/README.md`).
3. העתק פלט `__perfReport()` לטבלה במסמך **`docs/PERF_BASELINE.md`** (נוצר ב-2D-3).
4. הרץ פעמיים: **ראשון** (cold Callable אפשרי), **שני** (חם).
5. סמן `[perf] duplicate` אם מופיע.

## פורמט תיעוד תוצאות (דוגמה — למלא ביישום)

```markdown
| Operation | Cold (ms) | Warm (ms) | Notes |
|-----------|-----------|-----------|-------|
| listUserCards | ___ | ___ | N cards: ___ |
| getCardPageContext | ___ | ___ | |
| listEntries | ___ | ___ | M entries: ___ |
| createInvitation | ___ | ___ | |
| createEntry | ___ | ___ | |
```

## PASS / BLOCKER — 2D-3

| PASS | BLOCKER |
|------|---------|
| `PERF_BASELINE.md` עם מספרים ממולאים | רק טווחים משוערים |
| זיהוי cold start מתועד (אם רלוונטי) | אין מדידה כלל |
| רשימת duplicates מתועדת | |

**לא PASS:** שיפור ביצועים (זה שלב עתידי נפרד).

---

# 2D-4 — Loading/Error Hardening Pass

## מטרה

כל זרימה אסינכרונית חשובה: **success | error | retry | לא loading אינסופי | timeout היכן שצריך**.

## מצב נוכחי (נקודת התחלה)

| זרימה | סטטוס | הערות |
|--------|--------|--------|
| `/invite` | **תוקן חלקית** | generation + timeout 20s + dedupe |
| Dashboard `listUserCards` | בסיסי | error string, אין retry מפורש |
| Card page load | טוב | `loadGenerationRef`, parallel load |
| Card refresh after entry | טוב | quiet refresh |
| Entry create/edit/cancel/approve/reject | חלקי | שגיאות ברשימה; אין timeout |
| Join preview | לבדוק | |
| Accept invitation | לבדוק | |

## דרישות לכל מסך (תבנית)

```text
states: idle | loading | success | error
actions: retry (אם נכשל), back/cancel (אם רלוונטי)
guards: attemptGeneration / cancelled
timeout: Callables ≥15–20s (מוצר)
never: loading=true ללא נתיב יציאה
```

## זרימות — רשימת hardening

| # | זרימה | קובץ עיקרי | timeout? |
|---|--------|-------------|----------|
| 1 | Invite create | `InviteForm.tsx` | ✓ קיים |
| 2 | Dashboard cards | `app/page.tsx` | מומלץ |
| 3 | Card initial load | `cards/[cardId]/page.tsx` | מומלץ |
| 4 | Entry create | `AddEntrySheet.tsx` | מומלץ |
| 5 | Entry edit | `EditEntrySheet.tsx` | מומלץ |
| 6 | Entry approve/reject/cancel | `page.tsx` | מומלץ |
| 7 | Join preview | `join/[token]/page.tsx` | מומלץ |
| 8 | Accept invitation | join flow | מומלץ |

## בדיקות ידניות (בנוסף לאוטומציה)

- React Strict Mode: invite + dashboard + card — אין תקיעה.
- Offline mid-request → error + retry.
- Callable `permission-denied` → הודעה בעברית, לא spinner.

## PASS / BLOCKER — 2D-4

| PASS | BLOCKER |
|------|---------|
| טבלת זרימות 1–8 עם success/error/retry | invite או card תקועים ב-dev |
| אין `return null` בשגיאה בלי UI | |
| timeouts על Callables במסכים קריטיים | |

---

# 2D-5 — Data Contract Validation

## מטרה

חוזה ברור לצורות Firestore — זיהוי מסמכים שבורים לפני שהם מגיעים ל-UI.

## גישה (קלה)

- **אין** Zod/JSON Schema מלא בפיילוט אלא אם יתברך הצורך.
- **כן:** `assertValid*` ב-Functions לפני `set`/`update` — throws `invalid-argument`.
- **אופציונלי:** TypeScript types משותפים (`types/` ב-functions) — כבר קיים חלקית.

## ישויות ושדות חובה (טיוטה)

### `accountCards/{cardId}`

`title`, `currency`, `status`, `createdByUid`, `balancePerspectiveUid`, `officialBalance`, `pendingBalanceImpact`, `encryptionMode`, `createdAt`, `updatedAt`

### `participants/{uid}`

`uid`, `status`, `role`, `canInvite`, `joinedAt`, (+ display fields אם קיימים)

### `invitations/{id}`

`tokenHash`, `status`, `bindingMode`, `expiresAt`, `createdByUid`, `createdAt` — **ללא** token גולמי

### `entries/{id}`

`type`, `amount`, `effectOnPerspectiveBalance`, `title`, `status`, `createdByUid`, `entryDate`, `createdAt` — `intent` אופציונלי (legacy)

### `auditEvents/{id}`

`action`, `actorUid`, `createdAt`, `metadata` (map מוגבל)

## מיקום קבצים מוצע

```
functions/src/lib/contracts/
  accountCard.ts
  participant.ts
  invitation.ts
  entry.ts
  auditEvent.ts
  index.ts
```

קריאה מ-`createEntry`, `editEntry`, `createInvitation`, וכו' — **רק validate לפני write**.

## PASS / BLOCKER — 2D-5

| PASS | BLOCKER |
|------|---------|
| validator לכל ישות | מסמך שבור גורם ל-crash ב-client |
| test unit לדוגמאות תקינות/לא תקינות | |
| אין שינוי סכימה ב-Firestore בלי עדכון חוזה | |

---

# CI / Local — מה רץ איפה

| פקודה | מתי | זמן משוער |
|--------|-----|------------|
| `npm run lint` | כל PR | ~10s |
| `npm run build` | כל PR | ~15s |
| `cd functions && npm run build` | כל PR | ~10s |
| `npm run test` (unit root) | PR | ~5s |
| `cd functions && npm run test:unit` | PR | ~10s |
| `npm run test:rules` | PR (דורש Java + Firebase CLI) | ~30s |
| `npm run test:functions` | PR או pre-merge | ~60–120s |
| `test:perf` / baseline | **ידני** — לא חוסם PR | |

**מומלץ ל-CI:**

```yaml
# .github/workflows/test.yml (ביישום 2D-0)
- lint + build (root + functions)
- vitest unit (functions)
- firebase emulators:exec → rules + integration
```

**לא ב-CI בשלב זה:** deploy, production Firebase, E2E דפדפן.

---

# סיכום PASS / BLOCKER לשלב 2D כולו

| תת-שלב | PASS (סגירת שלב) | BLOCKER |
|--------|-------------------|---------|
| **2D-0** | `npm test` + emulator smoke | אין תשתית |
| **2D-1** | Dataset + P1–P8 + U1–U5 | יתרה/הרשאה שבורה |
| **2D-2** | R1–R11 | client write ל-entries/balances |
| **2D-3** | `PERF_BASELINE.md` ממולא | אין מספרים |
| **2D-4** | 8 זרימות עם error/retry/timeout | loading אינסופי |
| **2D-5** | validators + unit tests | אין חוזה |

**סגירת Stage 2D:** 2D-0 עד 2D-5 כולם PASS; אין BLOCKER פתוח; `PROJECT_STATE.md` מעודכן.

---

# סיכונים

| סיכון | השפעה | מitiגציה |
|--------|--------|----------|
| Emulator ≠ production | Rules/Indexes שונים | deploy rules לפני merge; בדיקת indexes |
| Integration איטי | מפתחים מדלגים | unit רב; integration ממוקד |
| Flaky StrictMode ב-client tests | false positives | בדיקות client רק ל-pure functions |
| `@firebase/rules-unit-testing` API changes | שבירת CI | נעילת גרסה |
| perf baseline על WiFi איטי | מספרים לא השווים | תיעוד סביבה + ממוצע 3 הרצות |
| Validators כפולים ל-types | תחזוקה | מקור אמת אחד ב-`contracts/` |
| 2D-4 נראה כמו redesign | scope creep | רק states/timeouts/retry, לא עיצוב |

---

# צעד מימוש ראשון מומלץ

**«מאושר — בצע 2D-0» בלבד:**

1. הוסף Vitest ל-`functions/` + `vitest.config.ts`.
2. כתוב 3–5 unit tests ל-`entryIntent.ts` (U1–U5).
3. הוסף `functions/src/test/helpers/seedCard.ts` + integration smoke אחד: `createEntry` → assert `pendingBalanceImpact`.
4. הוסף `npm run test:rules` עם test אחד (R6 — deny client write entries).
5. עדכן `README.md` + `PROJECT_STATE.md` — «2D-0 בתהליך».
6. **אל תיגע** ב-production client UX מלבד מה שכבר תוקן ב-invite.

אחרי 2D-0 ירוק → אישור נפרד ל-**2D-1**.

---

# קישורים

- [TRUTH_DATASET.md](./TRUTH_DATASET.md)
- [STAGE2C_ENTRIES.md](./STAGE2C_ENTRIES.md)
- [PROJECT_STATE.md](./PROJECT_STATE.md)
- [ROADMAP.md](./ROADMAP.md) — לעדכן שורת 2D בעת אישור

---

**לא מיושם:** אין שינוי קוד production במסמך זה.
