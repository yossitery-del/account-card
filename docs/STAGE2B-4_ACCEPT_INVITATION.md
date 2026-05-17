# Stage 2B-4 — Accept Invitation

**סטטוס:** **מאושר, נסגר ונבדק** (מאי 2026).

## מטרה

משתמש שקיבל קישור הזמנה מתחבר ב-Google ומצטרף כ־participant שני. הכרטיס הופך משותף בפועל.

---

## מה נבנה

| רכיב | פירוט |
|------|--------|
| **Callable** | `acceptInvitation` — transaction, auth חובה |
| **Join flow** | intent ב-sessionStorage, accept אוטומטי אחרי Google |
| **Join UX/Auth** | אורח: «כניסה עם Google»; מחובר: «מחובר כ־…» + «כניסה לכרטיס» |
| **מסך כרטיס** | «הכרטיס מחובר» כשיש 2 participants פעילים |

## מה לא נבנה

entries, approve/reject UI, balance engine, PDF, encryption, analytics, Business API, Email/SMS, PWA 2B-6, Mockup 2B-3.1.

**הבא:** **2C — Entries / Pending Records** — רק באישור מפורש.

---

## Join Preview UX/Auth (נסגר ב-QA)

### אורח (`valid`, לא מחובר)

| רכיב | נוסח |
|------|------|
| כותרת | כניסה אישית מאובטחת |
| כפתור | כניסה עם Google |
| הסבר | נשתמש בחשבון Google כדי לפתוח את הכרטיס בצורה בטוחה. |

- `signInWithGoogle` עם `prompt: "select_account"` (בחירת חשבון)
- לפני login: `setJoinIntent(token)` ב-sessionStorage
- אחרי login: `consumeJoinIntent` → accept אוטומטי → «פותחים את הכרטיס...» → redirect

### מחובר (`valid`)

| רכיב | נוסח |
|------|------|
| | כניסה מאובטחת דרך Google |
| | מחובר כ־{displayName} |
| כפתור | כניסה לכרטיס |

- **אין** accept אוטומטי בכניסה לדף (ללא intent)
- לחיצה → `acceptInvitation` → redirect

### כלל intent

accept אוטומטי **רק** אחרי join intent מלחיצה קודמת — לא בפתיחת `/join` כשכבר מחובר.

---

## Function — `acceptInvitation`

```typescript
{ token: string } → { cardId: string, alreadyParticipant?: boolean }
```

Transaction: pending invitation, לא self-accept, מקסימום 2 participants, participant + accepted + audit.

---

## Permissions — participant שני

`canAddEntry: true`, `canApprove: true`, `canInvite: false`.

---

## QA שבוצע (סיכום)

- אורח: Google + accept אוטומטי + redirect
- מחובר מראש: ללא הצטרפות בלי לחיצה; לחיצה מצליחה
- אין participant כפול; invitation `accepted`
- מסך כרטיס: «הכרטיס מחובר» לשני הצדדים

---

## Security / Auth / Query Audit (נסגר)

**טריגר:** חשד ש-B רואה ב-`/app` את כל כרטיסי A.

### מה נבדק

| רכיב | ממצא |
|------|------|
| `listUserCards` | שאילתה נכונה — רק participants שבהם `uid == auth.uid` ו-`active` |
| Rules | `accountCards` read רק דרך participant פעיל; CG participants מסונן ל-uid |
| `acceptInvitation` | כותב participant רק בכרטיס ההזמנה, עם `request.auth.uid` |
| cache | אין localStorage לכרטיסים; תוקן race ב-dashboard |

### תיקונים (2B-4)

- `DevAuthIdentity` — `/app` development: «מחובר כ־…» + email
- `app/page.tsx` — ריקון cards + `cancelled` על שינוי משתמש

### בדיקת A/B (עברה)

- A: כל הכרטיסים שלו
- B: Incognito, באנר dev = אימייל B, **כרטיס אחד** בלבד
- אין כרטיסים אחרים של A; אין race אחרי accept

**מסקנה:** אין פרצת הרשאות. מעבר ל-2C — רק באישור מפורש.

---

## קבצים עיקריים

```
functions/src/invitations/acceptInvitation.ts
src/lib/invitations/joinIntent.ts
src/lib/invitations/joinAcceptErrors.ts
src/components/join/JoinPreviewScreen.tsx
src/components/cards/CardShareStatus.tsx
src/lib/cards/getCardPageContext.ts
src/components/dev/DevAuthIdentity.tsx
src/app/app/page.tsx
```

---

## השלב הבא

**2C — Entries / Pending Records** — לא להתחיל בלי אישור.
