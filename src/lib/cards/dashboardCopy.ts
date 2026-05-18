/** נוסח כותרת דשבורד — «כרטיס» / «כרטיס חשבון» */

export function activeCardsLabel(count: number): string {
  if (count === 1) {
    return "כרטיס חשבון פעיל";
  }
  return `${count} כרטיסי חשבון`;
}

export function pendingCardsLabel(count: number): string | null {
  if (count === 0) {
    return null;
  }
  if (count === 1) {
    return "ממתין לאישור בכרטיס אחד";
  }
  return `ממתין לאישור ב־${count} כרטיסים`;
}
