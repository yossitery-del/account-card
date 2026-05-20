# Stage 2B-3 — Join Preview

**סטטוס:** **מאושר, נסגר ונבדק** (יושם בפועל — QA סגירה מאי 2026).

## מטרה

דף **`/join/[token]`** — מי שקיבל קישור הזמנה רואה **Preview מוגבל**, פרימיום וברור, **בלי** מידע רגיש, **לפני** הצטרפות בפועל.

## מה נבנה

| רכיב | פירוט |
|------|--------|
| **Callable** | `getInvitationPreview` — `europe-west1`, ללא auth חובה |
| **חיפוש** | `collectionGroup("invitations").where("tokenHash","==", SHA-256(token)).limit(1)` |
| **Client** | `src/lib/invitations/getInvitationPreview.ts`, `callGetInvitationPreviewFunction` |
| **UI** | `src/app/join/[token]/page.tsx`, `JoinPreviewScreen` — vault/glass, RTL, עברית |
| **Auth** | «כניסה לכרטיס» → `signInWithGoogle`, נשארים על `/join/[token]`, re-fetch preview |
| **מחובר + valid** | «הכרטיס המלא ייפתח בכניסה.» + כפתור «כניסה לכרטיס» **disabled** (פעיל ב-2B-4) |

## מה לא נבנה (מכוון)

- `acceptInvitation`, participant שני, עדכון invitation ל-`accepted`
- entries, approve/reject, balance engine, PDF, encryption מלאה
- analytics, WhatsApp Business API, Email/SMS אוטומטי

**הצטרפות מלאה:** Stage **2B-4** — רק באישור «מאושר — בצע 2B-4».

---

## למה Preview מוגבל

קישור ההזמנה עלול להישלח בטעות, להידלף, או להיפתח לפני כניסה מאובטחת. Preview נותן הקשר אנושי (מי הזמין) בלי לחשוף את הכרטיס, יתרות, משתתפים או מזהים פנימיים. כל הנתונים הרגישים נפתחים רק אחרי Google Sign-In ובשלב Accept (2B-4).

### פרטים שלא נחשפים (לא ב-API ולא ב-UI)

- `cardId`, `inviteId`, `token`, `tokenHash`
- UID יוצר / מוזמן
- שם כרטיס מלא, יתרות, entries, פעולות
- אימיילים, משתתפים נוספים

### Output מותר (`getInvitationPreview`)

```typescript
{
  status: "valid" | "expired" | "accepted" | "revoked" | "invalid";
  inviterDisplayName?: string;
  expiresAt?: string; // ISO, כש-valid
}
```

---

## Function — `getInvitationPreview`

| פריט | ערך |
|------|-----|
| קובץ | `functions/src/invitations/getInvitationPreview.ts` |
| Auth | לא חובה |
| Input | `{ token: string }` — ולידציה ב-`parseInviteToken` |
| לוגיקת status | לא נמצא → `invalid`; פג → `expired`; `accepted` / `revoked`; אחרת `pending` שלא פג → `valid` |
| `inviterDisplayName` | מ-`users/{createdByUid}.displayName` (Admin read) |

---

## Index — `tokenHash` (collection group)

שאילתת CG עם equality על שדה בודד (`tokenHash`) **לא דורשת** composite index ב-`firestore.indexes.json`.

ניסיון deploy:

```bash
firebase deploy --only firestore:indexes
```

החזיר: *«this index is not necessary, configure using single field index controls»* — Firestore מטפל ב-single-field index אוטומטית ל-CG.

**ב-repo:** לא נשאר entry מיותר ל-`invitations.tokenHash` (נמנע שגיאת deploy חוזרת). Index קיים ל-`participants` (uid + status) ללא שינוי.

---

## UI — נוסח סופי (copy/design)

מקור: `src/lib/invitations/joinPreviewCopy.ts`, `JoinPreviewScreen.tsx`.

### `valid` — לא מחובר

| רכיב | נוסח |
|------|------|
| כותרת ראשית | כרטיס חשבון משותף |
| שורה משנית (אם יש שם שולח) | נשלח מ־{inviterDisplayName} |
| טקסט ערך | מקום מסודר לתיעוד חיובים והחזרים בין שני צדדים. כל פעולה נשמרת, וכל אישור מתועד. |
| מעל הכפתור | כניסה אישית מאובטחת |
| כפתור | כניסה לכרטיס → `signInWithGoogle` |
| מתחת לכפתור | עם Google |

**לא מוצג:** «הפרטים המלאים ייפתחו לאחר כניסה מאובטחת.»; הנוסח הארוך על Google.

### `valid` — מחובר (2B-3)

| רכיב | נוסח / מצב |
|------|------------|
| טקסט | הכרטיס המלא ייפתח בכניסה. |
| כפתור | כניסה לכרטיס — **disabled** (ללא `acceptInvitation`) |
| ב-2B-4 | אותו כפתור יהפוך **פעיל** ויקרא ל-`acceptInvitation` |

**לא מוצג:** «שלב הבא», «הצטרפות מלאה», «אתה מחובר».

### שגיאות

| status | הודעה |
|--------|--------|
| `invalid` | ההזמנה לא תקפה או שכבר אינה זמינה. |
| `expired` | ההזמנה פגה. אפשר לבקש קישור חדש מהשולח. |
| `accepted` | ההזמנה כבר נוצלה. |
| `revoked` | ההזמנה בוטלה. |

+ «חזרה לעמוד הראשי» — ללא פרטים נוספים, ללא token ב-UI.

---

## Auth flow

