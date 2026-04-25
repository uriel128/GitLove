"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isSignedIn, login } = useAuth();

  if (isSignedIn) {
    return <>{children}</>;
  }

  return (
    <section className="mx-auto mt-16 max-w-md rounded-md border border-line bg-panel p-6 text-center">
      <h1 className="text-lg font-semibold">Sign In Required</h1>
      <p className="mt-2 text-sm text-muted">
        Log in from the landing page to access Home, Chat, Build Log, Stack Trace, and Profile.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            login();
            router.push("/home");
          }}
          className="rounded-md border border-accent/60 bg-accent/10 px-4 py-2 text-sm text-accent"
        >
          Log In
        </button>
        <Link href="/" className="rounded-md border border-line px-4 py-2 text-sm text-muted">
          Back To Landing
        </Link>
      </div>
    </section>
  );
}
