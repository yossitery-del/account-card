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

| מדד נוכחי (מאי 2026) | סטטוס |
|----------------------|--------|
| **Production URL** | https://account-card-prod.vercel.app |
| **HEAD בפרודקשן (Vercel)** | `5aadf63` |
| **עלות Firebase** | סיכון MVP **LOW**; pagination עתידי ~100–200 רשומות/כרטיס — [PERF_BASELINE.md](./PERF_BASELINE.md) |
| **Repo gate** | lint / build / test PASS @ `610815f` — [PERF_BASELINE.md](./PERF_BASELINE.md) |
| **Production UI** | **Vercel** — deploy **PASS**; smoke **PASS** — [DEPLOY_HOSTING.md](./DEPLOY_HOSTING.md) |
| **Backend** | Firebase `account-card-18e3a` · Functions `europe-west1` |
| **Deploy preflight** | **READY WITH WARNINGS** (לפני עלייה ראשונה) — [DEPLOY_HOSTING.md](./DEPLOY_HOSTING.md) |
| **שינוי deploy אחרי smoke** | **לא** |
| **2D-1** | **לא** התחיל |

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

### Deploy Preflight Audit (מאי 2026)

**מסקנה:** **READY WITH WARNINGS** @ `5ab6a7f`. פירוט — [DEPLOY_HOSTING.md](./DEPLOY_HOSTING.md).

### Production Smoke — PASS (מאי 2026)

**מארח:** https://account-card-prod.vercel.app · **HEAD:** `5aadf63` · **לא** שינוי deploy אחרי smoke · **2D-1** לא התחיל.

| בדיקה | תוצאה |
|--------|--------|
| Vercel deploy | ✓ PASS |
| Login | ✓ PASS |
| Dashboard / גישה לכרטיס | ✓ PASS |
| `createEntry` | ✓ PASS (~**1.76s**) |
| `approveEntry` | ✓ PASS (~**2.43s**) |
| רענון Firestore (ערוץ/קריאה) | ~**180–200ms** |
| `inviteLink` host | https://account-card-prod.vercel.app — **לא** localhost |

**ביצועים:** latency נוכחית **סבירה ל-MVP**; איטיות מורגשת — מעקב נפרד UX/performance (לא חוסם production). פירוט — [DEPLOY_HOSTING.md](./DEPLOY_HOSTING.md).

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

## Post-pilot UX backlog

> **תיעוד בלבד — לא ליישם לפני סיום פיילוט ואישור מפוצה.** לא מחליף שלבים פתוחים (למשל **2D-1**). רשימת זיכרון למוצר — ללא שינוי קוד ב-repo לפי סעיף זה.

### 1. תווית כרטיס אישית לכל משתתף («rename for me»)

**מצב פיילוט (היום):** האפליקציה גוזרת כותרת תצוגה לצופה. אם יש בדיוק שני משתתפים פעילים — מוצג `displayName` של הצד השני; אחרת fallback ל־`accountCards.title`, ואז ל־«כרטיס».

**מטרה אחרי פיילוט:** כל משתתף יוכל לבחור **תווית אישית** לאותו כרטיס, בלי לשנות מה שהצד השני רואה.

**דוגמה:** יוסי קורא לכרטיס «שמעון עבודה» או «ספק מזוזות»; שמעון לאותו כרטיס «יוסי» או «מהדרין». התוויות אישיות בלבד — **לא** משנות יתרות, רשומות, אישורים, או תצוגת הצד השני.

**הצעת מודל נתונים (עתידי):** `accountCards/{cardId}/participants/{uid}.labelForMe`

**כללי Rules (כיוון עתידי):** משתמש רק מעדכן את `labelForMe` על המסמך **שלו** תחת `participants/{uid}`.

**סדר עדיפות בתצוגה (דשבורד + מסך כרטיס):**

1. `labelForMe` (אם מוגדר)
2. `displayName` של המשתתף השני (כשיש שני פעילים — כמו היום)
3. `accountCards.title`
4. «כרטיס»

**השפעות:** שינוי `labelForMe` **לא** אמור ליצור השלכות פיננסיות / זרימות אישור; אופציונלי בעתיד: audit קל / הערת פרופיל בלבד.

---

### 2. שיתוף כרטיס לצד שלישי בוואטסאפ (לא הזמנה)

**הבחנה חשובה:** זה **לא** הזמנת צד שלישי כמשתתף. זה **שיתוף / ייצוא** של תצוגה או סיכום מבוקר של הכרטיס.

**שימושים אפשריים:** רואה חשבון; מנהל; מי שצריך לעיין בלי להצטרף; הוכחה / סיכום יתרה בלי הרשאות עריכה או אישור.

**כיוון מוצר ראשוני (אחרי פיילוט):** פעולה מסוג «שיתוף כרטיס» / «שליחה בוואטסאפ» — התוכן המשותף חייב להיות **מבוקר, ברור, ובטוח פרטיות**.

**עקרונות:**

- הצד השלישי **לא** מקבל הרשאות משתתף אלא אם יוזם זרימת הזמנה נפרדת במפורש.
- לא לחשוף מזהים פנימיים / מוסתרים; **לא** לכלול טוקני הזמנה.
- לא לאפשר לאישור / עריכה / מחיקה לצד שלישי.
- להבהיר בבירור שזה **סנאפשוט / שיתוף**, לא הצטרפות לכרטיס.
- לשקול בעתיד האם נדרש אישור **משני המשתתפים** לפני שיתוף רגיש.

**אפשרויות לשלבים עתידיים (לבחירה מאוחר יותר):**

- A. טקסט וואטסאפ פשוט (סיכום)
- B. PDF / תמונת שיתוף
- C. קישור read-only מאובטח עם תפוגה
- D. שילוב בשלבים

**חקירה מומלצת לפני V1:**

1. אילו שדות מותרים בשיתוף לצד שלישי.
2. האם שיתוף דורש אישור מהצד השני.
3. V1 מינימלי: סיכום טקסט בוואטסאפ **או** PDF סנאפשוט — **ללא** login לצד שלישי, **ללא** הרשאות עריכה.
4. קישור read-only מאובטח — רק בשלב מאוחר יותר.

---

## Firebase (Functions)

- **Callables (`europe-west1`):** `health`, `createAccountCard`, `createInvitation`, `getInvitationPreview`, `acceptInvitation`, `createEntry`, `approveEntry`, `rejectEntry`, `cancelEntry`, **`editEntry`**
- **Production UI:** https://account-card-prod.vercel.app (`5aadf63`) — smoke PASS; `APP_BASE_URL` / הזמנות — [DEPLOY_HOSTING.md](./DEPLOY_HOSTING.md)

## מה לא לבנות עכשיו

- עריכת רשומות **approved** / **rejected** / **cancelled** (מחוץ להיקף — רשומת תיקון עתידית)
- PDF, PWA 2B-6, Mockup 2B-3.1
- שלב 2C חדש או **2D-1** — **רק באישור מפורש**

## השלב הבא

**Production:** עלה ל-Vercel — smoke ראשון **PASS** ([DEPLOY_HOSTING.md](./DEPLOY_HOSTING.md)). **לא** שינוי deploy אחרי smoke.  
**2D-1 — Balance & Permission Function Tests** — **לא מתחילים בלי אישור מפורש**.

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
| [DEPLOY_HOSTING.md](./DEPLOY_HOSTING.md) | החלטת hosting — Vercel + Firebase |
