/** נוסח UI לכרטיסים — copy בלבד */

export const cardsCopy = {
  balanceInCard: "יתרתך",
  pendingApproval: "ממתין לאישורך",
  pendingYourApproval: "ממתין לאישורך",
  pendingAwaitingCount: (count: number) =>
    `${count} פעולות ממתינות לאישורך`,
  openToReviewPending: "פתח את הכרטיס כדי לעבור עליהן",
} as const;
