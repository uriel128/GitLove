"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { apiRequest } from "@/lib/api";
import { getFirebaseAuth, getFirebaseConfigIssues, isFirebaseConfigured } from "@/lib/firebase";
import { User } from "@/lib/types";

type AuthSyncResponse = {
  appUser: User;
};

type AuthContextValue = {
  isReady: boolean;
  isSignedIn: boolean;
  currentUserId: string | null;
  currentUser: User | null;
  firebaseConfigured: boolean;
  firebaseConfigIssues: string[];
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const firebaseConfigured = isFirebaseConfigured();
  const firebaseConfigIssues = getFirebaseConfigIssues();

  useEffect(() => {
    if (!firebaseConfigured) {
      setCurrentUser(null);
      setIsReady(true);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setCurrentUser(null);
      setIsReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setIsReady(true);
        return;
      }

      try {
        const appUser = await syncFirebaseUser(firebaseUser);
        setCurrentUser(appUser);
      } catch (error) {
        console.error("Failed to sync Firebase user with backend", error);
        setCurrentUser(null);
      } finally {
        setIsReady(true);
      }
    });

    return unsubscribe;
  }, [firebaseConfigured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isSignedIn: Boolean(currentUser),
      currentUserId: currentUser?.id ?? null,
      currentUser,
      firebaseConfigured,
      firebaseConfigIssues,
      loginWithEmail: async (email, password) => {
        const auth = requireFirebaseAuth();
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const appUser = await syncFirebaseUser(credential.user);
        setCurrentUser(appUser);
      },
      signupWithEmail: async (name, email, password) => {
        const auth = requireFirebaseAuth();
        const normalizedName = name.trim();
        const normalizedEmail = email.trim();
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

        if (normalizedName) {
          await updateProfile(credential.user, { displayName: normalizedName });
        }

        const appUser = await syncFirebaseUser(credential.user);
        setCurrentUser(appUser);
      },
      logout: async () => {
        const auth = getFirebaseAuth();
        setCurrentUser(null);
        if (auth) {
          await signOut(auth);
        }
      }
    }),
    [currentUser, firebaseConfigIssues, firebaseConfigured, isReady]
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

async function syncFirebaseUser(firebaseUser: FirebaseUser) {
  const token = await firebaseUser.getIdToken();
  const response = await apiRequest<AuthSyncResponse>("/auth/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.appUser;
}

function requireFirebaseAuth() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase auth is not configured on the frontend");
  }

  return auth;
}
