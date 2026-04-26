"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "./logo";

const signedInItems = [
  { href: "/", label: "Landing" },
  { href: "/home", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/profile", label: "Profile" },
  { href: "/build-log", label: "Build Log" },
  { href: "/stack-trace", label: "Stack Trace" }
];

const guestItems = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" }
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isSignedIn, logout } = useAuth();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const isAdmin = Boolean(adminEmail) && currentUser?.email.trim().toLowerCase() === adminEmail;
  const navItems = isSignedIn
    ? isAdmin
      ? [...signedInItems, { href: "/admin", label: "Admin" }]
      : signedInItems
    : guestItems;
  const isLanding = pathname === "/";
  const isGuestLanding = !isSignedIn && isLanding;

  if (isLanding) {
    return null;
  }

  return (
    <header className={clsx("border-b border-line", isGuestLanding ? "bg-transparent" : "bg-panel/90")}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <Logo className="w-[18px] h-[18px]" />
          <div className={clsx("text-sm font-semibold tracking-wide", isGuestLanding ? "text-white" : "text-accent")}>GitLove</div>
        </div>
        <nav
          className={clsx(
            "flex flex-wrap items-center gap-2 text-sm",
            isGuestLanding && "rounded-full border border-white/10 bg-[#2a1046]/70 px-2 py-1 backdrop-blur"
          )}
        >
          {navItems.map((item) => {
            const active = isSignedIn ? pathname === item.href : pathname === "/" && item.label === "Home";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  isGuestLanding
                    ? active
                      ? "border-white/40 bg-white text-[#2a1046]"
                      : "border-transparent text-white/80 hover:text-white"
                    : active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line text-muted hover:border-accent/50 hover:text-text"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {!isSignedIn ? (
            <button
              type="button"
              onClick={() => {
                router.push("/login");
              }}
              className={clsx(
                "rounded-full border px-4 py-1.5 text-sm",
                isGuestLanding
                  ? "border-white/30 bg-transparent text-white hover:border-white/60"
                  : "border-accent/60 bg-accent/10 text-accent"
              )}
            >
              Login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="rounded-full border border-line px-3 py-1.5 text-sm text-muted"
            >
              Log Out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
