"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MainShell } from "@/components/main-shell";
import { TopNav } from "@/components/top-nav";

const STANDALONE_PATH_PREFIXES = ["/login", "/onboarding"];

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isStandalone) {
    return <div className="min-h-screen bg-bg text-text">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <TopNav />
      <MainShell>{children}</MainShell>
    </div>
  );
}
