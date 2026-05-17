# Stage 2A — Shared Card Skeleton

## מה נבנה

- `accountCards/{cardId}` — ישות שורש
- `accountCards/{cardId}/participants/{uid}` — owner פעיל
- יצירה ב-**client `writeBatch`** (הוחלף ב-**2B-1** — Callable בשרת)
- דשבורד, יצירת כרטיס, מסך כרטיס בסיסי

## למה בלי Functions / Blaze

הפרויקט על **Firebase Spark**. Cloud Functions דורשות **Blaze**.

ב-2A אין עדיין פעולות כספיות, אישור דו־צדדי, או יתרות אמיתיות — רק שלד. לכן `writeBatch` מהלקוח מותר **זמנית**.

## איך `getAfter()` מחזק אטומיות לוגית

Firestore בודק כל מסמך ב-batch, אבל **`getAfter()`** מאפשר לראות את מצב המסמכים **אחרי** כל ה-writes באותו commit.

| create | בדיקה |
|--------|--------|
| `accountCards/{cardId}` | `getAfter(participants/{auth.uid})` — חייב owner פעיל תקין |
| `participants/{uid}` | `getAfter(accountCards/{cardId})` — חייב כרטיס תקין של היוצר |

**תוצאה:**

- כרטיס **בלי** participant באותו batch → **נדחה**
- participant **בלי** כרטיס תקין → **נדחה**
- `update` / `delete` על כרטיס ו-participant → **חסום**

סדר ב-client: קודם כרטיס, אחר כך participant (תואם את תלות ה-Rules).

## מעבר ל-Functions (2B / 2C)

כשנכנסים ל:

- invitations + צד שני
- entries + approve/reject
- עדכון יתרות בשרת
- audit

→ מעבר ל-**Blaze** + **Callable Functions**, ו-**deny create** מהלקוח על `accountCards` / `participants`.

## מה לא נבנה ב-2A

- invitations, entries, auditEvents
- approve/reject, balance engine
- עדכון title אחרי יצירה
- PDF, encryption, analytics, Functions

## Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

אחרי deploy — הפעל מחדש `npm run dev` אם צריך.

## בדיקות ידניות

1. דשבורד ריק → טקסט מצב ריק
2. יצירת כרטיס → Firestore: card + participant
3. redirect למסך כרטיס
4. דשבורד מציג כרטיס
5. משתמש אחר לא רואה את הכרטיס
6. Console: create card בלי participant באותו batch → נדחה
