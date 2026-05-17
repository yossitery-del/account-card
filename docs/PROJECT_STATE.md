# מצב הפרויקט — כרטיס חשבון

## שם הפרויקט

**כרטיס חשבון** (`account-card`)

## סטטוס נוכחי

**Stage 2C-1 — סגור** (Create Pending Entry — QA עבר).  
**Stage 2C-2 — סגור** (Approve / Reject — QA עבר).  
**Stage 2C-3 — סגור** (Cancel Pending Entry — QA עבר).  
**Stage 2C-4 — סגור** (Edit Pending Entry — QA עבר).
**Stage 2D-0 — סגור** (Test Harness Foundation — Vitest + Emulator smoke + Rules smoke עברו).  
**Stage 2D-P1A — סגור** (Light Refresh אחרי `createEntry` — QA ידני PASS).  
**Stage 2D-P1B — סגור** (Light Refresh אחרי approve/reject/cancel/edit — מיושם + deployed + QA PASS).

**מעגל pending לפני אישור:** create → approve/reject → cancel → edit — **הושלם**.  
**תשתית בדיקות בסיסית:** unit + Firestore Emulator smoke + Rules deny-write — **הושלמה**.  
**ביצועים (mutations):** רענון קל — patch יתרות מהשרת + `listEntries` — **P1A (create) + P1B (approve/reject/cancel/edit)**.  
**עלות Firebase:** baseline סיכון עלות נבדק — סיכון MVP **LOW**; pagination נדחה עד שימוש אמיתי או ~100–200 רשומות/כרטיס ([PERF_BASELINE.md](./PERF_BASELINE.md) — Firebase Cost Risk Baseline).  
**Repo (מאי 2026):** `HEAD` **`55cbaef`** — working tree נקי; **build/lint/test gate PASS** ([PERF_BASELINE.md](./PERF_BASELINE.md) — Repo verification gate). **לא** בוצע deploy; **2D-1** לא התחיל.  
שלב חדש **לא** מתחיל בלי אישור מפורש (כולל **2D-1**).

### אימות 2B-4 (בוצע בפועל)

| בדיקה | תוצאה |
|--------|--------|
| `acceptInvitation` Callable | נפרס — auth חובה |
| Join Preview — אורח | «כניסה עם Google», `prompt: select_account`, accept אוטומטי אחרי login |
| Join Preview — מחובר מראש | «מחובר כ־{displayName}», **ללא** accept אוטומטי; «כניסה לכרטיס» בלחיצה |
| join intent | sessionStorage — accept אוטומטי **רק** אחרי לחיצה על כניסה |
| redirect | `/app/cards/{cardId}` |
| participant שני | תקין, `canInvite: false`, אין כפילות |
| invitation | `accepted` + שדות accept |
| audit | `invitation.accepted`, `participant.added` |
| מסך כרטיס — 2 participants | «הכרטיס מחובר» (לא CTA הזמנה) |
| entries / balances | ללא שינוי |

### Security / Auth / Query Audit (נסגר)

**רקע:** חשד שמשתמש B רואה בדשבורד את כל כרטיסי A אחרי `acceptInvitation`.

| בדיקה | תוצאה |
|--------|--------|
| `listUserCards` | מסונן: `collectionGroup(participants)` + `uid` + `status active` — לא לפי owner |
| Firestore Rules | תקינות — read לכרטיס רק participant פעיל |
| `acceptInvitation` | participant רק ב-`accountCards/{cardId}/participants/{uid}` |
| `DevAuthIdentity` | development — שם + email (לא UID) |
| dashboard race | תוקן — ריקון state + ביטול בקשה בהחלפת `authUid` |
| בדיקת A/B | **עברה** — B ב-Incognito, באנר dev = B, **כרטיס אחד** בלבד |
| פרצת הרשאות | **לא אותרה** |

**מסקנה:** התנהגות חשודה = בדיקה באותו חשבון Google / cache UI. אחרי תיקון + A/B — תקין.

### אימות 2C-1 (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| מודל: «מה לעדכן בחשבון?» + זיכוי/חיוב | ✓ |
| `createEntry` → `pending`, `pendingBalanceImpact` | ✓ |
| `officialBalance` ללא שינוי | ✓ |
| רשימה לשני הצדדים, ללא אשר/דחה | ✓ |
| copy יתרה: **יתרה בכרטיס** / ממתין נפרד | ✓ |
| perf `[perf]` ב-dev (`__perfReport()`) | ✓ |

**2C-1:** [STAGE2C-1_CREATE_PENDING_ENTRY.md](./STAGE2C-1_CREATE_PENDING_ENTRY.md) — **מאושר ונסגר**

### אימות 2C-2 (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| B מאשר → `approved`, `officialBalance` מתעדכן | ✓ |
| B דוחה → `rejected`, `officialBalance` ללא שינוי | ✓ |
| `pendingBalanceImpact` יורד באישור ובדחייה | ✓ |
| יוצר לא מאשר/דוחה לעצמו | ✓ |
| אישור כפול / דחייה אחרי אישור — חסום | ✓ |
| Truth Dataset | ✓ |

