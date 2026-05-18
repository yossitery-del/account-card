/** ברכת חשבון לפי שעה מקומית — ללא שעון חי */

export function getTimeOfDayGreetingPrefix(now: Date = new Date()): string {
  const hour = now.getHours();

  if (hour >= 22 || hour < 5) {
    return "לילה טוב";
  }
  if (hour < 12) {
    return "בוקר טוב";
  }
  if (hour < 17) {
    return "צהריים טובים";
  }
  return "ערב טוב";
}

/** שם קצר לברכה: שם פרטי → קידומת אימייל → «שלום» */
export function resolveAccountGreetingName(
  displayName: string | null | undefined,
  email: string | null | undefined
): string {
  const trimmedName = displayName?.trim();
  if (trimmedName) {
    const firstName = trimmedName.split(/\s+/)[0]?.trim();
    if (firstName) {
      return firstName;
    }
  }

  const trimmedEmail = email?.trim();
  if (trimmedEmail?.includes("@")) {
    const prefix = trimmedEmail.split("@")[0]?.trim();
    if (prefix) {
      return prefix;
    }
  }

  return "שלום";
}

export function formatAccountGreeting(
  displayName: string | null | undefined,
  email: string | null | undefined,
  now: Date = new Date()
): string {
  const prefix = getTimeOfDayGreetingPrefix(now);
  const name = resolveAccountGreetingName(displayName, email);
  return `${prefix}, ${name}`;
}
