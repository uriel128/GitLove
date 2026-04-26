"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Home, Terminal, GitBranch, MessageSquare, UserCircle } from "lucide-react";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isSignedIn, logout } = useAuth();
  
  const isLanding = pathname === "/";
  const isAuth = pathname === "/login";
  const isGuestLanding = !isSignedIn && isLanding;

  if (isLanding || isAuth) {
    return null;
  }

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/build-log", label: "Build Log", icon: Terminal },
    { href: "/stack-trace", label: "Stack Trace", icon: GitBranch },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/profile", label: "Profile", icon: UserCircle }
  ];

  return (
    <header className="h-16 w-full border-b border-line bg-panel/80 backdrop-blur-xl transition-all fixed top-0 z-50">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-6">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center bg-accent/10 p-1.5 rounded-lg border border-accent/20 shadow-[0_0_10px_rgba(56,189,248,0.1)]">
            <Logo className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:block">GitLove</span>
        </div>
        
        {/* Main Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-accent/10 text-accent border border-accent/20 shadow-sm"
                    : "text-muted hover:bg-panelAlt hover:text-text border border-transparent"
                )}
              >
                <Icon className={clsx("w-4 h-4", active ? "text-accent" : "text-muted/70")} />
                <span className="hidden md:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="w-px h-6 bg-line hidden sm:block"></div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-xs font-semibold text-muted hover:text-text transition-colors"
          >
            Log Out
          </button>
        </div>
        
      </div>
    </header>
  );
}
