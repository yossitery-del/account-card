# Stage 2B-0 — Firebase Functions Foundation

**סטטוס: מאושר ונסגר** — אימות בפרודקשן בוצע. אין קוד פתוח ב-2B-0.

## אימות שלב (בוצע)

| פריט | תוצאה |
|------|--------|
| Blaze | פעיל על `account-card-18e3a` |
| Deploy | `firebase deploy --only functions` — הצלחה |
| `health` מהלקוח | עובד (כולל מצב מחובר) |
| תשובה מאומתת | `ok: true`, `stage: "2B-0"`, `region: "europe-west1"`, `authenticated: true` |
| Region | `europe-west1` |
| Container images cleanup | מדיניות **7 ימים** (Google Cloud / Artifact Registry) |
| Stage 2A | לא נשבר — דשבורד מציג כרטיס «בדיקה»; יצירת כרטיס עדיין client batch |

## מה נבנה בשלב זה

- תיקיית `functions/` ב-TypeScript, Node 20
- Firebase Admin SDK (`functions/src/lib/admin.ts`) — אתחול פעם אחת, ללא כתיבה ל-Firestore
- Callable Function v2 בשם `health` ב-region `europe-west1`
- עטיפת לקוח: `src/lib/firebase/functions.ts`
- כלי בדיקה ב-development בלבד (`FunctionsHealthDebug` בדשבורד)
- עדכון `firebase.json` (functions + emulator port 5001)

## למה עוברים ל-Blaze

תוכנית **Spark** לא תומכת בפריסת Cloud Functions לפרודקשן.  
**Blaze** (תשלום לפי שימוש) נדרש כדי:

- לפרוס Callable Functions
- להריץ Functions ב-Emulator עם תאימות מלאה לפרודקשן

**בפרויקט זה:** שודרג ל-Blaze לפני deploy — **פעיל ומאומת**.

### איך לוודא ש-Blaze פעיל (לעתיד)

1. [Firebase Console](https://console.firebase.google.com) → פרויקט `account-card-18e3a`
2. Project settings → **Usage and billing** — **Blaze**
3. `firebase deploy --only functions` — ב-Spark ייכשל עם הודעת שדרוג

מומלץ: budget alert ב-Google Cloud Billing.

## מה זה Callable Function

פונקציה בשרת שנקראת מהלקוח דרך Firebase SDK (`httpsCallable`), עם:

- אימות Firebase Auth אוטומטי ב-token (אופציונלי לפי הגדרת הפונקציה)
- CORS וחתימה מנוהלים על ידי Firebase
- Region קבוע — הלקוח חייב להשתמש באותו region (`europe-west1`)

## מה ה-`health` Function בודקת

| בדיקה | תיאור |
|--------|--------|
| Deploy | הפונקציה זמינה בפרודקשן / Emulator |
| Region | התשובה כוללת `region: "europe-west1"` |
| Auth state | `authenticated: true/false` לפי `request.auth` — **לא חובה** להתחבר |
| שלב | `stage: "2B-0"` |

**לא בודקת:** Firestore, יצירת כרטיס, Rules.

### תשובה מאומתת בפרודקשן

```json
{
  "ok": true,
  "stage": "2B-0",
  "region": "europe-west1",
  "authenticated": true
}
```

(`timestamp` — ISO בכל קריאה)

## Region — למה `europe-west1`

- קרבה גיאוגרפית לישראל (latency)
- region אחת לכל Functions — ללא פיזור

`us-central1` הוא ברירת המחדל של Firebase אך לא נבחר כי המוצר מכוון למשתמשים בישראל.

## מה לא נבנה ב-2B-0

- `createAccountCard` בשרת
- שינוי `firestore.rules` (יצירת כרטיס מהלקוח עדיין מותרת — Stage 2A)
- invitations, join, accept, WhatsApp Share
- entries, approve/reject, balance engine, PDF, encryption מלאה, analytics
- כתיבה ל-Firestore מ-Functions
- העתקת קוד מ-KUPA

## Build

### שורש הפרויקט (Next.js)

```bash
npm install
npm run build
npm run lint
```

### Functions

```bash
cd functions
npm install
npm run build
npm run lint
```

## Deploy

```bash
# מתוך שורש הפרויקט
firebase deploy --only functions
```

**סטטוס בפרויקט:** deploy עבר בהצלחה; Function `health` זמינה ב-`europe-west1`.

### תחזוקת Artifact Registry

הוגדר **cleanup** לתמונות container שנבנות ב-deploy של Functions — שמירה **7 ימים** (מפחית עלויות אחסון ללא השפעה על runtime).

Rules ו-indexes **לא** השתנו ב-2B-0:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## איך בודקים

### 1. אחרי deploy לפרודקשן (מאומת)

1. `npm run dev`
2. התחברות ב-Google
3. דשבורד `/app` — בתחתית (development בלבד): **[dev] Firebase Functions** → **בדיקת health**
4. JSON עם `ok: true`, `region: "europe-west1"`, `authenticated: true` (כשמחובר)
5. ודא ש-Stage 2A עדיין עובד: דשבורד מציג כרטיסים קיימים (למשל «בדיקה»)

### 2. מ-Console בדפדפן (development)

```javascript
// אחרי ייבוא דרך הקוד — או השתמש בכפתור debug בדשבורד
import { callHealthFunction } from "@/lib/firebase/functions";
await callHealthFunction();
```

### 3. Emulator (אופציונלי)

```bash
# .env.local
NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR=true

firebase emulators:start --only auth,firestore,functions
```

בטרמינל נפרד: `npm run dev`

## איך חוזרים לפרויקט אחרי זמן רב

1. קרא [docs/PROJECT_STATE.md](./PROJECT_STATE.md) — סטטוס ושלבים
2. ודא Blaze עדיין פעיל על `account-card-18e3a`
3. `npm install` בשורש + `cd functions && npm install`
4. `.env.local` עם `NEXT_PUBLIC_FIREBASE_*`
5. `npm run dev` — בדוק login + יצירת כרטיס (2A) + health (2B-0)
6. אם שינית Functions: `cd functions && npm run build && cd .. && firebase deploy --only functions`

## השלב הבא

**2B-1 — Server Create Card** — לא התחיל. רק באישור מפורש («מאושר — בצע 2B-1»).

כולל: `createAccountCard` Callable, audit מינימלי, Rules deny client create.  
**לא** כולל: invitations, join, entries.

## קבצים רלוונטיים

| קובץ | תפקיד |
|------|--------|
| `functions/src/index.ts` | `health` export |
| `functions/src/lib/admin.ts` | Admin SDK |
| `src/lib/firebase/functions.ts` | לקוח Callable |
| `src/components/dev/FunctionsHealthDebug.tsx` | debug UI |
| `firebase.json` | functions + emulators |
