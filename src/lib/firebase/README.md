# Firebase — כרטיס חשבון

## Stage 1

- `config.ts` — קריאת env
- `client.ts` — `getFirebaseApp`, `getFirebaseAuth`, `getFirestoreDb`
- אתחול **רק** Auth + Firestore (client-side)
- **אין** Storage, Analytics

## Stage 2B-0

- `functions.ts` — `getFirebaseFunctions`, `callHealthFunction` (region `europe-west1`)
- Emulator: `NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR=true` — ראה `docs/STAGE2B-0_FUNCTIONS.md`
- יצירת כרטיס דרך Callable `createAccountCard` (2B-1)

## משתני סביבה

ראה `.env.example` → `.env.local`

## Rules

`firestore.rules` — `users/{ownUid}` בלבד; שדות מוגבלים; `accountCards` חסום.

פריסה:

```bash
firebase deploy --only firestore:rules
```

## Emulator

מתועד ב-`docs/STAGE1_AUTH.md`. לא חובה ל-Stage 1.
