# Stage 2B — חוויית הזמנה (תכנון)

מסמך תכנון לזרימת הזמנה, join, accept ו-WhatsApp Share.  
**רוב השלבים עדיין לא מיושמים** — ראה [ROADMAP.md](./ROADMAP.md).

---

## מפת תת־שלבים

| שלב | שם | סטטוס |
|-----|-----|--------|
| 2B-0 | Functions foundation | מאושר |
| 2B-1 | Server Create Card | מיושם |
| 2B-2 | Invitation Token | מתוכנן |
| 2B-3 | Join Preview | מתוכנן |
| 2B-4 | Accept Invitation | מתוכנן |
| 2B-5 | WhatsApp Share UX | מתוכנן |
| **2B-6** | **PWA Onboarding / Add to Home Screen** | **מתוכנן (עתידי)** |

---

## זרימה מתוכננת (2B-2 → 2B-5)

1. Owner יוצר הזמנה (שרת) → token / inviteLink  
2. שיתוף ב-WhatsApp (`wa.me` intent — לא Business API)  
3. מוזמן פותח `/join/[token]` — תצוגה מוגבלת לפני login (2B-3)  
4. התחברות + תנאים (checkbox)  
5. `acceptInvitation` — participant שני פעיל (2B-4)  
6. מעבר לכרטיס / דשבורד  

**אחרי שלב 5 בלבד** — רלוונטי ל-**2B-6** (ראה למטה).

---

## Stage 2B-6 — PWA Onboarding (תכנון בלבד)

> **לא לבנות עכשיו.** אין קוד, אין שינוי UI.

### מיקום בזרימה

- **לא** חלק מ-2B-1 (יצירת כרטיס).  
- **לא** חלק מ-2B-2 (token בלבד).  
- **אחרי** שהצד השני **כבר הצטרף** לכרטיס — כלומר אחרי `acceptInvitation` הצליח.

### מטרה

להציג בצורה עדינה וברורה אפשרות להוסיף את **«כרטיס חשבון»** למסך הבית ולהשתמש בו כמו אפליקציה.

### דרישות UX

#### 1. מתי מוצג

מיד אחרי הצטרפות מוצלחת (מסך הצלחה / redirect ראשון לכרטיס).

#### 2. נוסח (נעול לתכנון)

**גוף:**

> רוצה גישה מהירה לכרטיס?  
> אפשר להוסיף את כרטיס חשבון למסך הבית ולהשתמש בו כמו אפליקציה.

**אייפון:**

> באייפון: לחץ על שיתוף ⬆️ ואז «הוסף למסך הבית».

**אנדרואיד:**

- תמיכה ב-`beforeinstallprompt` → כפתור התקנה.  
- אחרת → הסבר ידני להוספה למסך הבית.

#### 3. סגירה

הכפתור/ההנחיה נעלמת אחרי:

- «הבנתי»  
- «הוספתי למסך הבית»

#### 4. מצב משתמש

`users/{uid}.onboarding` — לדוגמה:

```typescript
// אפשרות א'
pwaInstallHintDismissed: true

// אפשרות ב' (מועדף לתכנון)
pwaInstall: {
  dismissedAt?: Timestamp
  installIntentClickedAt?: Timestamp
  lastShownAt?: Timestamp
}
```

#### 5. צפייה חוזרת

בהגדרות משתמש — קישור קבוע:

> «איך מוסיפים למסך הבית?»

#### 6. מדידה פנימית (מינימלית)

| אירוע | הערה |
|--------|------|
| invite opened | נפתח `/join/[token]` |
| user signed in | בהקשר join |
| invitation accepted | accept הצליח |
| pwa install hint shown | הוצגה מודל/באנר 2B-6 |
| pwa install intent clicked | התקנה / כוונה |
| pwa install hint dismissed | הבנתי / הוספתי |

**אסור בשלב זה:** Google Analytics, Mixpanel, PostHog.  
**אסור:** איסוף תוכן כרטיסים, יתרות, entries — רק אירועי מערכת.

(יישום: audit events / שדות onboarding — ייקבע ב-2B-6.)

### תלות טכנית משוערת (ליישום עתידי)

- PWA manifest קיים (Stage 0) — אייקונים עשויים להתעדכן בנפרד  
- `users` Rules — הרחבת `onboarding` ב-whitelist (באישור 2B-6)  
- זיהוי iOS vs Android ב-client  

---

## מה לא בתיעוד זה (עדיין)

- מימוש `createInvitation` / `acceptInvitation`  
- מסכי join  
- WhatsApp Share  
- UI של 2B-6  

---

## קישורים

- [ROADMAP.md](./ROADMAP.md) — Roadmap מלא כולל 2B-6  
- [PROJECT_STATE.md](./PROJECT_STATE.md) — מצב פרויקט  
- [PRIVACY_DECISIONS.md](./PRIVACY_DECISIONS.md) — פרטיות (רלוונטי למדידה)
