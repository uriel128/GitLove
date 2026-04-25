"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  isSignedIn: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "gitlove_signed_in";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setIsSignedIn(true);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isSignedIn,
      login: () => {
        setIsSignedIn(true);
        window.localStorage.setItem(STORAGE_KEY, "true");
      },
      logout: () => {
        setIsSignedIn(false);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }),
    [isSignedIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
