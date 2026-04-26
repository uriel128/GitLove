"use client";

import clsx from "clsx";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isLandingOrAuth = pathname === "/" || pathname === "/login" || pathname === "/about";
  const isDashboard = pathname === "/home";

  return (
    <main
      className={clsx(
        isLandingOrAuth
          ? "w-full"
          : isDashboard
          ? "w-full pt-16 h-screen overflow-hidden" // strict bounded layout for dashboard
          : "mx-auto w-full max-w-7xl px-4 py-6 md:px-6 pt-24" // generic app pages with padding
      )}
    >
      {children}
    </main>
  );
}
