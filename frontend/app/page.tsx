"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogIn, Moon, Sparkles, Sun } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import iconImage from "./icon.png";

const profiles = [
  {
    name: "Nora, 25",
    role: "Frontend Engineer",
    tags: ["React", "TypeScript", "Coffee Dates"],
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Noah, 27",
    role: "Backend Engineer",
    tags: ["Node.js", "System Design", "Board Games"],
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Maya, 24",
    role: "ML Engineer",
    tags: ["Python", "LeetCode", "Sunset Walks"],
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80"
  }
];

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, login } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const guestTabs = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" }
  ];
  const signedInTabs = [
    { label: "Home", href: "/home" },
    { label: "Chat", href: "/chat" },
    { label: "Build Log", href: "/build-log" },
    { label: "Stack Trace", href: "/stack-trace" },
    { label: "Profile", href: "/profile" }
  ];
  const navTabs = isSignedIn ? signedInTabs : guestTabs;
  const profile = profiles[0];

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${
        isDark ? "bg-[#09070f] text-[#f4f0ff]" : "bg-[#ffffff] text-[#241338]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_15%_0%,rgba(109,40,217,0.25),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(139,92,246,0.18),transparent_40%)]"
            : "bg-[radial-gradient(circle_at_20%_0%,rgba(167,139,250,0.22),transparent_45%),radial-gradient(circle_at_85%_5%,rgba(196,181,253,0.28),transparent_35%)]"
        }`}
      >
      </div>

      <section id="home" className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:px-8">
        <div
          className={`mb-10 flex items-center justify-between rounded-full border px-3 py-2 ${
            isDark ? "border-violet-400/30 bg-[#120d1f]/92" : "border-violet-200 bg-white/90"
          }`}
        >
          <div className="flex items-center gap-2 px-2">
            <Image src={iconImage} alt="GitLove logo" width={18} height={18} className="h-[18px] w-[18px]" />
            <span className="text-sm font-semibold tracking-wide">GitLove</span>
          </div>
          <nav className="flex items-center gap-1">
            {navTabs.map((item, index) =>
              item.href.startsWith("#") ? (
                <a
                  key={item.label}
                  href={item.href}
                  className={`rounded-full px-4 py-1.5 text-sm ${
                    index === 0
                      ? "bg-violet-600 text-white"
                      : isDark
                        ? "text-white/85 hover:bg-white/10"
                        : "text-violet-900 hover:bg-violet-50"
                  }`}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-full px-4 py-1.5 text-sm ${
                    index === 0
                      ? "bg-violet-600 text-white"
                      : isDark
                        ? "text-white/85 hover:bg-white/10"
                        : "text-violet-900 hover:bg-violet-50"
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                isDark ? "border-violet-400/35 text-white" : "border-violet-200 text-violet-800"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              type="button"
              onClick={() => {
                login();
                router.push("/home");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white"
            >
              <LogIn size={14} />
              {isSignedIn ? "Open App" : "Log In"}
            </button>
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${isDark ? "bg-violet-500/20 text-violet-100" : "bg-violet-100 text-violet-900"}`}>
              <Sparkles size={13} className="text-violet-500" />
              Dating for developers who actually build
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Match by skill
            </h1>
            <p className={`mt-4 max-w-xl text-base md:text-lg ${isDark ? "text-white/78" : "text-violet-900/70"}`}>
              GitLove keeps it friendly and real: swipe profiles you like, then unlock the match by solving the same coding challenge together.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  login();
                  router.push("/home");
                }}
                className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white"
              >
                Start Swiping
              </button>
              <a
                href="#about"
                className={`rounded-full border px-6 py-2.5 text-sm font-semibold ${
                  isDark ? "border-violet-300/35 text-white/92" : "border-violet-200 text-violet-800"
                }`}
              >
                How It Works
              </a>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-2 text-center text-sm">
              <div className={`rounded-lg border p-3 ${isDark ? "border-violet-400/25 bg-white/5" : "border-violet-200 bg-violet-50/45"}`}>
                <div className="text-xl font-bold">18k+</div>
                <div className={isDark ? "text-white/70" : "text-violet-900/65"}>Active devs</div>
              </div>
              <div className={`rounded-lg border p-3 ${isDark ? "border-violet-400/25 bg-white/5" : "border-violet-200 bg-violet-50/45"}`}>
                <div className="text-xl font-bold">92%</div>
                <div className={isDark ? "text-white/70" : "text-violet-900/65"}>Reply rate</div>
              </div>
              <div className={`rounded-lg border p-3 ${isDark ? "border-violet-400/25 bg-white/5" : "border-violet-200 bg-violet-50/45"}`}>
                <div className="text-xl font-bold">1.3M</div>
                <div className={isDark ? "text-white/70" : "text-violet-900/65"}>Swipes</div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[400px]">
            <div
              className={`relative overflow-hidden rounded-[28px] border p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] ${
                isDark ? "border-violet-400/35 bg-[#130d20]" : "border-violet-200 bg-white"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className={`text-xs ${isDark ? "text-white/70" : "text-violet-900/60"}`}>Discover</span>
                <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">For You</span>
              </div>

              <article className="relative h-[460px] overflow-hidden rounded-[18px]">
                <img src={profile.image} alt={profile.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-2xl font-semibold text-white">{profile.name}</p>
                  <p className="mt-1 text-sm text-white/85">{profile.role}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {profile.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-violet-900">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" className={`rounded-full border py-2.5 text-sm font-semibold ${isDark ? "border-violet-300/45 bg-violet-500/10 text-violet-100" : "border-violet-200 bg-violet-50 text-violet-800"}`}>
                  Pass
                </button>
                <button type="button" className="rounded-full bg-violet-600 py-2.5 text-sm font-semibold text-white">
                  Send Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className={`relative border-y ${isDark ? "border-violet-400/20 bg-[#0f0b19]/92" : "border-violet-200 bg-violet-50/45"}`}>
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8">
          <h2 className="text-3xl font-semibold">How GitLove Works</h2>
          <p className={`mt-2 max-w-2xl ${isDark ? "text-white/70" : "text-violet-900/70"}`}>
            Keep the spark, remove the noise. Friendly swipes first, then code challenge verification before a match goes live.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              "Swipe right on a profile that feels like your type.",
              "Solve one coding challenge inside the in-app editor.",
              "If both pass the same challenge, chat unlocks instantly."
            ].map((line, i) => (
              <div
                key={line}
                className={`rounded-lg border p-4 text-sm ${
                  isDark ? "border-violet-400/25 bg-white/5 text-white/85" : "border-violet-200 bg-white text-violet-900/85"
                }`}
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-600">Step {i + 1}</p>
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative mx-auto w-full max-w-6xl px-4 py-14 md:px-8">
        <h3 className="text-2xl font-semibold">Contact</h3>
        <p className={`mt-2 max-w-2xl text-sm ${isDark ? "text-white/72" : "text-violet-900/70"}`}>
          Questions from your team? Reach out and we can share API contracts and integration notes for Home, Chat, Build Log, Stack Trace, and Profile.
        </p>
        <a
          href="mailto:team@gitlove.app"
          className="mt-5 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          team@gitlove.app
        </a>
      </section>
    </div>
  );
}