**2C-2:** [STAGE2C-2_APPROVE_REJECT.md](./STAGE2C-2_APPROVE_REJECT.md) — **מאושר ונסגר**

### אימות 2C-3 (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| יוצר — כפתור **ביטול** על pending שלו בלבד | ✓ |
| `cancelEntry` → `cancelled` | ✓ |
| `pendingBalanceImpact` יורד; `officialBalance` ללא שינוי | ✓ |
| צד שני רואה **בוטל**; לא מבטל רשומה של יוצר | ✓ |
| ביטול כפול / approved / rejected / זר — חסום | ✓ |
| approve/reject ללא שבירה; Rules ללא שינוי | ✓ |

**2C-3:** [STAGE2C-3_CANCEL_PENDING_ENTRY.md](./STAGE2C-3_CANCEL_PENDING_ENTRY.md) — **מאושר ונסגר**

### אימות 2C-4 (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| `editEntry` — יוצר + `pending` בלבד | ✓ |
| זיכוי 500→300, 300→חיוב 200; `pendingBalanceImpact` נכון | ✓ |
| `officialBalance` ללא שינוי בעריכה | ✓ |
| נשאר `pending`; צד שני רואה עדכון; ללא כפתור עריכה לצד שני | ✓ |
| approved / rejected / cancelled — לא ניתנים לעריכה | ✓ |
| שמירה ללא שינוי — «לא בוצע שינוי»; ללא audit / `editCount` | ✓ |
| עריכה אמיתית — `editCount` + audit `entry.edited` | ✓ |
| Rules ללא שינוי; אין write מה-client | ✓ |

**2C-4:** [STAGE2C-4_EDIT_PENDING_ENTRY.md](./STAGE2C-4_EDIT_PENDING_ENTRY.md) — **מאושר ונסגר**

### אימות 2D-0 (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| Vitest foundation ל-Functions | ✓ |
| `npm run test:functions` | ✓ — בדיקת יחידה ל-`entryIntent` / `balanceDelta` |
| `npm run test:functions:emulator` | ✓ — Firestore Emulator עלה; `createEntry` smoke עבר; `pendingBalanceImpact` עודכן |
| `npm run test:rules` | ✓ — כתיבת קליינט ל-`entries` נחסמה |
| `npm run test:all` | ✓ — unit + emulator smoke + rules |
| Java 21 / Temurin | ✓ — דרישת Emulator מתועדת |
| שינוי התנהגות מוצר | לא בוצע |
| שינוי Rules | לא בוצע |
| deploy | לא בוצע |
| 2D-1 | לא התחיל |

**2D-0:** [STAGE2D_RELIABILITY_PRODUCT_SAFETY.md](./STAGE2D_RELIABILITY_PRODUCT_SAFETY.md) — **סגור**

### אימות 2D-P1A (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| `createEntry` מחזיר יתרות מהשרת | ✓ |
| אחרי create: `[P1A] branch: "light"` | ✓ |
| post-create: `listEntries` בלבד (ללא `getCardPageContext`) | ✓ |
| `officialBalance` ללא שינוי; `pendingBalanceImpact` מתעדכן | ✓ |
| fallback A/B/C לא אחרי create מוצלח | ✓ |
| `contextRef` — תיקון Branch B שגוי | ✓ |
| approve/reject/cancel/edit | מועבר ל-**2D-P1B** |

**2D-P1A:** [STAGE2D-P1A_LIGHT_REFRESH_CREATE.md](./STAGE2D-P1A_LIGHT_REFRESH_CREATE.md) — **סגור (PASS)**  
**ביצועים:** [PERF_BASELINE.md](./PERF_BASELINE.md)

### אימות 2D-P1B (סגירה)

| בדיקה | תוצאה |
|--------|--------|
| ארבעת Callables מחזירים `readEntryMutationBalances` | ✓ |
| `refreshAfterEntryMutation` — patch + `listEntries` | ✓ |
| post-mutation: ללא `getCardPageContext` בחלון 3–5s | ✓ (create, approve, edit — עשן ידני) |
| UI מתעדכן; ללא loading תקוע / כפילות פעולה | ✓ |
| **createEntry** רגרסיה P1A | ✓ עשן ידני |
| **approveEntry** | ✓ עשן ידני |
| **editEntry** | ✓ עשן ידני |
| **rejectEntry** | ✓ כיסוי קוד + מסלול משותף — **לא** עשן ידני בדפדפן |
| **cancelEntry** | ✓ כיסוי קוד + מסלול משותף — **לא** עשן ידני בדפדפן |
| Rules / audit / permission math | ללא שינוי |
| deploy ארבע Functions P1B | ✓ `europe-west1` |

**2D-P1B:** [STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md](./STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md) — **מיושם + deployed + QA סגור (PASS)**  
**ביצועים:** [PERF_BASELINE.md](./PERF_BASELINE.md) — סעיף P1B

### אימות Repo — build / lint / test gate (מאי 2026)

אחרי סגירת commits מפוצלים (docs, Functions, app, PWA, root package) עד **`55cbaef`**.

