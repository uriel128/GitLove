"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChallengeModal } from "@/components/challenge-modal";
import { RequireAuth } from "@/components/require-auth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { InterestRequest, User } from "@/lib/types";
import { Terminal, X, Heart, Code2 } from "lucide-react";

export default function HomePage() {
  const queryClient = useQueryClient();
  const { currentUserId } = useAuth();
  const [cursor, setCursor] = useState(0);
  const [activeRequest, setActiveRequest] = useState<InterestRequest | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users")
  });

  const users = usersQuery.data ?? [];
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
    }
  });

  const attemptMutation = useMutation({
    mutationFn: async (input: { requestId: string; passed: boolean; submittedCode: string }) =>
      api.post<InterestRequest>(`/interest/${input.requestId}/attempt`, {
        userId: currentUserId,
        passed: input.passed,
        submittedCode: input.submittedCode
      }),
    onSuccess: () => {
      setActiveRequest(null);
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      void queryClient.invalidateQueries({ queryKey: ["build-log"] });
      void queryClient.invalidateQueries({ queryKey: ["stack-trace"] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) =>
      api.post(`/interest/${requestId}/cancel`, { challengerId: currentUserId }),
    onSuccess: () => {
      setActiveRequest(null);
    }
  });

  function swipeLeft() {
    if (!candidate) return;
    setCursor((value) => value + 1);
  }

  function swipeRight() {
    if (!candidate) return;
    openMutation.mutate(candidate.id);
  }

  return (
    <RequireAuth>
      <div className="h-screen w-full flex items-center justify-center p-4 pt-20 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-[#1a102d] dark:via-[#0d0714] dark:to-[#0a0518]">
        
        {/* Main Content Area (Tinder Card) */}
        <div className="relative flex items-center justify-center w-full max-w-[420px] h-[calc(100vh-120px)] max-h-[800px]">
          {!candidate ? (
            <div className="text-center p-8 rounded-[2rem] border border-dashed border-line bg-panel/30 w-full shadow-lg">
              <Code2 className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-text mb-2">No More Candidates</h2>
              <p className="text-muted text-sm">
                You've reviewed all available developers in your stack. Check back later after more deployments.
              </p>
            </div>
          ) : (
            <div className="w-full h-full bg-panel border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col group">
              {/* Full-bleed Image */}
              <div className="absolute inset-0 z-0 bg-panelAlt">
                {candidate.profile?.vibeBadge ? (
                  <img src={candidate.profile.vibeBadge} alt={candidate.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-panelAlt">
                    <Code2 className="w-20 h-20 text-muted/30" />
                  </div>
                )}
              </div>
              
              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#05030A] via-[#05030A]/50 to-transparent pointer-events-none" />

              <div className="relative z-20 flex flex-col h-full justify-end p-6 pb-[120px]">
                
                <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-2 mb-1 drop-shadow-md">
                  {candidate.name.split(" ")[0]} 
                  <span className="text-2xl font-normal text-white/80">{candidate.profile?.age ?? 24}</span>
                </h1>
                
                <div className="text-lg text-accent font-medium mb-4 flex items-center gap-2 drop-shadow-sm">
                  <Terminal className="w-4 h-4" />
                  {candidate.profile?.occupation ?? "Software Engineer"}
                </div>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge label={candidate.profile?.languageChoice ?? "TypeScript"} bg="bg-blue-500/20" text="text-blue-300 border-blue-500/30" />
                  <Badge label={candidate.profile?.favoriteFramework ?? "React"} bg="bg-cyan-500/20" text="text-cyan-300 border-cyan-500/30" />
                  <Badge label={candidate.profile?.editorChoice ?? "VS Code"} bg="bg-purple-500/20" text="text-purple-300 border-purple-500/30" />
                  <Badge label={candidate.profile?.favoriteOS ?? "macOS"} bg="bg-slate-500/30" text="text-slate-300 border-slate-500/30" />
                </div>

                <div className="text-sm text-white/70 italic leading-relaxed line-clamp-2 pr-4 drop-shadow-sm">
                  "Loves {candidate.profile?.favoriteAlgorithm ?? 'A* Search'} and {(candidate.profile?.hobbies && candidate.profile.hobbies.length > 0) ? candidate.profile.hobbies.join(", ") : 'Building cool things'}."
                </div>

              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-8 inset-x-0 z-30 flex items-center justify-center gap-8">
                <button
                  onClick={swipeLeft}
                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 group-hover:border-red-500/50 group-hover:text-red-400 transition-all shadow-xl">
                    <X className="w-8 h-8" />
                  </div>
                </button>
                
                <button
                  onClick={swipeRight}
                  disabled={openMutation.isPending || !currentUserId}
                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent to-purple-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.5)] group-hover:shadow-[0_0_40px_rgba(56,189,248,0.7)] transition-all">
                    <Heart className="w-10 h-10 fill-white" />
                  </div>
                </button>
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

function Badge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text} border backdrop-blur-sm shadow-sm`}>
      {label}
    </span>
  );
}
