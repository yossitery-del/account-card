# Roadmap — כרטיס חשבון

מסמך תכנון בלבד. שלבים עתידיים **לא נבנים** עד אישור מפורש.

## סטטוס כללי (מאי 2026)

| Stage | סטטוס |
|-------|--------|
| 0 — יסוד | הושלם |
| 1 — Auth | הושלם |
| 2A — כרטיסים (client batch → הוחלף) | הושלם |
| 2B-0 — Functions foundation | מאושר |
| 2B-1 — Server Create Card | מאושר |
| 2B-2 + 2B-2.1 — Invitation Token | מאושר |
| 2B-3 — Join Preview | מאושר |
| **2B-3.1 — Join Preview Visual Mockup** | **Future / Not Now** |
| 2B-4 — Accept Invitation | מאושר ונסגר |
| 2B-5 — WhatsApp Share UX | חלקי (wa.me ב-2B-2.1) |
| **2B-6 — PWA Onboarding** | **מתוכנן (עתידי)** |
| **2C-1 — Create Pending Entry** | **סגור (QA עבר)** |
| **2C-2 — Approve / Reject** | **סגור (QA עבר)** ([מסמך](STAGE2C-2_APPROVE_REJECT.md)) |
| **2C-3 — Cancel Pending Entry** | **סגור (QA עבר)** ([מסמך](STAGE2C-3_CANCEL_PENDING_ENTRY.md)) |
| **2C-4 — Edit Pending Entry** | **סגור (QA עבר)** |
| **2D-0 — Test Harness Foundation** | **סגור** — Vitest + Firestore Emulator smoke + Rules smoke |
| **2D-P1A — Light Refresh (createEntry)** | **סגור (QA PASS)** — [מסמך](STAGE2D-P1A_LIGHT_REFRESH_CREATE.md) |
| **2D-P1B — Light Refresh (approve/reject/cancel/edit)** | **מיושם + deployed — סגור (QA PASS)** — [מסמך](STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md) |
| **2D-1 — Balance & Permission Function Tests** | **הבא מומלץ** — לא להתחיל בלי אישור מפורש |
| **Production hosting** | **נעול** — UI **Vercel**; Backend **Firebase** `account-card-18e3a` — [DEPLOY_HOSTING.md](DEPLOY_HOSTING.md) |
| 2C+ | PDF, encryption, תצוגות מתקדמות — עתידי |

**פעיל עכשיו:** **אין שלב מוצר פתוח** — מעגל pending (2C) סגור; 2D-0, 2D-P1A, 2D-P1B סגורים. שלב חדש (כולל 2D-1) רק באישור מפורש.  
**Production UI:** Vercel — **לא** Firebase Hosting / App Hosting / VPS (MVP). Deploy production **לא** בוצע (תיעוד בלבד).  
**2B-3.1** — רק אחרי ש-Join Preview יציב; **לא לבנות עכשיו**.

---

## Stage 2B — פירוק תת־שלבים

| שלב | מטרה | תלות |
|-----|------|------|
| **2B-0** | Blaze + `health` Callable | — |
| **2B-1** | `createAccountCard` בשרת + audit + Rules deny client create | 2B-0 |
| **2B-2** | Invitation token (יצירה בשרת) | 2B-1 |
| **2B-3** | Join preview (`/join/[token]`) לפני login | 2B-2 |
| **2B-3.1** | Join preview — Mockup ויזואלי לדשבורד (דמה בלבד) | **2B-3 יציב** |
| **2B-4** | `acceptInvitation` — צד שני מצטרף | 2B-3 סגור |
| **2B-5** | WhatsApp Share UX (`wa.me` intent, לא Business API) | 2B-2+ (inviteLink) |
| **2B-6** | PWA Onboarding / Add to Home Screen | **2B-4** (אחרי הצטרפות מוצלחת) |

### Stage 2B-4 — Accept Invitation

**סטטוס:** **מאושר ונסגר** — QA ידני עבר (accept, Join Google/intent, מסך כרטיס מחובר).

פירוט: [STAGE2B-4_ACCEPT_INVITATION.md](./STAGE2B-4_ACCEPT_INVITATION.md).

