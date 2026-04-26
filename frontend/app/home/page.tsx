"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChallengeModal } from "@/components/challenge-modal";
import { RequireAuth } from "@/components/require-auth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile-complete";
import { InterestRequest, User } from "@/lib/types";
import { ChevronDown, ChevronUp, Code2, Heart, Terminal, X } from "lucide-react";

const FALLBACK_PROFILE_IMAGES = [
  "/images/users/Katrina.png",
  "/images/users/Amara.png",
  "/images/users/Yuna.png",
  "/images/users/Julia.png",
  "/images/users/Alana.jpg",
  "/images/users/Seraphina.jpg",
  "/images/users/Isabella.jpg",
  "/images/users/Mei.jpg",
  "/images/users/Sloane.jpg",
  "/images/users/Nadia.jpg",
  "/images/users/Maria.jpg"
];
const WOMEN_DISPLAY_NAMES = [
  "Katrina",
  "Amara",
  "Yuna",
  "Julia",
  "Alana",
  "Seraphina",
  "Isabella",
  "Mei",
  "Sloane",
  "Nadia",
  "Maria"
];
const WOMEN_EMAIL_ROSTER = new Set([
  "katrina@gitlove.com",
  "amara@gitlove.com",
  "yuna@gitlove.com",
  "julia@gitlove.com",
  "alana@gitlove.com",
  "seraphina@gitlove.com",
  "isabella@gitlove.com",
  "mei@gitlove.com",
  "sloane@gitlove.com",
  "nadia@gitlove.com",
  "maria@gitlove.com"
]);

