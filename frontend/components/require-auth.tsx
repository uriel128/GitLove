"use client";

import Link from "next/link";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile-complete";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isReady, isSignedIn, currentUser } = useAuth();
  const onOnboarding = pathname.startsWith("/onboarding");
  const profileComplete = isProfileComplete(currentUser);

  useEffect(() => {
    if (!isReady || !isSignedIn) {
      return;
    }

    if (!profileComplete && !onOnboarding) {
      router.replace("/onboarding/profile");
      return;
    }

    if (profileComplete && onOnboarding) {
      router.replace("/home");
    }
  }, [isReady, isSignedIn, onOnboarding, profileComplete, router]);

  if (!isReady) {
    return (
      <section className="mx-auto mt-16 max-w-md rounded-md border border-line bg-panel p-6 text-center">
        <h1 className="text-lg font-semibold">Restoring Session</h1>
        <p className="mt-2 text-sm text-muted">Loading your GitLove account context.</p>
      </section>
    );
  }

  if (isSignedIn) {
    if ((!profileComplete && !onOnboarding) || (profileComplete && onOnboarding)) {
      return (
        <section className="mx-auto mt-16 max-w-md rounded-md border border-line bg-panel p-6 text-center">
          <h1 className="text-lg font-semibold">Redirecting</h1>
          <p className="mt-2 text-sm text-muted">Updating your account flow…</p>
        </section>
      );
    }
    return <>{children}</>;
  }

  return (
    <section className="mx-auto mt-16 max-w-md rounded-md border border-line bg-panel p-6 text-center">
      <h1 className="text-lg font-semibold">Sign In Required</h1>
      <p className="mt-2 text-sm text-muted">
        Log in from the auth splash page to access Home, Chat, Build Log, Stack Trace, and Profile.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            router.push("/login");
          }}
          className="rounded-md border border-accent/60 bg-accent/10 px-4 py-2 text-sm text-accent"
        >
          Login
        </button>
        <Link href="/login" className="rounded-md border border-line px-4 py-2 text-sm text-muted">
          Open Splash
        </Link>
      </div>
    </section>
  );
}
