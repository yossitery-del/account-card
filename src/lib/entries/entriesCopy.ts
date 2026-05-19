/** נוסח UI לרשומות — Stage 2C */

const fallbackOtherName = "הצד השני";

function payableToLabel(otherName = fallbackOtherName): string {
  const name = otherName.trim() || fallbackOtherName;
  if (name === fallbackOtherName) {
    return "לצד השני";
  }
  if (/^[\u0590-\u05FF]/.test(name)) {
    return `ל${name}`;
  }
  return `ל־${name}`;
}

export const entriesCopy = {
  addButton: "הוסף פעולה",
  modalTitle: "מה לעדכן בחשבון?",
  receiveLabel: (otherName = fallbackOtherName) => `${otherName} חייב לי`,
  receiveHelper: "כסף שמגיע אליי",
  payLabel: (otherName = fallbackOtherName) =>
    `אני חייב ${payableToLabel(otherName)}`,
  payHelper: "כסף שאני צריך לשלם",
  amountLabel: "סכום",
  titleLabel: "פירוט קצר — לא חובה",
  titlePlaceholder: "לדוגמה: עבודה, מקדמה, החזר, אספקה",
  submit: "שליחה לאישור",
  submitHint:
    "הפעולה לא נכנסת ליתרתך מיד. היא נשלחת לאישור הצד השני.",
  listTitle: "פעולות בכרטיס",
  emptyTitle: "עדיין אין פעולות בכרטיס",
  emptyBody: "הוסף פעולה כדי להתחיל לעדכן את החשבון.",
  pendingChip: "ממתין לאישור",
  pendingYourApproval: "ממתין לאישורך",
  pendingOtherSide: "ממתין לאישור הצד השני",
  approve: "אישור",
  reject: "דחייה",
  approving: "מאשרים…",
  rejecting: "דוחים…",
  approvedChip: "אושר",
  rejectedChip: "נדחה",
  edit: "עריכה",
  editModalTitle: "עריכת פעולה",
  editSubmit: "שמירת שינוי",
  saving: "שומרים…",
  noChange: "לא בוצע שינוי",
  cancel: "ביטול",
  cancelling: "מבטלים…",
  cancelledChip: "בוטל",
  addedByYou: "נוסף על ידך",
  addedByOther: (name: string) => `נוסף על ידי ${name}`,
} as const;
