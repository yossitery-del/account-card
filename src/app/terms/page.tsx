import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

/** Needs legal review — תנאי שימוש */
export const metadata: Metadata = {
  title: "תנאי שימוש | כרטיס חשבון",
  description: "תנאי שימוש לשירות כרטיס חשבון",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="תנאי שימוש">
      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          מהו השירות
        </h2>
        <p>
          «כרטיס חשבון» הוא כלי דיגיטלי ל<strong className="text-[var(--color-pearl)]">רישום, תיעוד והסכמה</strong>{" "}
          בין שני צדדים — פנקס משותף שבו כל צד רואה פעולות, מאשר או דוחה,
          וההיסטוריה נשמרת לצורך שקיפות הדדית.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          מה השירות אינו
        </h2>
        <ul className="list-disc space-y-2 pr-5 marker:text-[var(--color-champagne)]">
          <li>
            <strong className="text-[var(--color-pearl)]">אינו בנק</strong> —
            איננו מוסד פיננסי, איננו מחזיקים כספים ואיננו מנהלים חשבונות בנק.
          </li>
          <li>
            <strong className="text-[var(--color-pearl)]">
              אינו שירות תשלומים
            </strong>{" "}
            — איננו מבצעים העברות כסף, סליקה, תשלום או הפקדה בין משתמשים.
          </li>
          <li>
            <strong className="text-[var(--color-pearl)]">אינו שירות גבייה</strong>{" "}
            — איננו גובים חובות בשמכם ואיננו מחליפים הליכי גבייה משפטיים או
            מוסדיים.
          </li>
          <li>
            <strong className="text-[var(--color-pearl)]">אינו ייעוץ</strong> —
            אין ייעוץ פיננסי, משפטי, מס או חשבונאי. כל החלטה עסקית או משפטית
            היא באחריותכם.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          נתונים ואחריות המשתמשים
        </h2>
        <p className="mb-3">
          סכומים, תיאורים, תאריכים ואישורים מוזנים ומאושרים על ידי המשתמשים.
          אנחנו מספקים את המערכת; התוכן הוא שלכם.
        </p>
        <p>
          כל צד אחראי לבדוק פעולות לפני אישור. לחיצה על אישור מהווה הסכמה
          לרישום הפעולה בכרטיס המשותף. מומלץ לוודא נכונות מול הצד השני לפני
          כל אישור משמעותי.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          התנהגות ושימוש הוגן
        </h2>
        <p>
          יש להשתמש בשירות באופן חוקי, בהגינות ובכבוד כלפי הצד השני. אסור
          לנצל את המערכת להטרדה, הונאה, הזנת מידע מטעה במכוון או פגיעה בזכויות
          אחרים.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          גרסת פיילוט
        </h2>
        <p>
          {/* Needs legal review — ניסוח פיילוט, תמיכה ושינויים */}
          השירות נמצא בשלב פיילוט ראשוני. ייתכנו שינויים, שיפורים ותקלות
          זמניות. נשתדל לעדכן על שינויים מהותיים באופן סביר.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          אחריות מוגבלת
        </h2>
        <p>
          {/* Needs legal review — הגבלת אחריות */}
          השירות מסופק כפי שזמין. אנחנו פועלים לתפעול יציב ומאובטח, אך איננו
          מתחייבים שהשירות יהיה חסר תקלות או שיתאים לכל צורך. מחלוקות עסקיות
          ותוכן שהוזן או אושר על ידי המשתמשים הם באחריות הצדדים.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium text-[var(--color-pearl)]">
          עדכון תנאים ויצירת קשר
        </h2>
        <p className="mb-3">
          {/* Needs legal review — הודעה על שינויים */}
          תנאים אלה עשויים להתעדכן מעת לעת. המשך שימוש בשירות לאחר עדכון
          עשוי להיחשב כהסכמה לתנאים המעודכנים.
        </p>
        <p>
          {/* Needs legal review — פרטי מפעיל ויצירת קשר */}
          לפניות בנושא השירות ניתן להשתמש בפרטי יצירת הקשר שיימסרו במסגרת
          השירות.
        </p>
      </section>
    </LegalPageShell>
  );
}