| בדיקה | תוצאה |
|--------|--------|
| `git status` | נקי |
| `npm run lint` | ✓ PASS |
| `npm run build` | ✓ PASS |
| `npm run test:functions` | ✓ PASS (unit — `entryIntent`) |
| `npm run test:rules` | ✓ PASS (Firestore Emulator + Rules deny-write ל-`entries`) |
| `npm run test:functions:emulator` | ✓ PASS (`createEntry` smoke) |
| Firestore Emulator | נדרש ל-`test:rules` ול-`test:functions:emulator` (`firebase emulators:exec --only firestore`) |
| `firestore-debug.log` | ב-`.gitignore` — לא ב-repo |
| deploy | **לא** בוצע במסגרת gate זה |
| **2D-1** | **לא** התחיל |

## Stages שהושלמו

| Stage | תוכן |
|-------|------|
| **0–1** | יסוד, Auth |
| **2A** | כרטיסים (היסטוריית client batch) |
| **2B-0** | Functions `health` |
| **2B-1** | `createAccountCard` בשרת |
| **2B-2 + 2B-2.1** | `createInvitation`, claim-on-accept, wa.me, תוקף הזמנה **30 יום** |
| **2B-3** | Join Preview — סגור |
| **2B-4** | `acceptInvitation`, Join UX/Auth, מצב שיתוף בכרטיס — **מאושר ונסגר** |
| **2C-1** | `createEntry`, זיכוי/חיוב, pending, `pendingBalanceImpact` — **סגור** |
| **2C-2** | `approveEntry`, `rejectEntry`, UI אישור/דחייה, `officialBalance` באישור — **סגור** |
| **2C-3** | `cancelEntry`, UI ביטול, תג בוטל — **סגור** |
| **2C-4** | `editEntry`, UI עריכה, `entry.edited`, `editCount` — **סגור** |
| **2D-0** | Test Harness Foundation — Vitest, Firestore Emulator smoke, Rules deny-write — **סגור** |
| **2D-P1A** | Light refresh אחרי `createEntry` — יתרות ב-response + patch + `listEntries` — **סגור** |
| **2D-P1B** | Light refresh אחרי approve/reject/cancel/edit — אותו דפוס + `refreshAfterEntryMutation` — **סגור** |

## Firebase

- **פרויקט:** `account-card-18e3a`
- **Functions:** `health`, `createAccountCard`, `createInvitation`, `getInvitationPreview`, `acceptInvitation`, `createEntry`, `approveEntry`, `rejectEntry`, `cancelEntry`, **`editEntry`** — `europe-west1` (P1B: ארבעת mutations עם תשובת יתרות — deployed)

## מה לא לבנות עכשיו

- עריכת רשומות **approved** / **rejected** / **cancelled** (מחוץ להיקף — רשומת תיקון עתידית)
- PDF, PWA 2B-6, Mockup 2B-3.1
- שלב 2C חדש או **2D-1** — **רק באישור מפורש**

## השלב הבא

**2D-1 — Balance & Permission Function Tests** — מסלול בדיקות Functions מומלץ — **לא מתחילים בלי אישור מפורש**.

## מסמכים

| מסמך | תוכן |
|------|------|
| [STAGE2B-4_ACCEPT_INVITATION.md](./STAGE2B-4_ACCEPT_INVITATION.md) | Accept — סגור |
| [STAGE2C-1_CREATE_PENDING_ENTRY.md](./STAGE2C-1_CREATE_PENDING_ENTRY.md) | 2C-1 — סגור |
| [STAGE2C-2_APPROVE_REJECT.md](./STAGE2C-2_APPROVE_REJECT.md) | 2C-2 — סגור |
| [STAGE2C-3_CANCEL_PENDING_ENTRY.md](./STAGE2C-3_CANCEL_PENDING_ENTRY.md) | 2C-3 — סגור |
| [STAGE2C-4_EDIT_PENDING_ENTRY.md](./STAGE2C-4_EDIT_PENDING_ENTRY.md) | 2C-4 — סגור |
| [STAGE2C_ENTRIES.md](./STAGE2C_ENTRIES.md) | Entries — תכנון 2C מלא |
| [STAGE2D_RELIABILITY_PRODUCT_SAFETY.md](./STAGE2D_RELIABILITY_PRODUCT_SAFETY.md) | Reliability / בדיקות — 2D-0 סגור |
| [STAGE2D-P1A_LIGHT_REFRESH_CREATE.md](./STAGE2D-P1A_LIGHT_REFRESH_CREATE.md) | 2D-P1A — סגור |
| [STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md](./STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md) | 2D-P1B — סגור |
| [PERF_BASELINE.md](./PERF_BASELINE.md) | מדידות ביצועים (dev) |
| [TRUTH_DATASET.md](./TRUTH_DATASET.md) | רגרסיה יתרות Yossi/Stav |
| [STAGE2B-3_JOIN_PREVIEW.md](./STAGE2B-3_JOIN_PREVIEW.md) | Join preview — סגור |
| [ROADMAP.md](./ROADMAP.md) | Roadmap |
