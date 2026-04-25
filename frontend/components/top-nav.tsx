"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/profile", label: "User Profile" },
  { href: "/build-log", label: "Build Log" },
  { href: "/stack-trace", label: "Stack Trace" }
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-panel/90">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="text-sm font-semibold tracking-wide text-accent">GitLove</div>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-md border px-3 py-1.5 text-sm transition",
                pathname === item.href
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-muted hover:border-accent/50 hover:text-text"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
