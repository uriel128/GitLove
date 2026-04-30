"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Heart, Code2, Sparkles, Terminal, ChevronRight, CheckCircle2, GitPullRequest, MessageSquareCode, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const profiles = [
  {
    name: "Sabrina, 25",
    role: "Frontend Engineer",
    tags: ["React", "TypeScript", "Coffee Dates"],
    image: "/images/sabrina.png",
    matchScore: "98%"
  },
  {
    name: "Sydney, 24",
    role: "UI/UX Designer",
    tags: ["Figma", "CSS", "Art"],
    image: "/images/sydney.png",
    matchScore: "96%"
  },
  {
    name: "Ana, 28",
    role: "Backend Architect",
    tags: ["Rust", "PostgreSQL", "Dogs"],
    image: "/images/ana.png",
    matchScore: "91%"
  },
  {
    name: "Margot, 26",
    role: "Fullstack Developer",
    tags: ["Next.js", "GraphQL", "Travel"],
    image: "/images/margot.png",
    matchScore: "89%"
  }
];

const successStories = [
  {
    names: "David & Emma",
    text: "We matched over a debate on Spaces vs Tabs. Three months later, we shipped an app together. Now we're moving in.",
    image: "/images/couple_1.png"
  },
  {
    names: "Michael & Sarah",
    text: "GitLove is exactly what the tech world needed. It filters out the noise and connects you with people who actually get your lifestyle.",
    image: "/images/couple_2.png"
  },
  {
    names: "James & Olivia",
    text: "I thought it was a joke at first, but reviewing someone's React components is genuinely the best icebreaker ever invented.",
    image: "/images/couple_3.png"
  },
  {
    names: "Ethan & Chloe",
    text: "Pair programming turned into dinner dates. Two years later, we just pushed our engagement ring to production.",
    image: "/images/couple_4.png"
  }
];

