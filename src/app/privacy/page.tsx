import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

/** Needs legal review — מדיניות פרטיות */
export const metadata: Metadata = {
  title: "מדיניות פרטיות | כרטיס חשבון",
  description: "מדיניות פרטיות לשירות כרטיס חשבון",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="מדיניות פרטיות">
      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          כללי
        </h2>
        <p>
          מדיניות זו מתארת כיצד «כרטיס חשבון» מטפל במידע במסגרת שירות ל<strong className="text-[var(--color-pearl)]">רישום, תיעוד והסכמה</strong>{" "}
          בין משתמשים. השירות{" "}
          <strong className="text-[var(--color-pearl)]">אינו בנק</strong>,{" "}
          <strong className="text-[var(--color-pearl)]">אינו שירות תשלומים</strong>{" "}
          ו<strong className="text-[var(--color-pearl)]">אינו שירות גבייה</strong>.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          אילו נתונים נאספים
        </h2>
        <ul className="list-disc space-y-2 pr-5 marker:text-[var(--color-champagne)]">
          <li>
            <strong className="text-[var(--color-pearl)]">זהות התחברות</strong> —
            מזהה משתמש וספק Google בעת כניסה (Firebase Authentication).
          </li>
          <li>
            <strong className="text-[var(--color-pearl)]">שם תצוגה ואימייל</strong> —
            מחשבון Google; השם מוצג לצד השני בכרטיס. אימייל משמש לזיהוי
            פנימי ואינו מוצג בכרטיס כברירת מחדל.
          </li>
          <li>
            <strong className="text-[var(--color-pearl)]">תוכן הכרטיס</strong> —
            כותרות, משתתפים, פעולות (סכומים, תיאורים, סטטוס אישור), יתרות
            מחושבות ומטא-דאטה טכני (תאריכי יצירה ועדכון).
          </li>
          <li>
            <strong className="text-[var(--color-pearl)]">הזמנות</strong> —
            קישורי הצטרפות ומזהי הזמנה לצורך חיבור הצד השני.
          </li>
          <li>
            <strong className="text-[var(--color-pearl)]">אחסון מקומי בדפדפן</strong> —
            לעיתים נשמרת כוונת הצטרפות זמנית בדפדפן — לצורך המשכת הזרימה
            בלבד.
          </li>
        </ul>
        <p className="mt-3">
          רוב התוכן העסקי{" "}
          <strong className="text-[var(--color-pearl)]">מוזן על ידי המשתמשים</strong>.
          אנחנו לא בודקים את נכונות הסכומים או המשמעות המשפטית של הרישומים.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          למה משתמשים בנתונים
        </h2>
        <ul className="list-disc space-y-2 pr-5 marker:text-[var(--color-champagne)]">
          <li>אימות משתמשים והפעלת חשבון.</li>
          <li>יצירת כרטיסים, הזמנות והצטרפות צד שני.</li>
          <li>הצגת פנקס משותף, אישורים ויתרות בין המשתתפים.</li>
          <li>אבטחה, תפעול ותיקון תקלות.</li>
        </ul>
        <p className="mt-3">
          {/* Needs legal review — בסיס חוקי לעיבוד */}
          אנו מעבדים מידע במידה הנדרשת להפעלת השירות, לפי ההסכמה בין
          המשתתפים ובהתאם לדין החל.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          שיתוף עם ספקים
        </h2>
        <p>
          הנתונים נשמרים ומעובדים באמצעות תשתית Google Firebase (אימות,
          מסד נתונים ופונקציות שרת). העיבוד כפוף למדיניות Google ולתנאי
          השימוש שלהם.{" "}
          {/* Needs legal review — מיקום עיבוד / העברה בינלאומית */}
          עיבוד המידע עשוי להתבצע בשרתי ענן, בהתאם למדיניות הספקים.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          מי רואה את המידע
        </h2>
        <p>
          גישה לתוכן כרטיס מוגבלת למשתתפים הפעילים באותו כרטיס. כל צד אחראי
          לבדוק ולאשר פעולות לפני שהן נרשמות כמאושרות. איננו מפרסמים תוכן
          כרטיסים לציבור ואיננו מוכרים נתונים לצדדים שלישיים לפרסום.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          שמירה, מחיקה וייצוא
        </h2>
        <p>
          {/* Needs legal review — תקופת שמירה, מחיקה, ייצוא, זכויות נושאי מידע */}
          אנו שומרים מידע כל עוד נדרש להפעלת השירות ולתיעוד הפעילות בכרטיס.
          בקשות בנושא עיון, תיקון או מחיקה יטופלו בהתאם ליכולות השירות ולדין
          החל.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          אבטחה
        </h2>
        <p>
          אנו משתמשים בגישה מאובטחת (HTTPS), הרשאות מבוססות משתתפים בכרטיס
          וכללי אבטחה בשרת. אין אבטחה מוחלטת; מומלץ לשמור על מכשיר וחשבון
          Google אישיים.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          עוגיות ואחסון מקומי
        </h2>
        <p>
          {/* Needs legal review — פירוט cookies / local storage */}
          השירות משתמש באמצעי אחסון בדפדפן לצורך התחברות והמשכיות שימוש. ניתן
          לנקות אחסון מקומי בהגדרות הדפדפן; הדבר עלול לשבש המשכת פעילות.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          קטינים
        </h2>
        <p>
          {/* Needs legal review */}
          השירות מיועד למבוגרים. אם יודע לנו שנאסף מידע של קטין שלא כדין,
          נפעל למחיקתו בהתאם ליכולות השירות.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          עדכונים ויצירת קשר
        </h2>
        <p className="mb-3">
          נעדכן מדיניות זו מעת לעת; תאריך «עודכן לאחרונה» בראש העמוד ישקף
          את הגרסה האחרונה.
        </p>
        <p>
          {/* Needs legal review — פרטי יצירת קשר */}
          לפניות בנושא פרטיות ניתן להשתמש בפרטי יצירת הקשר שיימסרו במסגרת
          השירות.
        </p>
      </section>
    </LegalPageShell>
  );
}
