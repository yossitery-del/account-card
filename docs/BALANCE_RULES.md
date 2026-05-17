# כללי יתרה — כרטיס חשבון

מסמך מקור אמת לחישוב ותצוגת יתרות. מימוש קוד ב־Stage 1+.

---

## ציר ייחוס: `balancePerspectiveUid`

במערכת משותפת בין שני צדדים, «יתרה חיובית = הצד השני חייב לי» **אינו מספיק** — לכל משתתף «אני» אחר.

לכן:

- `officialBalance` ו־`pendingBalanceImpact` נשמרים **תמיד** מנקודת המבט של `balancePerspectiveUid`.
- בפיילוט: בדרך כלל `balancePerspectiveUid === createdByUid`.

### דוגמה

`balancePerspectiveUid = Yossi`, `officialBalance = 300`:

| צופה | תצוגה |
|------|--------|
| Yossi | סתיו חייבת לך ₪300 |
| Stav | את חייבת ליוסי ₪300 |

`officialBalance = -300`:

| צופה | תצוגה |
|------|--------|
| Yossi | אתה חייב לסתיו ₪300 |
| Stav | יוסי חייב לך ₪300 |

`officialBalance = 0` → החשבון מאוזן (ניסוח לפי צד).

---

## השפעה על היתרה: `effectOnPerspectiveBalance`

**לא** משתמשים ב־`direction` עם «me» — «me» משתנה לפי המשתמש.

| ערך | משמעות (ביחס ל־`balancePerspectiveUid`) | ב־UI |
|-----|----------------------------------------|------|
| `increase` | מגדיל את היתרה | **חיוב** |
| `decrease` | מקטין את היתרה | **תשלום / זיכוי** |

---

## סטטוסי פעולה

| סטטוס | השפעה על `officialBalance` | השפעה על `pendingBalanceImpact` |
|--------|---------------------------|----------------------------------|
| `approved` | כן | לא (מוסר מ־pending אם היה) |
| `pending` | לא | כן |
| `rejected` | לא | לא |
| `cancelled` | לא | לא |

**אין מחיקה שקטה** של פעולות כספיות — רק ביטול/דחייה/ארכוב.

---

## Truth Dataset — Yossi & Stav

**משתתפים:** Yossi, Stav  
**balancePerspectiveUid:** Yossi  
**יתרת פתיחה:** 0

| # | יוצר | סוג | סכום | effect | סטטוס |
|---|------|-----|------|--------|--------|
| 1 | Yossi | charge | 500 | increase | approved (Stav מאשר) |
| 2 | Stav | credit/payment | 200 | decrease | approved (Yossi מאשר) |
| 3 | Yossi | charge | 100 | increase | pending |
| 4 | Stav | credit/payment | 50 | decrease | rejected (Yossi דוחה) |

### צפוי

| שדה | ערך |
|-----|-----|
| `officialBalance` | 300 |
| `pendingBalanceImpact` | 100 |
| השפעת rejected | 0 |

### תצוגה — Yossi

- עכשיו: **סתיו חייבת לך ₪300**
- אם pending (100) יאושר: **סתיו חייבת לך ₪400**

### תצוגה — Stav

- עכשיו: **את חייבת ליוסי ₪300**
- אם pending יאושר: **תחייבי ליוסי ₪400** (ניסוח עברי מותאם ב־UI)

---

## כללי אישור (מוצר)

- יוצר פעולה **לא** יכול לאשר לעצמו.
- משתתף פעיל אחר מאשר או דוחה.
- עדכון יתרות — **בשרת** (Cloud Functions), לא בלקוח בלבד.

---

## פונקציית תרגום UI (חתימה עתידית)

```
formatBalanceForViewer(
  officialBalance: number,
  pendingBalanceImpact: number,
  balancePerspectiveUid: string,
  viewerUid: string,
  counterpartyDisplayName: string
): { officialLabel, pendingLabel, isBalanced }
```

מימוש: Stage 1+.
