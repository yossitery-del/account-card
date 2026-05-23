/** נוסח מרכז פיקוד דשבורד — «כרטיס» / «כרטיס חשבון» */

export function primaryStatusMessage(
  pendingDecisionsCount: number,
  activeCardCount?: number
): string {
  if (activeCardCount === 0) {
    return "מוכן לפתיחת כרטיס ראשון";
  }
  if (pendingDecisionsCount === 1) {
    return "החלטה אחת ממתינה לאישורך";
  }
  if (pendingDecisionsCount > 1) {
    return `${pendingDecisionsCount} החלטות ממתינות לאישורך`;
  }
  return "הכול מעודכן";
}

export function activeCardsMeta(count: number): string {
  if (count === 0) {
    return "אין כרטיסי חשבון עדיין";
  }
  if (count === 1) {
    return "כרטיס חשבון פעיל אחד";
  }
  return `${count} כרטיסי חשבון פעילים`;
}

/** הבהרה למשתמש: ניתן לפתוח כרטיסים עצמאיים מול צדדים נוספים. */
export const DASHBOARD_NEW_CARD_INDEPENDENCE_HINT =
  "גם אתה יכול לפתוח כרטיס חשבון משותף עם כל מי שיש לך איתו התחשבנות.";

export const dashboardCopy = {
  cardsSectionTitle: "הכרטיסים שלי",
  searchPlaceholder: "חפש כרטיס חשבון...",
  filterAll: "הכול",
  filterPending: "ממתינים",
  noFilterResults: "לא נמצאו כרטיסים מתאימים",
  openCard: "פתיחת כרטיס",
  pendingActionsReview: "פעולות ממתינות לבדיקה",
  quickActionsLabel: "אישור או דחייה מהירים",
} as const;
