# Stage 1 — Firebase + Google Auth + Protected Shell

## מה נבנה

- התחברות Google (client-side)
- `users/{uid}` ב-Firestore אחרי login
- `/login`, `/app`, redirect מ-`/`
- Firestore Rules: פרופיל עצמי בלבד

## מה לא נבנה

כרטיסים, participants, invitations, entries, יתרות, PDF, הצפנה, analytics, middleware.

## הגדרת Firebase Console

1. פרויקט **נפרד** מ-KUPA
2. Authentication → Google → Enable
3. Authorized domains: `localhost` (+ דומיין פרודקשן)
4. Firestore → Create database
5. Deploy rules: `firebase deploy --only firestore:rules`

## משתני סביבה

העתק `.env.example` → `.env.local` והשלם את כל `NEXT_PUBLIC_FIREBASE_*`.

הפעל מחדש: `npm run dev`

## Auth flow

1. `/` → `/login` או `/app`
2. Google popup → Firebase Auth
3. `onAuthStateChanged` → `ensureUserProfile(uid)`
4. redirect ל-`/app`
5. יציאה → `/login`

## Emulator (אופציונלי — לא חובה ב-Stage 1)

```bash
firebase emulators:start --only firestore,auth
```

Google Auth ב-Emulator דורש הגדרה נוספת. **ברירת מחדל:** Auth + Firestore מול פרויקט Firebase אמיתי.

## בדיקות ידניות

| # | בדיקה |
|---|--------|
| 1 | `/app` לא מחובר → `/login` |
| 2 | התחברות Google → `/app` |
| 3 | Firestore: `users/{uid}` נוצר |
| 4 | אין UID בממשק |
| 5 | יציאה → `/login` |
| 6 | `npm run build` / `lint` |