---

### Stage 2C — Entries / Pending Records

**2C-1:** **סגור** — QA עבר, copy זיכוי/חיוב, [STAGE2C-1_CREATE_PENDING_ENTRY.md](./STAGE2C-1_CREATE_PENDING_ENTRY.md).  
**2C-2:** **סגור** — QA עבר, `approveEntry`/`rejectEntry`, [STAGE2C-2_APPROVE_REJECT.md](./STAGE2C-2_APPROVE_REJECT.md).  
**2C-3:** **סגור** — `cancelEntry`. **2C-4:** **סגור** — `editEntry`, QA עבר.

פירוט מלא: [STAGE2C_ENTRIES.md](./STAGE2C_ENTRIES.md).  
רגרסיה: [TRUTH_DATASET.md](./TRUTH_DATASET.md).

תת־שלבים: ~~2C-1~~ → ~~2C-2~~ → ~~2C-3~~ → ~~2C-4~~ — **מעגל pending סגור**.

#### החלטה מקצועית (סדר עבודה)

- **לא** מוסיפים עריכת סכום/סוג ל-**2C-2** — 2C-2 הוא approve/reject בלבד.
- קודם סיום QA של approve/reject (**בוצע — 2C-2 סגור**).
- אחר כך **ניהול רשומות pending**: ביטול (2C-3), ואז תיקון לפני אישור (2C-4).

#### Stage 2C-3 — Cancel Pending Entry

**סטטוס:** **סגור** — QA עבר.

**מסמך:** [STAGE2C-3_CANCEL_PENDING_ENTRY.md](./STAGE2C-3_CANCEL_PENDING_ENTRY.md).

**מטרה:** יוצר מבטל רשומה `pending` — `cancelEntry`; UI **ביטול**; תג **בוטל**; ללא שינוי `officialBalance`.

#### Stage 2C-4 — Edit Pending Entry

**סטטוס:** **סגור** — QA ידני עבר.

**מסמך:** [STAGE2C-4_EDIT_PENDING_ENTRY.md](./STAGE2C-4_EDIT_PENDING_ENTRY.md).

**מיושם:** `editEntry`; UI **עריכה** + **ביטול** ליוצר; `pendingBalanceImpact += (deltaAfter - deltaBefore)`; `officialBalance` ללא שינוי; **approved / rejected / cancelled לא נערכים**.

---

### Stage 2D — Reliability / Product Safety

**2D-0:** **סגור** — תשתית בדיקות מינימלית פעילה.

מה נסגר ב-2D-0:

- Vitest ל-Functions.
- בדיקת יחידה ל-`entryIntent` / `balanceDelta`.
- בדיקת עשן מול Firestore Emulator ל-`createEntry`.
- בדיקת Firestore Rules שמוודאת שכתיבת קליינט ל-`entries` נחסמת.
- דרישת Java 21 / Temurin להפעלת Emulator מתועדת.
- לא שונתה התנהגות מוצר, לא שונתה לוגיקה עסקית, לא בוצע deploy.

**2D-P1A:** **סגור** — light refresh אחרי `createEntry` בלבד (patch יתרות + `listEntries`). מסמך: [STAGE2D-P1A_LIGHT_REFRESH_CREATE.md](./STAGE2D-P1A_LIGHT_REFRESH_CREATE.md). ביצועים: [PERF_BASELINE.md](./PERF_BASELINE.md).

**2D-P1B:** **סגור (QA PASS)** — light refresh ל-`approveEntry`, `rejectEntry`, `cancelEntry`, `editEntry`; `readEntryMutationBalances` + `refreshAfterEntryMutation`. מסמך: [STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md](./STAGE2D-P1B_LIGHT_REFRESH_MUTATIONS.md). ביצועים: [PERF_BASELINE.md](./PERF_BASELINE.md) (סעיף P1B). `rejectEntry` / `cancelEntry`: כיסוי קוד + מסלול משותף — לא עשן ידני בדפדפן (ראה מסמך P1B).

**2D-1:** Balance & Permission Function Tests — **הבא מומלץ** — **לא להתחיל בלי אישור מפורש**.

