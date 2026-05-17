/** פרופיל משתמש — users/{uid}. Stage 1: בסיסי בלבד, לא מקור הרשאות. */

export type UserSettings = {
  locale: "he";
  timezone?: string;
};

export type UserProfile = {
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: unknown;
  updatedAt: unknown;
  settings: UserSettings;
};