1. `/join/{token}` → קריאה ל-`getInvitationPreview` (ללא login)
2. `valid` + אורח → «כניסה לכרטיס» → `signInWithPopup` (Google)
3. אחרי login — אותו URL, re-fetch preview
4. Client **לא** קורא Firestore ל-`invitations` — רק Callable

---

## קבצים

```
functions/src/invitations/getInvitationPreview.ts
functions/src/lib/parseInviteToken.ts
functions/src/index.ts

src/app/join/[token]/page.tsx
src/components/join/JoinPreviewScreen.tsx
src/lib/invitations/getInvitationPreview.ts
src/lib/invitations/joinPreviewCopy.ts
src/lib/firebase/functions.ts
src/types/invitation.ts
```

---

## איך לבדוק

```bash
npm run build && npm run lint
cd functions && npm run build && npm run lint
firebase deploy --only functions
```

1. צור הזמנה מכרטיס קיים → פתח `inviteLink` (`/join/{token}`)
2. `valid` — טקסט preview; Network — אין `cardId` / `inviteId` / balances
3. token אקראי → `invalid`
4. ב-Console: `expiresAt` בעבר / `status: accepted|revoked` → הודעות מתאימות
5. Google login מ-join — נשארים על אותו token; מחובר → «הכרטיס המלא ייפתח בכניסה.» + כפתור disabled
6. Firestore — **לא** נוצר participant שני; invitation נשאר `pending`
7. אין טקסטים טכניים («שלב הבא» / «הצטרפות מלאה») ב-UI

---

## APP_BASE_URL בפיתוח

`inviteLink` נבנה מ-`APP_BASE_URL` (ברירת מחדל `http://localhost:3000` ב-`functions/.env`).

**חובה:** הפורט ב-`APP_BASE_URL` חייב להתאים לפורט שבו רץ `npm run dev` (למשל 3000 או 3001).  
אם הקישור מצביע על 3000 אבל האפליקציה על 3001 — פתיחה ידנית עם הפורט הנכון עדיין אמורה לעבוד; `getInvitationPreview` לא תלוי ב-port.

## תיקון Join Preview (2B-3)

| בעיה | תיקון |
|------|--------|
| Callable Gen2 ללא auth | `invoker: "public"` על `getInvitationPreview` |
| שגיאת CG / Firestore | `fieldOverrides` ל-`invitations.tokenHash` + try/catch → `invalid` |
| שגיאת רשת מוסתרת | לוג dev: `tokenPrefix`, `code`, `status` |
| token ב-URL | `tokenFromJoinUrl` + `decodeURIComponent` |

## Deploy שבוצע

- `firebase deploy --only functions` — **הצלחה** (`getInvitationPreview` נוצר)
- `firestore.indexes.json` — `fieldOverrides` ל-CG `tokenHash` (deploy indexes אם נדרש)

---

## סגירת Stage 2B-3

| פריט | מצב |
|------|-----|
| Join Preview עובד | מאומת בדפדפן |
| copy/design סופי | מאושר |
| מצב מחובר | כפתור «כניסה לכרטיס» disabled — תקין ל-2B-3 |
| `acceptInvitation` | **נדחה ל-2B-4** |
| participant / invitation | ללא שינוי |

---

## השלב הבא

**2B-4 — Accept Invitation** — Callable `acceptInvitation`, participant שני, invitation → `accepted`, כפתור «כניסה לכרטיס» פעיל במצב מחובר.

**לא להתחיל בלי אישור מפורש:** «מאושר — בצע 2B-4».

---

## המשך עתידי — Stage 2B-3.1 Join Preview Visual Mockup

**סטטוס:** **Future / Not Now** — **לא לבנות עכשיו.**  
**תנאי:** רק **אחרי** ש-Join Preview (2B-3) עובד ויציב בפרודקשן.  
**לא משנה** את 2B-3 הנוכחי — שכבת UI אופציונלית מעל אותו דף.

### מטרה

ב-`/join/[token]` — מעבר לטקסט ה-Preview המוגבל, **הצצה ויזואלית** ל-Mockup פרימיום של דשבורד «הכרטיסים שלי», עם 6–8 כרטיסי דמה, כדי שהמוזמן יבין ש«כרטיס חשבון» מתאים גם ללקוחות, ספקים, חברים, משפחה וקבלני משנה — לא רק לצד הנוכחי בהזמנה.

### כיוון UI (תכנון)

| רכיב | תוכן |
|------|------|
| אזור | Mockup קטן, mobile-first, vault/glass |
| כותרת דמה | «הכרטיסים שלי» (או דומה) |
| כרטיסים | 6–8 — שמות דמה: «ספק איתי», «לקוח דוד», «קבלן משנה», «משפחה», «חבר», «שותף לפרויקט» |
| סטטוסים | «מאוזן», «ממתין לאישור», «יתרה רשמית» |
| תווית | «דוגמה להמחשה בלבד» |

### עקרונות

- לא להעמיס; לא טבלת אקסל; לא הנהלת חשבונות
- premium, עברית טבעית, הצצה לאפליקציה אמיתית

### מטרה שיווקית

*«זה בדיוק מה שאני צריך גם עם עוד אנשים.»*

### גבולות פרטיות (חובה)

- **לא** כרטיסים / שמות / סכומים **אמיתיים** של משתמש
- **לא** הרחבת `getInvitationPreview` לנתוני דשבורד (אלא אם יאושר בשלב נפרד)
- Mockup **סטטי** בקוד או assets — ללא קריאה ל-Firestore של כרטיסים אחרים

### Roadmap

רשום ב-[ROADMAP.md](./ROADMAP.md) תחת **Stage 2B-3.1** ו-[PROJECT_STATE.md](./PROJECT_STATE.md) תחת «מה לא לבנות עכשיו».
