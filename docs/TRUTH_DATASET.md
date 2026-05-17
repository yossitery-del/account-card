# Truth Dataset #1 — Yossi & Stav

מסמך רגרסיה למוצר וליתרות. Stage 0: מסמך בלבד — בדיקות קוד ב־Stage 4+.

**2C-2:** בדיקות ידניות T1–T7 — [STAGE2C-2_APPROVE_REJECT.md](./STAGE2C-2_APPROVE_REJECT.md).

---

## הקשר

| שדה | ערך |
|-----|-----|
| משתתפים | Yossi, Stav |
| `balancePerspectiveUid` | Yossi |
| יתרת פתיחה | 0 |
| מטבע | ILS (₪) |

---

## פעולות

### 1 — חיוב מאושר

- **יוצר:** Yossi
- **סוג:** charge (חיוב)
- **סכום:** 500
- `effectOnPerspectiveBalance`: `increase`
- **סטטוס:** `approved` (Stav מאשר)

### 2 — זיכוי מאושר

- **יוצר:** Stav
- **סוג:** credit / payment (תשלום / זיכוי)
- **סכום:** 200
- `effectOnPerspectiveBalance`: `decrease`
- **סטטוס:** `approved` (Yossi מאשר)

### 3 — חיוב ממתין

- **יוצר:** Yossi
- **סכום:** 100
- `effectOnPerspectiveBalance`: `increase`
- **סטטוס:** `pending`

### 4 — זיכוי נדחה

- **יוצר:** Stav
- **סכום:** 50
- `effectOnPerspectiveBalance`: `decrease`
- **סטטוס:** `rejected` (Yossi דוחה)

---

## תוצאות צפויות (מערכת)

| מדד | ערך |
|-----|-----|
| `officialBalance` | **300** |
| `pendingBalanceImpact` | **100** |
| השפעת rejected | **0** |

חישוב official: +500 − 200 = 300  
pending: +100 (רק #3)  
#4 לא משפיע

---

## בדיקות 2C-2 (ידני — לפני סגירת שלב)

| ID | תרחיש | צעדים | צפוי |
|----|--------|--------|------|
| **T1** | אישור זיכוי 500 | Yossi: זיכוי 500 pending → Stav: **אישור** | `officialBalance` **+500**, `pendingBalanceImpact` **0** |
| **T2** | דחיית חיוב 200 | Yossi: חיוב 200 pending → Stav: **דחייה** | `officialBalance` **ללא שינוי**, `pending` **0** |
| **T3** | self-approve | Yossi יוצר → Yossi מנסה אישור | **חסום** (שרת + אין כפתורים) |
| **T4** | אישור כפול | אחרי T1 מוצלח — approve שוב | **failed-precondition** |
| **T5** | דחייה אחרי אישור | entry `approved` → reject | **חסום** |
| **T6** | משתמש זר | C לא participant — קריאה/Callable | **permission-denied** / אין גישה |
| **T7** | מסלול מלא Dataset | אישור #1, #2; דחיית #4; #3 נשאר pending | official **300**, pending **100** |

### דוגמת delta (T1)

- `effectOnPerspectiveBalance: increase`, `amount: 500` → `delta = +500`
- create: `pending += 500`
- approve: `pending -= 500`, `official += 500`

### דוגמת pending מורכב (מתוך תכנון 2C-2)

- `pendingBalanceImpact = +300` (= +500 pending + (−200) pending)
- אישור entry עם `delta = -200` בלבד:
  - `officialBalance += -200`
  - `pendingBalanceImpact -= (-200)` → **+500** (נשארת רק השפעת +500)

---

## תצוגה — נקודת מבט Yossi

`balancePerspectiveUid = Yossi` → הצופה הוא יוסי:

| מצב | ניסוח UI (מוצע) |
|-----|-----------------|
| רשמי (300) | **סתיו חייבת לך ₪300** |
| אם pending יאושר (400) | **סתיו חייבת לך ₪400** |
| ממתין | תג: ממתין לאישור — ₪100 (פעולה #3) |

---

## תצוגה — נקודת מבט Stav

אותם מספרים, תרגום לפי `viewerUid !== balancePerspectiveUid`:

| מצב | ניסוח UI (מוצע) |
|-----|-----------------|
| רשמי (300) | **את חייבת ליוסי ₪300** |
| אם pending יאושר (400) | **תחייבי ליוסי ₪400** (או: «תישאר חייבת ליוסי ₪400») |
| ממתין | ממתין לאישור יוסי — ₪100 |

---

## בדיקות עתידיות (רשימה)

- [ ] אחרי אישור #1 בלבד: official = 500
- [ ] אחרי אישור #2: official = 300
- [ ] עם #3 pending: pendingImpact = 100
- [ ] אחרי דחיית #4: ללא שינוי ביתרות
- [ ] Yossi לא יכול לאשר פעולה של Yossi
- [ ] תרגום UI לשני צדדים תואם Truth Dataset
- [ ] T1–T7 מ-[STAGE2C-2](./STAGE2C-2_APPROVE_REJECT.md) — QA 2C-2
