"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Github, Loader2 } from "lucide-react";

type AuthMode = "login" | "signup";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentUser,
    supabaseConfigured,
    supabaseConfigIssues,
    isReady,
    isSignedIn,
    loginWithEmail,
    loginWithGoogle,
    loginWithGitHub,
    logout,
    signupWithEmail
  } = useAuth();
  
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setMode("signup");
    } else {
      setMode("login");
    }
  }, [searchParams]);

  useEffect(() => {
    if (isReady) {
      setBusy(false);
    }
  }, [isReady, isSignedIn]);

  async function handleSubmit() {
    setBusy(true);
    setStatus("");
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        setStatus("Login successful. Opening app...");
        router.push("/home");
      } else {
        const result = await signupWithEmail(name, email, password);
        if (result.signedIn) {
          setStatus("Account created. Continue with your profile setup...");
          router.push("/onboarding/profile");
        } else {
          setStatus("Account created and stored. Check your email to verify, then sign in.");
          setMode("login");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGitHub() {
    setBusy(true);
    setStatus("");
    try {
      await loginWithGitHub();
      setStatus("Redirecting to GitHub OAuth...");
      window.setTimeout(() => setBusy(false), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "GitHub auth failed";
      setStatus(message);
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setStatus("");
    try {
      await loginWithGoogle();
      setStatus("Redirecting to Google OAuth...");
      window.setTimeout(() => setBusy(false), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google auth failed";
      setStatus(message);
      setBusy(false);
    }
  }

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
        <p>Initializing Authentication...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center justify-center bg-panel p-3 rounded-2xl border border-line shadow-[0_0_20px_rgba(56,189,248,0.15)] mb-6 transition-transform hover:scale-105">
          <Logo className="w-8 h-8" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-text">
          {mode === "login" ? "Welcome back" : "Start Compiling Love"}
        </h1>
        <p className="mt-2 text-muted">
          {mode === "login" ? "Log in to your GitLove account" : "Join the #1 dating app for developers"}
        </p>
      </div>

      <div className="bg-panel/80 backdrop-blur-xl border border-line rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
        
        <div className="relative z-10">
          <div className="flex rounded-xl bg-panelAlt p-1 mb-6 border border-line">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                mode === "login" ? "bg-accent text-white shadow-md" : "text-muted hover:text-text"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                mode === "signup" ? "bg-accent text-white shadow-md" : "text-muted hover:text-text"
              }`}
            >
              Sign Up
            </button>
          </div>

          {!supabaseConfigured ? (
            <div className="mb-6 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm">
              <div className="font-medium text-warn">Supabase config is incomplete</div>
              <div className="mt-1 text-warn/80 text-xs">
                Missing: {supabaseConfigIssues.join(", ")}
              </div>
            </div>
          ) : null}

          {isSignedIn ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-ok/20 text-ok rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-text">You're already logged in!</h3>
              <p className="text-muted text-sm mb-6">Signed in as {currentUser?.email}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/home")}
                  className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-bold text-white hover:bg-accent/90 transition-colors"
                >
                  Go to App
                </button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-full border border-line bg-panel px-6 py-3 text-sm font-medium text-text hover:bg-panelAlt transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => void handleGitHub()}
                disabled={busy || !supabaseConfigured}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-line bg-[#24292e] px-4 py-3 text-sm font-medium text-white hover:bg-[#2f363d] transition-colors disabled:opacity-50"
              >
                <Github className="w-5 h-5" />
                Continue with GitHub
              </button>

              <button
                type="button"
                onClick={() => void handleGoogle()}
                disabled={busy || !supabaseConfigured}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-line bg-panelAlt px-4 py-3 text-sm font-medium text-text hover:bg-line/50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-line"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-muted font-medium">OR CONTINUE WITH EMAIL</span>
                <div className="flex-grow border-t border-line"></div>
              </div>

              {mode === "signup" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text pl-1">Display Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-line bg-panelAlt px-4 py-3 text-sm text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="e.g. Linus Torvalds"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text pl-1">Email Address</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-panelAlt px-4 py-3 text-sm text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  placeholder="you@example.com"
                  type="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text pl-1">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-line bg-panelAlt px-4 py-3 text-sm text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  placeholder="Minimum 6 characters"
                  type="password"
                />
              </div>

              {status && (
                <div className="mt-2 text-sm text-center p-3 rounded-xl bg-panelAlt border border-line text-text">
                  {status}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={
                  busy ||
                  !supabaseConfigured ||
                  !email.trim() ||
                  !password.trim() ||
                  (mode === "signup" && !name.trim())
                }
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-accent to-purple-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Working...
                  </span>
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-center text-xs text-muted">
        By continuing, you agree to GitLove's <Link href="/about?tab=terms" className="underline hover:text-text">Terms of Service</Link> and <Link href="/about?tab=privacy" className="underline hover:text-text">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#1a102d] dark:via-[#0d0714] dark:to-[#0a0518]">
      {/* Global Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      <Suspense fallback={<div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
        <AuthContent />
      </Suspense>
    </div>
  );
}
