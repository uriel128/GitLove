"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const {
    currentUser,
    firebaseConfigured,
    firebaseConfigIssues,
    isReady,
    isSignedIn,
    loginWithEmail,
    logout,
    signupWithEmail
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Use Firebase credentials to enter GitLove.");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        setStatus("Login successful. Opening app...");
      } else {
        await signupWithEmail(name, email, password);
        setStatus("Account created. Opening app...");
      }
      router.push("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  if (!isReady) {
    return (
      <section className="mx-auto mt-20 max-w-xl rounded-3xl border border-line bg-panel p-8">
        <h1 className="text-2xl font-semibold">Loading Auth</h1>
        <p className="mt-3 text-sm text-muted">Restoring your Firebase session.</p>
      </section>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-6xl items-center px-4 py-10 md:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-line bg-panel p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">GitLove Auth</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Log in with Firebase,
            <br />
            then open the app.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted">
            This splash page handles Firebase login, Firebase signup, and backend user sync through
            `/api/auth/sync`.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-panelAlt p-4">
              <div className="text-xl font-semibold">1</div>
              <div className="mt-2 text-sm text-muted">Authenticate against Firebase Auth.</div>
            </div>
            <div className="rounded-2xl border border-line bg-panelAlt p-4">
              <div className="text-xl font-semibold">2</div>
              <div className="mt-2 text-sm text-muted">Exchange the ID token with the backend.</div>
            </div>
            <div className="rounded-2xl border border-line bg-panelAlt p-4">
              <div className="text-xl font-semibold">3</div>
              <div className="mt-2 text-sm text-muted">Open Home with a real GitLove app user.</div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-panelAlt p-4 text-sm">
            <div className="font-medium">Backend-linked session</div>
            <div className="mt-2 text-muted">
              {isSignedIn && currentUser
                ? `${currentUser.name} (${currentUser.email})`
                : "No active app session"}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-line bg-panel p-8">
          <div className="flex rounded-full border border-line bg-panelAlt p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-4 py-2 text-sm ${
                mode === "login" ? "bg-accent text-white" : "text-muted"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full px-4 py-2 text-sm ${
                mode === "signup" ? "bg-accent text-white" : "text-muted"
              }`}
            >
              Create Account
            </button>
          </div>

          {!firebaseConfigured ? (
            <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              <div className="font-medium text-amber-200">Firebase client config is incomplete</div>
              <div className="mt-2 text-amber-100/80">
                Missing: {firebaseConfigIssues.join(", ")}
              </div>
              <div className="mt-2 text-amber-100/80">
                Add those values to `frontend/.env.local` so this page can authenticate with Firebase.
              </div>
            </div>
          ) : null}

          {mode === "signup" ? (
            <label className="mt-6 block">
              <span className="text-xs text-muted">Display Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-line bg-panelAlt px-4 py-3 text-sm"
                placeholder="Nora Dev"
              />
            </label>
          ) : null}

          <label className="mt-6 block">
            <span className="text-xs text-muted">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-panelAlt px-4 py-3 text-sm"
              placeholder="you@example.com"
              type="email"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs text-muted">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-panelAlt px-4 py-3 text-sm"
              placeholder="At least 6 characters"
              type="password"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              busy ||
              !firebaseConfigured ||
              !email.trim() ||
              !password.trim() ||
              (mode === "signup" && !name.trim())
            }
            className="mt-6 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Working..." : mode === "login" ? "Login" : "Create Account"}
          </button>

          {isSignedIn ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="rounded-2xl border border-accent/60 bg-accent/10 px-4 py-3 text-sm text-accent"
              >
                Open App
              </button>
              <button
                type="button"
                onClick={() => {
                  void logout();
                }}
                className="rounded-2xl border border-line px-4 py-3 text-sm text-muted"
              >
                Log Out
              </button>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-line bg-panelAlt p-4 text-sm text-muted">
            {status}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <Link href="/" className="hover:text-text">
              Back to landing
            </Link>
            <span>Firebase + Nest backend</span>
          </div>
        </section>
      </div>
    </div>
  );
}
