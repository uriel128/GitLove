"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Home, Terminal, GitBranch, MessageSquare, LogOut, Settings, UserCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isSignedIn, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileImage = "/images/admin.png";
  
  const isLanding = pathname === "/";
  const isAuth = pathname === "/login";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLanding || isAuth) {
    return null;
  }

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/build-log", label: "Build Log", icon: Terminal },
    { href: "/stack-trace", label: "Stack Trace", icon: GitBranch },
    { href: "/chat", label: "Chat", icon: MessageSquare }
  ];

  return (
    <header className="h-16 w-full border-b border-line/80 bg-gradient-to-r from-panel/95 via-panel/90 to-panelAlt/95 backdrop-blur-xl transition-all fixed top-0 z-50">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-6">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <Logo className="w-5 h-5" />
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
                    ? "bg-gradient-to-r from-cyan-500/15 to-fuchsia-500/15 text-accent border border-cyan-400/30 shadow-sm"
                    : "text-muted hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-fuchsia-500/10 hover:text-text border border-transparent"
                )}
              >
                <Icon className={clsx("w-4 h-4", active ? "text-accent" : "text-muted/70")} />
                <span className="hidden md:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="w-px h-6 bg-line hidden sm:block"></div>
          
          {isSignedIn && currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center rounded-full border border-cyan-300/30 bg-gradient-to-r from-panelAlt to-panel p-1 hover:from-cyan-500/10 hover:to-fuchsia-500/10 transition-colors"
              >
                <img src={profileImage} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-line bg-gradient-to-b from-panel to-panelAlt shadow-lg overflow-hidden flex flex-col z-50">
                  <Link 
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-text hover:bg-panelAlt transition-colors"
                  >
                    <UserCircle className="w-4 h-4 text-muted" />
                    Profile
                  </Link>
                  <Link 
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-text hover:bg-panelAlt transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted" />
                    Settings
                  </Link>
                  <div className="h-px w-full bg-line" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      router.push("/");
                    }}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
        
      </div>
    </header>
  );
}
