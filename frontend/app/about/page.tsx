"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2, FileText, Shield, Scale, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import Link from "next/link";

type Tab = "documentation" | "privacy" | "terms" | "contact";

function AboutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialTab = (searchParams.get("tab") as Tab) || "documentation";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab && ["documentation", "privacy", "terms", "contact"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/about?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen text-text pt-20 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#08060c] dark:via-[#06040a] dark:to-[#06040a]">
      <header className="fixed top-0 inset-x-0 z-50 w-full border-b border-black/[0.05] dark:border-transparent bg-slate-50/80 dark:bg-[#08060c]/50 backdrop-blur-xl transition-all h-16 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center bg-accent/10 p-1.5 rounded-lg border border-accent/20">
            <Logo className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">GitLove</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            GitLove Directory
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Everything you need to know about how we operate, our privacy standards, and getting in touch.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 p-2 rounded-2xl bg-panel border border-line shadow-lg">
          <button
            onClick={() => handleTabChange("documentation")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "documentation" ? "bg-accent text-white shadow-md" : "text-muted hover:text-text hover:bg-panelAlt"
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentation
          </button>
          <button
            onClick={() => handleTabChange("privacy")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "privacy" ? "bg-purple-500 text-white shadow-md" : "text-muted hover:text-text hover:bg-panelAlt"
            }`}
          >
            <Shield className="w-4 h-4" />
            Privacy
          </button>
          <button
            onClick={() => handleTabChange("terms")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "terms" ? "bg-pink-500 text-white shadow-md" : "text-muted hover:text-text hover:bg-panelAlt"
            }`}
          >
            <Scale className="w-4 h-4" />
            Terms
          </button>
          <button
            onClick={() => handleTabChange("contact")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "contact" ? "bg-ok text-white shadow-md" : "text-muted hover:text-text hover:bg-panelAlt"
            }`}
          >
            <Mail className="w-4 h-4" />
            Contact
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-panel/50 border border-line rounded-[2rem] p-8 md:p-12 shadow-xl prose prose-invert max-w-none">
          {activeTab === "documentation" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold mb-6 text-text">Motivation & Goals</h2>
              <div className="space-y-6 text-muted leading-relaxed">
                <p>
                  GitLove was built to solve a specific problem: generic dating apps don't understand the unique lifestyle, passions, and workflows of software engineers. We wanted to build a space where dropping a React component reference or discussing the merits of Rust isn't met with confusion, but is actually an icebreaker.
                </p>
                <p>
                  Our goal is to create the most high-fidelity, high-signal dating pool exclusively for developers and tech enthusiasts. 
                </p>
                <h3 className="text-xl font-semibold text-text mt-8">How Matching Works</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Proof of Work:</strong> Connect your GitHub to verify you're a real developer.</li>
                  <li><strong>The DSA Gateway:</strong> Prove your skills with daily coding challenges to unlock right-swipes.</li>
                  <li><strong>Stack Matching:</strong> We pair you with users who use complementary or identical tech stacks.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold mb-6 text-text">Privacy Policy</h2>
              <div className="space-y-6 text-muted leading-relaxed">
                <p>Last updated: April 2026</p>
                <p>
                  At GitLove, we treat your data the way we treat our own production databases: with extreme care, encryption, and strict access controls. 
                </p>
                <h3 className="text-xl font-semibold text-text mt-8">Data We Collect</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Profile Data:</strong> Name, tech stack, bio, and uploaded images.</li>
                  <li><strong>GitHub Data:</strong> Read-only access to your public commit history and repositories to generate the Build Log. We <strong>never</strong> ask for write access.</li>
                  <li><strong>Chat Data:</strong> End-to-end encrypted markdown messages between matches.</li>
                </ul>
                <p className="mt-8">We will never sell your data to third parties. We are funded by premium subscriptions, not by selling your information.</p>
              </div>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold mb-6 text-text">Terms of Service</h2>
              <div className="space-y-6 text-muted leading-relaxed">
                <p>
                  By using GitLove, you agree to abide by our community guidelines. We maintain a zero-tolerance policy for harassment, bots, and toxic behavior.
                </p>
                <h3 className="text-xl font-semibold text-text mt-8">Community Guidelines</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>No Bots:</strong> Automated scraping, botting, or using scripts to artificially swipe or message is strictly prohibited.</li>
                  <li><strong>Be Respectful:</strong> Treat others with kindness. Debating spaces vs. tabs is fine; personal attacks are not.</li>
                  <li><strong>Authenticity:</strong> You must represent yourself accurately. Do not impersonate other developers or claim open-source projects that aren't yours.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold mb-6 text-text">Contact Us</h2>
              <div className="space-y-6 text-muted leading-relaxed">
                <p>
                  Have a question, found a bug, or want to share a success story? Our engineers are ready to help.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 rounded-2xl bg-panelAlt border border-line">
                    <h3 className="font-semibold text-text mb-2">Support</h3>
                    <p className="text-sm mb-4">For account issues, billing, or general help.</p>
                    <a href="mailto:support@gitlove.app" className="text-accent hover:underline font-medium">support@gitlove.app</a>
                  </div>
                  <div className="p-6 rounded-2xl bg-panelAlt border border-line">
                    <h3 className="font-semibold text-text mb-2">Security</h3>
                    <p className="text-sm mb-4">To report vulnerabilities or security concerns.</p>
                    <a href="mailto:security@gitlove.app" className="text-accent hover:underline font-medium">security@gitlove.app</a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <AboutContent />
    </Suspense>
  );
}