const FALLBACK_EDITORS = ["VS Code", "Cursor", "Neovim", "WebStorm", "Zed"];
const FALLBACK_LANGUAGES = ["TypeScript", "Python", "Go", "Java", "Rust", "C++", "Swift"];
const FALLBACK_FRAMEWORKS = ["Next.js", "React", "Vue", "SvelteKit", "Django", "Spring Boot"];
const FALLBACK_OSS = ["macOS", "Linux", "Windows"];
const FALLBACK_STRUCTURES = ["Hash Map", "Heap", "Trie", "Graph", "Segment Tree", "Linked List"];
const FALLBACK_ALGOS = ["Two Pointers", "Sliding Window", "Binary Search", "DFS/BFS", "Dynamic Programming"];
const FALLBACK_HOBBIES = [
  "Coffee walks",
  "Climbing",
  "Photography",
  "Pilates",
  "Travel",
  "Cooking",
  "Running",
  "Reading"
];

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUserId } = useAuth();
  const [cursor, setCursor] = useState(0);
  const [activeRequest, setActiveRequest] = useState<InterestRequest | null>(null);
  const [expandedAttributes, setExpandedAttributes] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users")
  });

  const outgoingQuery = useQuery({
    queryKey: ["outgoing-requests", currentUserId],
    queryFn: () => api.get<string[]>(`/interest/outgoing/${currentUserId}`),
    enabled: Boolean(currentUserId)
  });

  const users = usersQuery.data ?? [];
  const requestedTargetIds = outgoingQuery.data ?? [];
  const currentUser = users.find((user) => user.id === currentUserId) ?? null;
  const candidates = useMemo(
    () => {
      const requestedSet = new Set(requestedTargetIds);
      return users.filter((user) => {
        if (user.id === currentUserId || requestedSet.has(user.id)) {
          return false;
        }
        return WOMEN_EMAIL_ROSTER.has(user.email.toLowerCase());
      });
    },
    [currentUserId, requestedTargetIds, users]
  );
  const candidate = candidates.length > 0 ? candidates[cursor % candidates.length] : null;
  const candidateImage = useMemo(() => {
    if (!candidate) {
      return null;
    }
    return FALLBACK_PROFILE_IMAGES[cursor % FALLBACK_PROFILE_IMAGES.length];
  }, [candidate, cursor]);
  const candidateIndex = useMemo(() => cursor % Math.max(candidates.length, 1), [candidates.length, cursor]);

  const openMutation = useMutation({
    mutationFn: async (targetId: string) =>
      api.post<InterestRequest>("/interest/open", {
        challengerId: currentUserId,
        targetId
      }),
    onSuccess: (request) => {
      setActionError(null);
      setActiveRequest(request);
      void queryClient.invalidateQueries({ queryKey: ["outgoing-requests", currentUserId] });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to open challenge");
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
      setCursor((value) => value + 1);
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      void queryClient.invalidateQueries({ queryKey: ["matches", currentUserId] });
      void queryClient.invalidateQueries({ queryKey: ["build-log"] });
      void queryClient.invalidateQueries({ queryKey: ["stack-trace"] });
      void queryClient.invalidateQueries({ queryKey: ["outgoing-requests", currentUserId] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) =>
      api.post(`/interest/${requestId}/cancel`, { challengerId: currentUserId }),
    onSuccess: () => {
      setActiveRequest(null);
      setCursor((value) => value + 1);
    }
  });

  function swipeLeft() {
    if (!candidate || activeRequest || openMutation.isPending) return;
    setActionError(null);
    setCursor((value) => value + 1);
    setExpandedAttributes(false);
  }

  function swipeRight() {
    if (!candidate || !currentUserId || activeRequest || openMutation.isPending) return;
    setActionError(null);
    resetDragTransform(false);
    openMutation.mutate(candidate.id);
  }

  function applyDragTransform(value: number) {
    const element = cardRef.current;
    if (!element) {
      return;
    }
    element.style.transform = `translateX(${value}px) rotate(${value / 35}deg)`;
  }

  function resetDragTransform(withTransition: boolean) {
    const element = cardRef.current;
    if (!element) {
      return;
    }
    element.style.transition = withTransition ? "transform 180ms ease-out" : "none";
    element.style.transform = "translateX(0px) rotate(0deg)";
  }

  function animateSwipe(direction: "left" | "right", action: () => void) {
    const element = cardRef.current;
    if (!element) {
      action();
      return;
    }

    const target = direction === "right" ? window.innerWidth * 0.65 : -window.innerWidth * 0.65;
    element.style.transition = "transform 170ms ease-out";
    element.style.transform = `translateX(${target}px) rotate(${direction === "right" ? 14 : -14}deg)`;

    window.setTimeout(() => {
      action();
      resetDragTransform(false);
    }, 170);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (activeRequest || openMutation.isPending) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-action-button='true']")) {
      return;
    }
    const element = cardRef.current;
    if (!element) {
      return;
    }
    element.style.transition = "none";
    dragStartX.current = event.clientX;
    dragDeltaX.current = 0;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) {
      return;
    }
    dragDeltaX.current = event.clientX - dragStartX.current;
    applyDragTransform(dragDeltaX.current);
  }

  function handlePointerEnd() {
    if (dragStartX.current === null) {
      return;
    }
    const delta = dragDeltaX.current;
    dragStartX.current = null;
    dragDeltaX.current = 0;

    if (delta > 90) {
      swipeRight();
      return;
    }
    if (delta < -90) {
      animateSwipe("left", swipeLeft);
      return;
    }

    resetDragTransform(true);
  }

  useEffect(() => {
    resetDragTransform(false);
  }, [candidate?.id]);

  useEffect(() => {
    if (!currentUserId || usersQuery.isLoading) {
      return;
    }
    if (!currentUser || !isProfileComplete(currentUser)) {
      router.replace("/onboarding/profile");
    }
  }, [currentUser, currentUserId, router, usersQuery.isLoading]);

  const attributes = candidate
    ? [
        ["Occupation", candidate.profile?.occupation ?? "Software Engineer"],
        ["Age", candidate.profile?.age ? String(candidate.profile.age) : "24"],
        [
          "Hobbies",
          candidate.profile?.hobbies?.join(", ") || FALLBACK_HOBBIES[candidateIndex % FALLBACK_HOBBIES.length]
        ],
        ["IDE", candidate.profile?.editorChoice ?? FALLBACK_EDITORS[candidateIndex % FALLBACK_EDITORS.length]],
        [
          "Language",
          candidate.profile?.languageChoice ?? FALLBACK_LANGUAGES[candidateIndex % FALLBACK_LANGUAGES.length]
        ],
        ["GitHub", normalizeGithub(candidate.profile?.githubUsername)],
        [
          "Framework",
          candidate.profile?.favoriteFramework ??
            FALLBACK_FRAMEWORKS[candidateIndex % FALLBACK_FRAMEWORKS.length]
        ],
        ["OS", candidate.profile?.favoriteOS ?? FALLBACK_OSS[candidateIndex % FALLBACK_OSS.length]],
        [
          "Data Structure",
          candidate.profile?.favoriteDataStructure ??
            FALLBACK_STRUCTURES[candidateIndex % FALLBACK_STRUCTURES.length]
        ],
        [
          "Algorithm",
          candidate.profile?.favoriteAlgorithm ?? FALLBACK_ALGOS[candidateIndex % FALLBACK_ALGOS.length]
        ],
        ["Challenge Level", candidate.profile?.challengeLevel ?? "EASY"]
      ]
    : [];
  const visibleAttributes = expandedAttributes ? attributes : attributes.slice(0, 4);
  const candidateDisplayName = candidate
    ? WOMEN_DISPLAY_NAMES[candidateIndex % WOMEN_DISPLAY_NAMES.length]
    : "";

  return (
    <RequireAuth>
      <div className="h-screen w-full bg-gradient-to-b from-slate-100 to-slate-50 p-4 pt-4 dark:from-[#1a102d] dark:via-[#0d0714] dark:to-[#0a0518]">
        <div className="relative mx-auto flex h-[calc(100vh-90px)] w-full max-w-[440px] items-start justify-center">
          {!candidate ? (
            <div className="text-center p-8 rounded-[2rem] border border-dashed border-line bg-panel/30 w-full shadow-lg">
              <Code2 className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-text mb-2">No More Candidates</h2>
              <p className="text-muted text-sm">
                You've reviewed all available developers in your stack. Check back later after more deployments.
              </p>
            </div>
          ) : (
            <div
              ref={cardRef}
              className="group relative flex h-[calc(100vh-130px)] max-h-[760px] w-full select-none flex-col overflow-hidden rounded-[2.5rem] border border-black/10 bg-panel shadow-2xl dark:border-white/10"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onPointerLeave={handlePointerEnd}
              style={{ touchAction: "none" }}
            >
              <div className="absolute inset-0 z-0 bg-panelAlt">
                {candidateImage ? (
                  <img
                    src={candidateImage}
                    alt={candidateDisplayName}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-panelAlt">
                    <Code2 className="w-20 h-20 text-muted/30" />
                  </div>
                )}
              </div>

              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#05030A] via-[#05030A]/50 to-transparent pointer-events-none" />

              <div className="relative z-20 flex flex-col h-full justify-end p-6 pb-[120px]">
                <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-2 mb-1 drop-shadow-md">
                  {candidateDisplayName.split(" ")[0]}
                  <span className="text-2xl font-normal text-white/80">{candidate.profile?.age ?? 24}</span>
                </h1>

                <div className="text-lg text-accent font-medium mb-4 flex items-center gap-2 drop-shadow-sm">
                  <Terminal className="w-4 h-4" />
                  {candidate.profile?.occupation ?? "Software Engineer"}
                </div>

                <div className="rounded-2xl border border-white/15 bg-black/35 backdrop-blur-sm">
                  <div className="grid grid-cols-1 gap-1 p-3">
                    {visibleAttributes.map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-white/65">{label}</span>
                        <span className="text-right font-medium text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedAttributes((value) => !value)}
                    className="flex w-full items-center justify-center gap-1 border-t border-white/10 px-3 py-2 text-xs font-medium text-white/90"
                  >
                    {expandedAttributes ? "Show less" : "Show all attributes"}
                    {expandedAttributes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="absolute bottom-8 inset-x-0 z-30 flex items-center justify-center gap-8">
                <button
                  data-action-button="true"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={swipeLeft}
                  disabled={openMutation.isPending || Boolean(activeRequest)}
                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 group-hover:border-red-500/50 group-hover:text-red-400 transition-all shadow-xl">
                    <X className="w-8 h-8" />
                  </div>
                </button>

                <button
                  data-action-button="true"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={swipeRight}
                  disabled={openMutation.isPending || !currentUserId || Boolean(activeRequest)}
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
        {actionError ? (
          <div className="mx-auto mt-3 max-w-[440px] rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {actionError}
          </div>
        ) : null}
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

function normalizeGithub(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "Not set";
  }
  if (trimmed.includes("/") || trimmed.includes("\\")) {
    return "Not set";
  }
  return trimmed;
}
