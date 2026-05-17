# Stage 2B-2 — Invitation Token (+ תיקון 2B-2.1)

**סטטוס: מאושר ונסגר** — 2B-2 + תיקון 2B-2.1 (אימות ידני בוצע).

## החלטת מוצר — ביטול email חובה (2B-2.1)

בגרסה הראשונה של 2B-2 נדרש email לפני יצירת הזמנה.  
**זה לא מתאים ל-UX אמיתי:** המשתמש שולח ב-WhatsApp לאיש קשר, לא מקליד מייל מראש.

**מודל נוכחי (MVP):** הזמנה = **קישור + token** בלבד.  
**email binding** — אופציה עתידית בלבד (לא ב-MVP).

## למה claim-on-accept נכון ל-WhatsApp-first

1. יוצרים הזמנה → «שליחה בוואטסאפ» → בוחרים איש קשר  
2. הצד השני פותח קישור → מתחבר ב-Google → מצטרף (ב-2B-4)

`bindingMode: "claim_on_accept"` — מי שמחזיק בקישור ומתחבר ראשון יכול להצטרף.

### סיכונים

| סיכון | תיאור |
|--------|--------|
| קישור דולף | מי שקיבל את הקישור יכול להצטרף |
| שליחה לאדם הלא נכון | אחריות השולח |

### הפחתות (קיימות / מתוכננות)

| הפחתה | סטטוס |
|--------|--------|
| token חד-פעמי + `tokenHash` בלבד | 2B-2 |
| `expiresAt` (30 יום) | 2B-2 |
| `status: accepted` — קישור לא לשימוש חוזר | 2B-4 |
| email/phone binding | עתידי |

## מה נבנה

- Callable `createInvitation` — **ללא email** (2B-2.1)
- מודל invitation עם `bindingMode: "claim_on_accept"`
- UI מסך הזמנה: יצירה אוטומטית בכניסה → קישור + **שליחה בוואטסאפ** + העתק (ללא טופס שם)
- audit: `invitation.created` — ללא email
- UX מסך כרטיס: בלוק **«שתפו את הכרטיס»** + CTA «שליחת הזמנה»
- UX header: **חזרה** כניווט ראשי; **יציאה** קישור עדין (לא מתחרה בחזרה)

## אימות שלב (בוצע)

| בדיקה | תוצאה |
|--------|--------|
| הזמנה בלי email | הצלחה |
| Firestore + audit | `claim_on_accept`, `tokenHash`, ללא email ב-audit |
| WhatsApp Share | `wa.me` עם נוסח + קישור |
| בלוק שתפו + CTA | מאושר ויזואלית |
| חזרה / יציאה | אין בלבול |

## מודל Firestore

`accountCards/{cardId}/invitations/{inviteId}`

| שדה | הערות |
|-----|--------|
| `tokenHash` | SHA-256 בלבד |
| `status` | `pending` (ביצירה) |
| `createdByUid`, `createdAt`, `expiresAt` | |
| `acceptedAt`, `acceptedByUid`, `acceptedEmail` | null עד accept |
| `invitedName` | אופציונלי |
| `intendedRecipientLabel` | אופציונלי |
| `bindingMode` | `"claim_on_accept"` |

**אין** שדה `email` חובה במסמכים חדשים. הזמנות ישנות עם `email` — לא משמשות לחסימה.

## Function `createInvitation`

**Input:**

```typescript
{ cardId: string; invitedName?: string; intendedRecipientLabel?: string }
```

**Output:** `{ inviteLink, expiresAt }`

**בדיקות:** auth, participant active, `canInvite`, כרטיס active.

## token / inviteLink

כמו 2B-2: `randomBytes(32)` → Base64URL → hash ב-DB.  
`inviteLink = {APP_BASE_URL}/join/{token}`

## WhatsApp Share (בסיסי — ב-2B-2.1)

- `https://wa.me/?text={encodedMessage}`
- **לא** Business API, **לא** שליחה מהשרת, **לא** שמירת טלפון
- המשתמש בוחר איש קשר ב-WhatsApp

## APP_BASE_URL

Functions Parameter + `functions/.env` — ראה `functions/.env.example`.

## Join Preview

**2B-3** — `/join/[token]` פעיל. מסך ההזמנה מציג נוסח פרימיום ללא אזכור 404.

## כפילויות הזמנות

מותר יותר מהזמנה לאותו כרטיס. revoke/resend — עתידי.

## UX מסך כרטיס (מאושר)

**כותרת:** שתפו את הכרטיס  

**טקסט:** כשהצד השני מצטרף, שניכם רואים את אותו פנקס — ברור, מסודר, ומוכן לאישור משותף.

**כפתור:** שליחת הזמנה → `/app/cards/[cardId]/invite`

הצגה: כרטיס פנימי champagne/glass; CTA בולט; מופרד מהיתרה.

## UX ניווט (מאושר)

במסכים עם `backHref`: כפתור **חזרה** בולט; **יציאה** כקישור קטן בפינה. בדשבורד: יציאה פחות דומיננטית.

## מה לא נבנה

join preview (2B-3), accept (2B-4), email binding, Business API, Email/SMS.

## השלב הבא

**2B-3 — Join Preview** — `/join/[token]`. רק באישור: «מאושר — בצע 2B-3».
