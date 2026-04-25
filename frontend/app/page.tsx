"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Code2,
  Heart,
  MessageSquareText,
  Moon,
  Sun,
  TerminalSquare
} from "lucide-react";

const protocolItems = [
  { title: "Swipe", description: "Browse profiles and choose who you want to challenge." },
  { title: "Challenge", description: "Right swipe opens a coding prompt matched to your level." },
  { title: "One Try", description: "You get exactly one attempt to pass and send interest." },
  { title: "Handshake", description: "Recipient solves the same prompt to finalize match." },
  { title: "Merge", description: "Passed both sides unlocks chat with markdown + code." }
];

const pageItems = [
  { title: "Home", description: "Swipe and launch Proof of Work challenge gate.", href: "/home" },
  { title: "Chat", description: "Real-time matched chat with markdown + code.", href: "/chat" },
  { title: "User Profile", description: "Set your 12 standardized developer signals.", href: "/profile" },
  { title: "Build Log", description: "Track success rate, commits, pending pull requests.", href: "/build-log" },
  { title: "Stack Trace", description: "Global trends, live merges, and language momentum.", href: "/stack-trace" }
];

export default function LandingPage() {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const dark = mode === "dark";

  return (
    <div className={dark ? "bg-[#0b0f14] text-slate-100" : "bg-slate-50 text-slate-900"}>
      <section className="relative h-[74vh] min-h-[540px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1800&q=80"
          alt="Developers collaborating with laptops"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className={`absolute inset-0 ${dark ? "bg-black/60" : "bg-white/45"}`} />

        <button
          type="button"
          onClick={() => setMode(dark ? "light" : "dark")}
          className={`absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-md border ${
            dark
              ? "border-slate-300/40 bg-black/30 text-slate-100"
              : "border-slate-700/30 bg-white/70 text-slate-900"
          }`}
          aria-label="Toggle theme"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-5 md:px-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${dark ? "text-cyan-300" : "text-cyan-700"}`}>
            Tinder For Developers
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight md:text-6xl">GitLove</h1>
          <p className={`mt-4 max-w-2xl text-base md:text-lg ${dark ? "text-slate-200" : "text-slate-800"}`}>
            Proof-of-work dating where every right swipe compiles into a real coding challenge before a match request
            can be sent.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/home"
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium ${
                dark
                  ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-200"
                  : "border-cyan-700/40 bg-cyan-600/10 text-cyan-900"
              }`}
            >
              Enter App <ArrowRight size={16} />
            </Link>
            <Link
              href="/stack-trace"
              className={`rounded-md border px-4 py-2 text-sm ${
                dark ? "border-slate-300/40 bg-black/20 text-slate-100" : "border-slate-900/20 bg-white/70"
              }`}
            >
              View Live Trends
            </Link>
          </div>

          <div className={`mt-7 flex items-center gap-2 text-xs ${dark ? "text-slate-300" : "text-slate-700"}`}>
            <Activity size={14} />
            Dark and light mode included for both testing and demos
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <div className="flex items-center gap-2">
          <TerminalSquare size={18} className={dark ? "text-cyan-300" : "text-cyan-700"} />
          <h2 className="text-xl font-semibold">Matching Protocol</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {protocolItems.map((item, index) => (
            <div
              key={item.title}
              className={`rounded-md border p-3 ${
                dark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"
              }`}
            >
              <div className={`text-xs ${dark ? "text-cyan-300" : "text-cyan-700"}`}>{String(index + 1).padStart(2, "0")}</div>
              <div className="mt-1 text-sm font-semibold">{item.title}</div>
              <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`border-y ${dark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 md:grid-cols-[1fr_280px] md:px-8">
          <div>
            <h2 className="text-2xl font-semibold">Built For Developer Culture</h2>
            <p className={`mt-3 max-w-2xl text-sm leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>
              GitLove keeps matching high-friction and high-signal. Instead of low-effort swipes, every meaningful
              connection is gated by logic, syntax, and one-attempt execution.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <SignalCard dark={dark} icon={Heart} title="Proof of Work" text="Right swipe opens mandatory coding gate." />
              <SignalCard dark={dark} icon={Code2} title="Monaco Flow" text="Challenge solving inside built-in IDE." />
              <SignalCard dark={dark} icon={MessageSquareText} title="Dev Chat" text="Post-match markdown and code sharing." />
            </div>
          </div>

          <div className={`rounded-md border p-4 ${dark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-slate-50"}`}>
            <div className="text-xs uppercase tracking-wider text-cyan-600">Mode</div>
            <div className="mt-2 text-sm font-semibold">{dark ? "Dark / Matrix Style" : "Light / Clean Style"}</div>
            <p className={`mt-2 text-xs leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>
              Toggle available at hero top-right for QA, demos, and visual checks.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <h2 className="text-xl font-semibold">App Surfaces</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {pageItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`rounded-md border p-3 transition ${
                dark
                  ? "border-slate-800 bg-slate-900/60 hover:border-cyan-500/40"
                  : "border-slate-200 bg-white hover:border-cyan-600/40"
              }`}
            >
              <div className="text-sm font-semibold">{item.title}</div>
              <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SignalCard({
  dark,
  icon: Icon,
  title,
  text
}: {
  dark: boolean;
  icon: typeof Heart;
  title: string;
  text: string;
}) {
  return (
    <div className={`rounded-md border p-3 ${dark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
      <Icon size={16} className={dark ? "text-cyan-300" : "text-cyan-700"} />
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>{text}</p>
    </div>
  );
}
