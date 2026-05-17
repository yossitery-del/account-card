# Production Hosting — כרטיס חשבון

**סטטוס:** החלטה נעולה (מאי 2026). **לא** בוצע deploy במסגרת תיעוד זה. **2D-1** לא התחיל.

---

## החלטה

| שכבה | פלטפורמה |
|------|-----------|
| **UI (Next.js 16 App Router)** | **Vercel** — production host |
| **Backend** | **Firebase** — פרויקט `account-card-18e3a` |
| Auth | Firebase Authentication (Google) |
| Database | Cloud Firestore + Rules + Indexes |
| Server logic | Cloud Functions — region **`europe-west1`** |

### לא בשימוש ל-MVP זה

| אפשרות | סטטוס |
|--------|--------|
| **Firebase Hosting** (`hosting` ב-`firebase.json`) | **לא נדרש** — אין בלוק hosting ב-repo |
| **Firebase App Hosting** / `apphosting.yaml` | **לא** — לא מאומץ כרגע (Next 16 מחוץ ללוח תמיכה רשמי של App Hosting) |
| **VPS / Node self-hosted** | **לא** — מחוץ להיקף MVP |

**רקע:** אודיט hosting (מאי 2026) — Vercel מתאים ל-Next **16.2.6**, אפליקציית Firebase client-heavy, עלות MVP צפויה, rollback ודומיין/SSL מהירים.

---

## משתני סביבה — Vercel (חובה)

להגדיר ב-Vercel (Production + Preview לפי צורך). נדרשים ב-**build** (`NEXT_PUBLIC_*` מוטמעים ב-bundle).

| משתנה | חובה |
|--------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | כן |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | כן |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | כן — `account-card-18e3a` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | כן |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | כן |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | כן |

### אסור ב-production

| משתנה | הערה |
|--------|------|
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | פיתוח בלבד — **לא** להגדיר בפרודקשן |
| `NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR` | פיתוח בלבד — **לא** להגדיר בפרודקשן |

מקור מקומי: `.env.example` → `.env.local` (gitignored).

---

## Firebase — פרמטרים ו-Auth

### Cloud Functions parameter

| פרמטר | ערך |
|--------|-----|
| `APP_BASE_URL` | `https://<production-domain>` — דומיין Vercel production (או custom domain) |

משמש לבניית `inviteLink` ב-`createInvitation`. ברירת מחדל בקוד: `http://localhost:3000` — **חייב** לעדכן לפני שיתוף הזמנות בפרודקשן.

הגדרה: Firebase Console → Functions → Parameters (או `functions/.env` לפיתוח מקומי בלבד).

### Firebase Auth — Authorized domains

להוסיף ב-Console → Authentication → Settings → Authorized domains:

- דומיין production של Vercel (למשל `your-app.vercel.app`)
- דומיין custom (אם קיים)
- Preview: `*.vercel.app` אם נדרש לבדיקות preview (אופציונלי)

---

## סדר deploy מומלץ

**לא להריץ אוטומטית מתוך מסמך זה** — רשימת פעולות בלבד.

### 1. Pre-flight (מקומי)

```bash
npm run lint
npm run build
npm run test:all
cd functions && npm run lint && npm run build && cd ..
```

### 2. Firestore

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

לוודא ב-Console ש-indexes במצב **Enabled** לפני smoke מלא.

### 3. Cloud Functions

```bash
firebase deploy --only functions
```

(או deploy ממוקד לפי צורך — ראה [PROJECT_STATE.md](./PROJECT_STATE.md).)

לפני/עם deploy: לוודא `APP_BASE_URL` מצביע לדומיין production.

### 4. Next.js על Vercel

- חיבור repo → Framework: Next.js (זיהוי אוטומטי)
- הגדרת כל `NEXT_PUBLIC_FIREBASE_*`
- Deploy production (למשל push ל-`main` או `vercel --prod`)

אין צורך ב-`firebase deploy --only hosting`.

### 5. Smoke test (ידני)

| # | בדיקה |
|---|--------|
| 1 | התחברות Google (`/login` → `/app`) |
| 2 | Dashboard — `listUserCards` |
| 3 | יצירת כרטיס |
| 4 | הזמנה — `inviteLink` עם host של production |
| 5 | Join — `/join/[token]` → accept |
| 6 | `createEntry` + `approveEntry` (לפחות) |

---

## Rollback (תמצית)

| שכבה | פעולה |
|------|--------|
| **Vercel** | Promote deployment קודם ב-Dashboard |
| **Functions** | Redeploy מ-commit ידוע + `functions` build |
| **Rules** | `firebase deploy --only firestore:rules` מגרסה ידועה |
| **`APP_BASE_URL`** | עדכון פרמטר + redeploy functions אם נדרש |

---

## קישורים

- [PROJECT_STATE.md](./PROJECT_STATE.md) — סטטוס פרויקט
- [ROADMAP.md](./ROADMAP.md) — תכנון שלבים
- [PERF_BASELINE.md](./PERF_BASELINE.md) — מדידות (dev; production — 2D-3 עתידי)
- [README.md](../README.md) — Firebase backend
