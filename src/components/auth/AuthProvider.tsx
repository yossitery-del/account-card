"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase/client";
import { logFirebaseEnvDiagnostics } from "@/lib/firebase/config";
import { ensureUserProfile } from "@/lib/users/ensureUserProfile";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const FIREBASE_NOT_CONFIGURED_MESSAGE =
  "Firebase לא מוגדר. השלם את משתני הסביבה בקובץ .env.local והפעל מחדש את השרת.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    logFirebaseEnvDiagnostics();

    if (!isFirebaseConfigured()) {
      startTransition(() => {
        setError(FIREBASE_NOT_CONFIGURED_MESSAGE);
        setLoading(false);
      });
      return;
    }

    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);

        if (firebaseUser) {
          try {
            await ensureUserProfile(firebaseUser);
            setError(null);
          } catch (profileError) {
            console.error("ensureUserProfile failed:", profileError);
            setError("לא הצלחנו לשמור את פרופיל המשתמש. נסה שוב.");
          }
        }

        setLoading(false);
      },
      (authError) => {
        console.error("onAuthStateChanged error:", authError);
        setError("שגיאה באימות. נסה שוב.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, clearError }),
    [user, loading, error, clearError]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth חייב לשמש בתוך AuthProvider");
  }
  return context;
}
