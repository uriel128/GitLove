"use client";

import clsx from "clsx";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main
      className={clsx(
        pathname === "/" ? "w-full" : "mx-auto w-full max-w-7xl px-4 py-6 md:px-6"
      )}
    >
      {children}
    </main>
  );
}
