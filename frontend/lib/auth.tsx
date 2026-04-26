"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiRequest } from "@/lib/api";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigIssues,
  isSupabaseConfigured
} from "@/lib/supabase/client";
import { User } from "@/lib/types";

type AuthSyncResponse = {
  appUser: User;
};

type AuthContextValue = {
  isReady: boolean;
  isSignedIn: boolean;
  currentUserId: string | null;
  currentUser: User | null;
  supabaseConfigured: boolean;
  supabaseConfigIssues: string[];
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ signedIn: boolean; requiresConfirmation?: boolean }>;
  loginWithGitHub: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabaseConfigured = isSupabaseConfigured();
  const supabaseConfigIssues = getSupabaseConfigIssues();

  useEffect(() => {
    if (!supabaseConfigured) {
      setCurrentUser(null);
      setIsReady(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setCurrentUser(null);
      setIsReady(true);
      return;
    }

    let active = true;

    const bootstrap = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!session?.access_token) {
        setCurrentUser(null);
        setIsReady(true);
        return;
      }

      try {
        const appUser = await syncSupabaseUser(session.access_token);
        if (active) {
          setCurrentUser(appUser);
        }
      } catch (error) {
        console.error("Failed to sync Supabase user", error);
        if (active) {
          setCurrentUser(null);
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    void bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) {
        return;
      }

      if (!session?.access_token) {
        setCurrentUser(null);
        setIsReady(true);
        return;
      }

      try {
        const appUser = await syncSupabaseUser(session.access_token);
        if (active) {
          setCurrentUser(appUser);
        }
      } catch (error) {
        console.error("Failed to sync Supabase user", error);
        if (active) {
          setCurrentUser(null);
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isSignedIn: Boolean(currentUser),
      currentUserId: currentUser?.id ?? null,
      currentUser,
      supabaseConfigured,
      supabaseConfigIssues,
      loginWithEmail: async (email, password) => {
        const supabase = requireSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error || !data.session?.access_token) {
          throw new Error(error?.message ?? "Login failed");
        }

        const appUser = await syncSupabaseUser(data.session.access_token);
        setCurrentUser(appUser);
      },
      signupWithEmail: async (name, email, password) => {
        const supabase = requireSupabaseClient();
        const normalizedName = name.trim();
        const normalizedEmail = email.trim();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name: normalizedName
            }
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data.session?.access_token) {
          if (data.user?.id && data.user.email) {
            await provisionSupabaseUser({
              id: data.user.id,
              email: data.user.email,
              name: normalizedName || null
            });
          }

          return {
            signedIn: false,
            requiresConfirmation: true
          };
        }

        const appUser = await syncSupabaseUser(data.session.access_token);
        setCurrentUser(appUser);
        return { signedIn: true };
      },
      loginWithGitHub: async () => {
        const supabase = requireSupabaseClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: `${window.location.origin}/onboarding/profile`
          }
        });

        if (error) {
          throw new Error(error.message);
        }
      },
      loginWithGoogle: async () => {
        const supabase = requireSupabaseClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/onboarding/profile`
          }
        });

        if (error) {
          throw new Error(error.message);
        }
      },
      logout: async () => {
        const supabase = getSupabaseBrowserClient();
        setCurrentUser(null);
        if (supabase) {
          await supabase.auth.signOut();
        }
      }
    }),
    [currentUser, isReady, supabaseConfigured, supabaseConfigIssues]
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

async function syncSupabaseUser(accessToken: string) {
  const response = await apiRequest<AuthSyncResponse>("/auth/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.appUser;
}

async function provisionSupabaseUser(input: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const response = await apiRequest<AuthSyncResponse>("/auth/provision", {
    method: "POST",
    body: input
  });

  return response.appUser;
}

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase is not configured on the frontend");
  }

  return supabase;
}
