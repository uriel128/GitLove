"use client";

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
    if (!isReady) {
      return;
    }

    if (!isSignedIn) {
      router.replace("/");
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

  return null;
}
