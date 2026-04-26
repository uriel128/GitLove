"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChallengeModal } from "@/components/challenge-modal";
import { RequireAuth } from "@/components/require-auth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { InterestRequest, User } from "@/lib/types";
import { Terminal, Activity, X, Heart, Code2 } from "lucide-react";

export default function HomePage() {
  const queryClient = useQueryClient();
  const { currentUserId } = useAuth();
  const [cursor, setCursor] = useState(0);
  const [activeRequest, setActiveRequest] = useState<InterestRequest | null>(null);
  const [terminalLog, setTerminalLog] = useState("SYSTEM READY // AWAITING INPUT");

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<{ status: string; services: { db: string } }>("/health"),
    refetchInterval: 15_000
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users")
  });

  const users = usersQuery.data ?? [];
  const viewer = users.find((user) => user.id === currentUserId) ?? null;
  const candidates = useMemo(
    () => users.filter((user) => user.id !== currentUserId),
    [currentUserId, users]
  );
  const candidate = candidates.length > 0 ? candidates[cursor % candidates.length] : null;

  const openMutation = useMutation({
    mutationFn: async (targetId: string) =>
      api.post<InterestRequest>("/interest/open", {
        challengerId: currentUserId,
        targetId
      }),
    onSuccess: (request) => {
      setActiveRequest(request);
      setTerminalLog("CHALLENGE GATE OPENED // PENDING DSA RESOLUTION");
    }
  });

  const attemptMutation = useMutation({
    mutationFn: async (input: { requestId: string; passed: boolean; submittedCode: string }) =>
      api.post<InterestRequest>(`/interest/${input.requestId}/attempt`, {
        userId: currentUserId,
        passed: input.passed,
        submittedCode: input.submittedCode
      }),
    onSuccess: (request) => {
      const statusLog =
        request.status === "MATCHED" ? "BUILD SUCCESSFUL :: MERGE COMPLETE" : "BUILD SUCCESSFUL :: REQUEST SENT";
      setTerminalLog(statusLog);
      setActiveRequest(null);
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      void queryClient.invalidateQueries({ queryKey: ["build-log"] });
      void queryClient.invalidateQueries({ queryKey: ["stack-trace"] });
    },
    onError: (error) => {
      setTerminalLog(`BUILD FAILED :: ${error.message}`);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) =>
      api.post(`/interest/${requestId}/cancel`, { challengerId: currentUserId }),
    onSuccess: () => {
      setTerminalLog("CHALLENGE ABANDONED // PROCESS TERMINATED");
      setActiveRequest(null);
    }
  });

  function swipeLeft() {
    if (!candidate) return;
    setCursor((value) => value + 1);
    setTerminalLog("SWIPE LEFT :: TARGET SKIPPED");
  }

  function swipeRight() {
    if (!candidate) return;
    openMutation.mutate(candidate.id);
  }

  return (
    <RequireAuth>
      <div className="h-full w-full flex flex-col p-4 md:p-6 gap-6 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-[#0a0710] dark:via-[#06040a] dark:to-[#06040a]">
        
        {/* Status Bar / Terminal */}
        <div className="flex-none grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-line bg-panel/60 backdrop-blur-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider">System Status</div>
              <div className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ok animate-pulse"></span>
                {healthQuery.data ? "ONLINE & SYNCED" : "CONNECTING..."}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-line bg-panel/60 backdrop-blur-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Terminal className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-muted uppercase tracking-wider">Production Console</div>
              <div className="text-sm font-mono text-accent truncate">
                > {terminalLog}
                <span className="animate-pulse">_</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area (Candidate Card) */}
        <div className="flex-1 min-h-0 relative flex items-center justify-center">
          {!candidate ? (
            <div className="text-center p-8 rounded-3xl border border-dashed border-line bg-panel/30">
              <Code2 className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-text mb-2">No More Candidates</h2>
              <p className="text-muted text-sm max-w-sm">
                You've reviewed all available developers in your stack. Check back later after more deployments.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl h-full max-h-[600px] bg-panel border border-line rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
              {/* Decorative top gradient */}
              <div className="h-32 bg-gradient-to-r from-accent/20 via-purple-500/20 to-pink-500/20 w-full absolute top-0 inset-x-0" />
              
              <div className="relative z-10 flex flex-col h-full p-8">
                {/* Header info */}
                <div className="flex items-end gap-6 mb-8 mt-12">
                  <div className="w-24 h-24 rounded-2xl bg-panelAlt border-2 border-line shadow-lg overflow-hidden flex items-center justify-center">
                    <UserCircle className="w-12 h-12 text-muted" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-text flex items-center gap-3">
                      {candidate.name}
                      <span className="text-xl font-normal text-muted">, {candidate.profile?.age ?? "?"}</span>
                    </h1>
                    <div className="text-lg text-accent font-medium mt-1">
                      {candidate.profile?.occupation ?? "Full Stack Engineer"}
                    </div>
                  </div>
                </div>

                {/* Tech Stack Grid */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Primary Language" value={candidate.profile?.languageChoice ?? "TypeScript"} />
                    <Field label="Framework" value={candidate.profile?.favoriteFramework ?? "React/Next.js"} />
                    <Field label="Editor" value={candidate.profile?.editorChoice ?? "VS Code"} />
                    <Field label="Operating System" value={candidate.profile?.favoriteOS ?? "macOS"} />
                    <Field label="Favorite Algorithm" value={candidate.profile?.favoriteAlgorithm ?? "A* Search"} className="col-span-2" />
                    <Field label="Hobbies" value={candidate.profile?.hobbies?.join(", ") ?? "Coffee, Mechanical Keyboards"} className="col-span-2" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-none pt-6 mt-4 flex items-center justify-center gap-6 border-t border-line/50">
                  <button
                    onClick={swipeLeft}
                    className="group flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <div className="w-16 h-16 rounded-full bg-panelAlt border border-line flex items-center justify-center text-muted group-hover:bg-red-500/10 group-hover:border-red-500/30 group-hover:text-red-500 transition-colors shadow-sm">
                      <X className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-bold text-muted group-hover:text-red-500 tracking-wider">SKIP</span>
                  </button>
                  
                  <button
                    onClick={swipeRight}
                    disabled={openMutation.isPending || !currentUserId}
                    className="group flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <div className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.4)] group-hover:bg-accent/90 transition-colors">
                      <Heart className="w-10 h-10 fill-current" />
                    </div>
                    <span className="text-xs font-bold text-accent tracking-wider">COMPILE</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {activeRequest && (
        <ChallengeModal
          challenge={activeRequest.challenge}
          busy={attemptMutation.isPending || cancelMutation.isPending}
          onPass={async (code) => {
            await attemptMutation.mutateAsync({
              requestId: activeRequest.id,
              passed: true,
              submittedCode: code
            });
          }}
          onFail={async (code) => {
            await attemptMutation.mutateAsync({
              requestId: activeRequest.id,
              passed: false,
              submittedCode: code
            });
            setTerminalLog("BUILD FAILED :: 403 FORBIDDEN");
            setActiveRequest(null);
          }}
          onAbandon={async () => {
            await cancelMutation.mutateAsync(activeRequest.id);
          }}
          onClose={() => setActiveRequest(null)}
        />
      )}
    </RequireAuth>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-panelAlt/50 px-4 py-3 ${className}`}>
      <div className="text-xs font-semibold text-muted mb-1">{label}</div>
      <div className="text-sm font-medium text-text">{value}</div>
    </div>
  );
}

// Ensure UserCircle is imported correctly if we missed it
import { UserCircle } from "lucide-react";