פירוט: [STAGE2D_RELIABILITY_PRODUCT_SAFETY.md](./STAGE2D_RELIABILITY_PRODUCT_SAFETY.md).

---

## Production deploy — hosting (נעול, מאי 2026)

| נושא | החלטה |
|------|--------|
| **UI** | **Vercel** — Next.js 16 App Router |
| **Backend** | Firebase `account-card-18e3a` — Auth, Firestore, Rules, Indexes, Functions |
| **Functions region** | `europe-west1` |
| **לא בשימוש** | Firebase Hosting block; App Hosting / `apphosting.yaml`; VPS |

**מסמך מלא:** [DEPLOY_HOSTING.md](./DEPLOY_HOSTING.md) — env vars, `APP_BASE_URL`, authorized domains, סדר deploy, smoke.  
**סטטוס:** תיעוד בלבד — **לא** deploy; **2D-1** לא התחיל.

---


### Stage 2B-3.1 — Join Preview Visual Mockup

**סטטוס:** **Future / Not Now** — **לא לבנות עכשיו.**  
**תלות:** אחרי ש-**2B-3 Join Preview** עובד ויציב (כולל תיקון `invoker: public` ו-QA בדפדפן).

#### מטרה

בדף `/join/[token]`, הצד השני לא יראה רק טקסט, אלא **הצצה ויזואלית קצרה** לעולם «כרטיס חשבון» — Mockup פרימיום של דשבורד עם כמה כרטיסים לדוגמה, כדי שיבין מיד שזה כלי רחב שיכול לעזור גם עם לקוחות, ספקים, חברים, משפחה וקבלני משנה.

#### מטרה שיווקית

תחושה אצל מקבל ההזמנה: *«זה בדיוק מה שאני צריך גם עם עוד אנשים.»*

#### כיוון עתידי (UI)

אזור ויזואלי קטן ב-`/join/[token]`:

- Mockup דשבורד «הכרטיסים שלי»
- **6–8** כרטיסים לדוגמה
- **שמות דמה בלבד**, למשל: «ספק איתי», «לקוח דוד», «קבלן משנה», «משפחה», «חבר», «שותף לפרויקט»
- **סטטוסים לדוגמה:** «מאוזן», «ממתין לאישור», «יתרה רשמית»
- תווית: **«דוגמה להמחשה בלבד»**

#### עקרונות UX

- לא להעמיס; לא להיראות כמו הנהלת חשבונות או אקסל
- שפת vault / glass / premium; הצצה לאפליקציה אמיתית
- mobile-first; עברית טבעית ופרימיום

#### גבולות פרטיות (חובה)

| אסור | מותר |
|------|------|
| כרטיסים אמיתיים של משתמש | Mockup סטטי / דמה |
| שמות אמיתיים | שמות דמה בלבד |
| סכומים אמיתיים | סטטוסים/מספרים דמה או ללא סכומים |
| מידע מ-`getInvitationPreview` מעבר לנוכחי | הרחבת API רק אם יאושר בשלב נפרד |

**לא לשנות** את Stage 2B-3 הנוכחי בעת תכנון זה — 2B-3.1 הוא שכבת UI נפרדת.

פירוט נוסף: [STAGE2B-3_JOIN_PREVIEW.md](./STAGE2B-3_JOIN_PREVIEW.md) → המשך עתידי.

---

### הערה אסטרטגית — 2B-6

**2B-6 אינו חלק מ-2B-1, 2B-2, או יצירת כרטיס.**  
מוצג **רק אחרי** שמשתמש הצטרף בהצלחה לכרטיס דרך הזמנה (`acceptInvitation` הצליח).

פירוט מלא: [STAGE2B_INVITE_EXPERIENCE.md](./STAGE2B_INVITE_EXPERIENCE.md) → סעיף PWA Onboarding.

---

## Stage 2B-6 — PWA Onboarding / Add to Home Screen Guidance

**סטטוס:** מתוכנן — **לא לבנות עכשיו.**

### מטרה

