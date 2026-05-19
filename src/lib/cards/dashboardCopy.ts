/** נוסח מרכז פיקוד דשבורד — «כרטיס» / «כרטיס חשבון» */

export function primaryStatusMessage(
  cardsWithPending: number,
  activeCardCount?: number
): string {
  if (activeCardCount === 0) {
    return "מוכן לפתיחת כרטיס ראשון";
  }
  if (cardsWithPending === 1) {
    return "כרטיס אחד ממתין לאישור";
  }
  if (cardsWithPending > 1) {
    return `${cardsWithPending} כרטיסים ממתינים לאישור`;
  }
  return "הכול מסודר כרגע";
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
