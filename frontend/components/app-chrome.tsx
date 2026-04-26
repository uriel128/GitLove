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
    <div className="min-h-screen logged-in-gradient text-text">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute bottom-[-80px] left-1/3 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
      </div>
      <TopNav />
      <MainShell>{children}</MainShell>
    </div>
  );
}