לאחר הצטרפות מוצלחת לכרטיס דרך הזמנה, להציג בצורה עדינה וברורה אפשרות להוסיף את **«כרטיס חשבון»** למסך הבית ולהשתמש בו כמו אפליקציה.

### טריגר הצגה

- **אחרי** `acceptInvitation` הצליח (לא אחרי יצירת כרטיס על ידי owner, אלא אחרי join כצד שני — אלא אם יוחלט אחרת באישור שלב).

### נוסח UI (נעול לתכנון)

**כותרת / גוף:**

> רוצה גישה מהירה לכרטיס?  
> אפשר להוסיף את כרטיס חשבון למסך הבית ולהשתמש בו כמו אפליקציה.

**אייפון:**

> באייפון: לחץ על שיתוף ⬆️ ואז «הוסף למסך הבית».

**אנדרואיד:**

- אם הדפדפן תומך ב-PWA install prompt → כפתור התקנה.
- אחרת → הסבר ידני להוספה למסך הבית.

**סגירה:**

- כפתורים: «הבנתי» / «הוספתי למסך הבית»
- ההנחיה **נעלמת** אחרי לחיצה.

### מצב משתמש (Firestore)

ב-`users/{uid}.onboarding` — אחד מהמבנים:

```text
onboarding.pwaInstallHintDismissed: true
```

או:

```text
onboarding.pwaInstall: {
  dismissedAt,
  installIntentClickedAt,
  lastShownAt
}
```

### הגדרות — צפייה חוזרת

תמיד להשאיר דרך לראות שוב את ההדרכה:

> «איך מוסיפים למסך הבית?»

(למשל מתוך מסך הגדרות משתמש.)

### מדידה פנימית (מינימלית, פרטית)

**לא** Google Analytics / Mixpanel / PostHog בשלב זה.  
**לא** איסוף תוכן כרטיסים או יתרות — רק אירועי מערכת:

| אירוע | תיאור |
|--------|--------|
| `invite.opened` | נפתח קישור הזמנה |
| `user.signed_in` | התחברות בהקשר join |
| `invitation.accepted` | הצטרפות הצליחה |
| `pwa_install_hint.shown` | הוצגה הנחיית PWA |
| `pwa_install_intent.clicked` | לחיצה על התקנה / כוונה |
| `pwa_install_hint.dismissed` | «הבנתי» / «הוספתי למסך הבית» |

(שמות סופיים ייקבעו ביישום — כאן תכנון בלבד.)

### מה לא כולל 2B-6

- שינוי manifest / אייקונים סופיים (יכול להיות שלב נפרד)
- Analytics חיצוני
- Push notifications

---

## עתידי — Personal Card Alias (שם כרטיס אישי)

**סטטוס:** רעיון מתועד — **לא לבנות עכשיו**.

כל משתתף יוכל לשנות **אצלו בלבד** איך הכרטיס מופיע ברשימה ובממשק, בלי לשנות את התצוגה אצל הצד השני.

**דוגמה:** צד א' רואה «ספק איתי» · צד ב' רואה «יוסי מהדרין» — אותו `cardId`.

**לא קשור להזמנה:** בשלב הנוכחי יצירת הזמנה ללא שם; alias יתווסף בשלב עתידי נפרד.

---

## מה לא לבנות בלי אישור

accept (2B-4), **Join Preview Visual Mockup (2B-3.1)**, PWA onboarding UI (2B-6), entries, approve/reject, balance engine, PDF, encryption מלאה, KUPA code.

---

## קישורים

- [PROJECT_STATE.md](./PROJECT_STATE.md) — מצב נוכחי
- [STAGE2B_INVITE_EXPERIENCE.md](./STAGE2B_INVITE_EXPERIENCE.md) — חוויית הזמנה + PWA
- [STAGE2B-1_CREATE_CARD.md](./STAGE2B-1_CREATE_CARD.md) — create בשרת (הושלם)
- [STAGE2B-3_JOIN_PREVIEW.md](./STAGE2B-3_JOIN_PREVIEW.md) — join preview (סגור) + המשך 2B-3.1
- [STAGE2B-4_ACCEPT_INVITATION.md](./STAGE2B-4_ACCEPT_INVITATION.md) — accept (תכנון)