export default function LandingPage() {
  const { isSignedIn, isReady } = useAuth();
  const router = useRouter();
  const [activeProfile, setActiveProfile] = useState(0);
  const [activeStory, setActiveStory] = useState(0);

  useEffect(() => {
    if (isSignedIn) {
      router.push("/home");
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    const profileTimer = setInterval(() => {
      setActiveProfile((prev) => (prev + 1) % profiles.length);
    }, 4000);
    const storyTimer = setInterval(() => {
      setActiveStory((prev) => (prev + 1) % successStories.length);
    }, 6000);
    return () => {
      clearInterval(profileTimer);
      clearInterval(storyTimer);
    };
  }, []);

  if (!isReady || isSignedIn) {
    return null; // Prevent flash during redirect
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#1a102d] dark:via-[#0d0714] dark:to-[#0a0518] text-slate-900 dark:text-white selection:bg-accent/30 selection:text-white font-sans overflow-x-hidden">
      {/* Dynamic Background Noise */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />

      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 w-full border-b border-black/[0.05] dark:border-transparent bg-slate-50/80 dark:bg-[#1a102d]/95 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <Logo className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#8B5CF6] dark:text-white">GitLove</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login?mode=signup"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-accent/10 px-6 py-2.5 text-sm font-semibold text-accent backdrop-blur-md transition-all hover:bg-accent/20 hover:scale-105 active:scale-95 border border-accent/20 hover:border-accent/40"
            >
              <span>Sign Up</span>
              <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative mx-auto w-full max-w-7xl px-6 pt-24 pb-20 md:pt-28 lg:pt-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:items-start">
            
            {/* Left Content */}
            <div className="flex flex-col gap-8 lg:pt-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 w-fit shadow-[0_0_20px_rgba(56,189,248,0.15)] backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">The #1 Dating App for Developers</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Match by <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-purple-500 to-pink-500">Vibe</span>,<br />
                Connect by <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-accent">Code</span>.
              </h1>
              
              <p className="text-lg md:text-xl text-slate-900/60 dark:text-white/60 max-w-xl leading-relaxed">
                Stop swiping on empty bios. Find your perfect pair programming partner or romantic match through code snippets, tech stacks, and real developer passion.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-purple-600 px-8 text-base font-bold text-slate-900 dark:text-white shadow-lg shadow-accent/25 transition-all hover:scale-105 hover:shadow-accent/40 active:scale-95"
                >
                  <Terminal className="w-5 h-5" />
                  Start Compiling Love
                </Link>
                <a
                  href="/about?tab=documentation"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-black/10 dark:border-slate-900 dark:border-white/10 bg-white/5 dark:bg-black/5 dark:bg-white/5 px-8 text-base font-semibold text-slate-900 dark:text-white backdrop-blur-md transition-all hover:bg-white/10 dark:bg-black/10 dark:bg-white/10 hover:border-black/20 dark:border-slate-900 dark:border-white/20"
                >View Documentation
                </a>
              </div>
            </div>

            {/* Right Content - Mockup */}
            <div className="relative mx-auto w-full max-w-[360px] aspect-[9/19] perspective-[1000px] mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-purple-600/20 rounded-[40px] blur-2xl transform rotate-3" />
              
              <div className="relative w-full h-full rounded-[40px] border border-black/10 dark:border-slate-900 dark:border-white/10 bg-white dark:bg-[#120D1A]/80 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-700 hover:-rotate-y-2 hover:rotate-x-2">
                {/* App Header */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-black/5 dark:border-slate-900 dark:border-white/5 bg-white/5 dark:bg-black/5 dark:bg-white/5">
                  <div className="font-semibold tracking-wide text-sm flex items-center gap-2">
                    <Logo className="w-4 h-4" /> GitLove
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/20 dark:bg-black/20 dark:bg-white/20" />
                    <div className="w-2 h-2 rounded-full bg-white/20 dark:bg-black/20 dark:bg-white/20" />
                    <div className="w-2 h-2 rounded-full bg-white/20 dark:bg-black/20 dark:bg-white/20" />
                  </div>
                </div>

                {/* Card Stack */}
                <div className="flex-1 p-4 relative">
                  {profiles.map((profile, idx) => {
                    const isActive = activeProfile === idx;
                    const isNext = (activeProfile + 1) % profiles.length === idx;
                    const isPrev = (activeProfile - 1 + profiles.length) % profiles.length === idx;
                    
                    if (!isActive && !isNext && !isPrev) return null;

                    return (
                      <div 
                        key={profile.name}
                        className={`absolute inset-4 rounded-[2rem] overflow-hidden transition-all duration-700 ease-out border border-black/10 dark:border-slate-900 dark:border-white/10 bg-white dark:bg-[#1A1423] shadow-xl flex flex-col ${
                          isActive ? 'opacity-100 scale-100 translate-y-0 z-20' : 
                          isNext ? 'opacity-50 scale-95 translate-y-4 z-10' : 
                          'opacity-0 scale-90 -translate-y-8 z-0'
                        }`}
                      >
                        <div className="relative flex-1 min-h-0">
                          <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                          <div className="absolute top-4 right-4 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full px-3 py-1 border border-black/10 dark:border-slate-900 dark:border-white/10 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs font-semibold">{profile.matchScore} Match</span>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#1A1423] to-transparent pointer-events-none" />
                        </div>
                        
                        <div className="p-5 pt-3 bg-white dark:bg-[#1A1423] shrink-0">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {profile.name}
                            <CheckCircle2 className="w-5 h-5 text-accent" />
                          </h3>
                          <p className="text-slate-900/70 dark:text-white/70 font-medium mt-1">{profile.role}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {profile.tags.map(tag => (
                              <span key={tag} className="px-3 py-1 rounded-full bg-white/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-slate-900 dark:border-white/10 text-xs font-medium text-slate-900/80 dark:text-white/80">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* App Nav */}
                <div className="h-20 flex justify-center items-center gap-6 px-6 pb-2">
                  <button className="w-14 h-14 rounded-full bg-white/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-slate-900 dark:border-white/10 flex items-center justify-center text-red-400 hover:bg-red-400/10 hover:text-red-300 hover:scale-110 transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-slate-900 dark:border-white/10 flex items-center justify-center text-purple-400 hover:bg-purple-400/10 hover:scale-110 transition-all">
                    <Code2 className="w-5 h-5" />
                  </button>
                  <button className="w-14 h-14 rounded-full bg-gradient-to-tr from-accent to-purple-500 shadow-lg shadow-accent/20 flex items-center justify-center text-slate-900 dark:text-white hover:scale-110 hover:shadow-accent/40 transition-all">
                    <Heart className="w-6 h-6 fill-white" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-24 border-y border-black/5 dark:border-slate-900 dark:border-white/5 bg-slate-100 dark:bg-[#0A0710]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Merge Together Without Conflicts</h2>
              <p className="mt-4 text-slate-900/60 dark:text-white/60 max-w-2xl mx-auto text-lg">Designed exclusively for software engineers and tech enthusiasts. We speak your language.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Terminal className="w-6 h-6 text-accent" />,
                  title: "Solve to Swipe",
                  desc: "Prove your skills before you match. You must successfully compile and pass a daily Data Structures & Algorithms challenge to unlock the ability to swipe right."
                },
                {
                  icon: <GitPullRequest className="w-6 h-6 text-purple-400" />,
                  title: "The Build Log",
                  desc: "Your consistency is your best asset. Showcase your dedication through a visually stunning progression grid tracking the amount of problems you've solved over time."
                },
                {
                  icon: <Code2 className="w-6 h-6 text-pink-400" />,
                  title: "Stack Matching",
                  desc: "Find your perfect pair. Match with people who share your exact technology interests, preferred frameworks, and programming languages."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white/[0.02] dark:bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-slate-900 dark:border-white/5 hover:bg-white/[0.04] dark:bg-black/[0.04] dark:bg-white/[0.04] transition-colors relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-2xl bg-white/5 dark:bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6 border border-black/10 dark:border-slate-900 dark:border-white/10 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-900/60 dark:text-white/60 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories Transitions Section */}
        <section className="relative py-24 bg-slate-50 dark:bg-[#06040a] overflow-hidden border-y border-black/5 dark:border-slate-900 dark:border-white/5">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Committed to Main</h2>
              <p className="mt-4 text-slate-900/60 dark:text-white/60 max-w-2xl mx-auto text-lg">See what happens when two developers find their perfect pair.</p>
            </div>
            
            <div className="relative w-full max-w-5xl mx-auto h-[500px] md:h-[400px]">
              {successStories.map((story, idx) => {
                const isActive = activeStory === idx;
                return (
                  <div 
                    key={idx}
                    className={`absolute inset-0 flex flex-col md:flex-row gap-8 md:gap-16 items-center transition-all duration-1000 ease-in-out ${
                      isActive ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-8 z-0 pointer-events-none'
                    }`}
                  >
                    <div className="relative h-64 md:h-[400px] w-full md:w-1/2 rounded-[2rem] overflow-hidden shadow-2xl flex-shrink-0">
                      <img src={story.image} alt={story.names} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center w-full md:w-1/2 text-center md:text-left">
                      <Heart className="w-10 h-10 text-accent mb-6 opacity-80 mx-auto md:mx-0" />
                      <h3 className="text-3xl font-bold mb-4">{story.names}</h3>
                      <p className="text-xl text-slate-900/70 dark:text-white/70 leading-relaxed italic">"{story.text}"</p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-center gap-3 mt-12">
              {successStories.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveStory(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${activeStory === idx ? 'bg-accent w-8' : 'bg-white/20 dark:bg-black/20 dark:bg-white/20 hover:bg-white/40 dark:bg-black/40 dark:bg-white/40'}`}
                  aria-label={`Go to story ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="relative py-24 bg-slate-100 dark:bg-[#0a0710]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Code Reviews</h2>
              <p className="mt-4 text-slate-900/60 dark:text-white/60 max-w-2xl mx-auto text-lg">What the community is saying about GitLove.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "The interface is incredible. I've never seen a dating app that actually understands developer culture this well.",
                  author: "William",
                  role: "Security Engineer",
                  rating: 5,
                  image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
                },
                {
                  quote: "I literally found my current co-founder and girlfriend here. Best push to production I've ever made.",
                  author: "Jessica",
                  role: "Full Stack Engineer",
                  rating: 5,
                  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
                },
                {
                  quote: "It filters out the noise. The Markdown chat and GitHub integration are game changers for finding a match.",
                  author: "Ashley",
                  role: "Frontend Lead",
                  rating: 5,
                  image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80"
                }
              ].map((review, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white/60 dark:bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-slate-900 dark:border-white/5 relative group">
                  <div className="flex gap-1 mb-6">
                    {[...Array(review.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-slate-900/80 dark:text-white/80 text-lg leading-relaxed mb-8">"{review.quote}"</p>
                  <div className="flex items-center gap-4">
                    <img src={review.image} alt={review.author} className="w-14 h-14 rounded-full object-cover border-2 border-accent/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]" />
                    <div>
                      <div className="font-bold">{review.author}</div>
                      <div className="text-sm text-slate-900/40 dark:text-white/40">{review.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Ready to find your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">pair programmer?</span></h2>
            <p className="text-xl text-slate-900/60 dark:text-white/60 mb-10 max-w-2xl mx-auto">
              Join thousands of developers who have already found their perfect match. Deploy your profile today.
            </p>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] active:scale-95"
            >
              Create Account
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-slate-900 dark:border-white/5 bg-slate-50 dark:bg-[#06040a] py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5" />
            <span className="text-lg font-bold">GitLove</span>
          </div>
          <div className="text-sm text-slate-900/40 dark:text-white/40">
            © {new Date().getFullYear()} GitLove Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-slate-900/40 dark:text-white/40">
            <Link href="/about?tab=privacy" className="hover:text-slate-900 dark:text-white transition-colors">Privacy</Link>
            <Link href="/about?tab=terms" className="hover:text-slate-900 dark:text-white transition-colors">Terms</Link>
            <Link href="/about?tab=contact" className="hover:text-slate-900 dark:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
