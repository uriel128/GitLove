"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChallengeModal } from "@/components/challenge-modal";
import { RequireAuth } from "@/components/require-auth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile-complete";
import { InterestRequest, Match, ProfileGender, User } from "@/lib/types";
import { ChevronDown, ChevronUp, Code2, Heart, MapPin, Send, Terminal, X } from "lucide-react";

type RosterDefaults = {
  age: number;
  occupation: string;
  hobbies: string[];
  editorChoice: string;
  languageChoice: string;
  githubUsername: string;
  vibeBadge: string;
  favoriteFramework: string;
  favoriteOS: string;
  favoriteDataStructure: string;
  favoriteAlgorithm: string;
  challengeLevel: "EASY" | "MEDIUM" | "HARD";
};

type RosterEntry = {
  order: number;
  name: string;
  email: string;
  image: string;
  aliases?: string[];
  defaults: RosterDefaults;
};

type PostSolvePrompt = {
  targetId: string;
  targetName: string;
  targetImage: string | null;
};

const WOMEN_ROSTER: RosterEntry[] = [
  {
    order: 0,
    name: "Alana",
    email: "alana@gitlove.com",
    image: "/images/users/Alana.jpg",
    defaults: {
      age: 28,
      occupation: "Data Engineer",
      hobbies: ["Tennis", "Reading", "Cooking"],
      editorChoice: "VS Code",
      languageChoice: "Python",
      githubUsername: "alana",
      vibeBadge: "Real Developer",
      favoriteFramework: "FastAPI",
      favoriteOS: "Linux",
      favoriteDataStructure: "Queue",
      favoriteAlgorithm: "Dynamic Programming",
      challengeLevel: "MEDIUM"
    }
  },
  {
    order: 1,
    name: "Amara",
    email: "amara@gitlove.com",
    image: "/images/users/Amara.png",
    defaults: {
      age: 27,
      occupation: "Platform Engineer",
      hobbies: ["Running", "Meal Prep", "Board Games"],
      editorChoice: "Neovim",
      languageChoice: "Go",
      githubUsername: "amara",
      vibeBadge: "Real Developer",
      favoriteFramework: "Gin",
      favoriteOS: "Linux",
      favoriteDataStructure: "Heap",
      favoriteAlgorithm: "Binary Search",
      challengeLevel: "MEDIUM"
    }
  },
  {
    order: 2,
    name: "Isabelle",
    email: "isabelle@gitlove.com",
    aliases: ["isabella@gitlove.com"],
    image: "/images/users/Isabella.jpg",
    defaults: {
      age: 25,
      occupation: "Full-Stack Engineer",
      hobbies: ["Yoga", "Painting", "Live Music"],
      editorChoice: "WebStorm",
      languageChoice: "TypeScript",
      githubUsername: "isabelle",
      vibeBadge: "Vibe Coder",
      favoriteFramework: "React",
      favoriteOS: "macOS",
      favoriteDataStructure: "Array",
      favoriteAlgorithm: "Merge Sort",
      challengeLevel: "EASY"
    }
  },
  {
    order: 3,
    name: "Julia",
    email: "julia@gitlove.com",
    image: "/images/users/Julia.png",
    defaults: {
      age: 29,
      occupation: "Backend Developer",
      hobbies: ["Hiking", "Podcasts", "Cycling"],
      editorChoice: "JetBrains IDEA",
      languageChoice: "Kotlin",
      githubUsername: "julia",
      vibeBadge: "Real Developer",
      favoriteFramework: "Spring Boot",
      favoriteOS: "Linux",
      favoriteDataStructure: "Graph",
      favoriteAlgorithm: "Dijkstra",
      challengeLevel: "MEDIUM"
    }
  },
  {
    order: 4,
    name: "Katrina",
    email: "katrina@gitlove.com",
    image: "/images/users/Katrina.png",
    defaults: {
      age: 25,
      occupation: "Frontend Engineer",
      hobbies: ["Bouldering", "Latte Art", "Street Photography"],
      editorChoice: "VS Code",
      languageChoice: "TypeScript",
      githubUsername: "katrina",
      vibeBadge: "Real Developer",
      favoriteFramework: "Next.js",
      favoriteOS: "macOS",
      favoriteDataStructure: "Hash Map",
      favoriteAlgorithm: "Sliding Window",
      challengeLevel: "EASY"
    }
  },
  {
    order: 5,
    name: "Maria",
    email: "maria@gitlove.com",
    image: "/images/users/Maria.jpg",
    defaults: {
      age: 29,
      occupation: "Site Reliability Engineer",
      hobbies: ["CrossFit", "Travel", "Poetry"],
      editorChoice: "Neovim",
      languageChoice: "Go",
      githubUsername: "maria",
      vibeBadge: "Real Developer",
      favoriteFramework: "Kubernetes",
      favoriteOS: "Linux",
      favoriteDataStructure: "Priority Queue",
      favoriteAlgorithm: "Topological Sort",
      challengeLevel: "HARD"
    }
  },
  {
    order: 6,
    name: "Mei",
    email: "mei@gitlove.com",
    image: "/images/users/Mei.jpg",
    defaults: {
      age: 27,
      occupation: "AI Engineer",
      hobbies: ["Piano", "Chess", "Trail Running"],
      editorChoice: "Zed",
      languageChoice: "Python",
      githubUsername: "mei",
      vibeBadge: "Real Developer",
      favoriteFramework: "PyTorch",
      favoriteOS: "Linux",
      favoriteDataStructure: "Matrix",
      favoriteAlgorithm: "Backtracking",
      challengeLevel: "HARD"
    }
  },
  {
    order: 7,
    name: "Nadia",
    email: "nadia@gitlove.com",
    image: "/images/users/Nadia.jpg",
    defaults: {
      age: 26,
      occupation: "Frontend Architect",
      hobbies: ["Dancing", "Coffee Roasting", "Journaling"],
      editorChoice: "VS Code",
      languageChoice: "TypeScript",
      githubUsername: "nadia",
      vibeBadge: "Vibe Coder",
      favoriteFramework: "Vue",
      favoriteOS: "macOS",
      favoriteDataStructure: "Linked List",
      favoriteAlgorithm: "BFS",
      challengeLevel: "EASY"
    }
  },
  {
    order: 8,
    name: "Seraphina",
    email: "seraphina@gitlove.com",
    image: "/images/users/Seraphina.jpg",
    defaults: {
      age: 26,
      occupation: "Security Engineer",
      hobbies: ["Boxing", "Sci-Fi", "Vinyl Records"],
      editorChoice: "Cursor",
      languageChoice: "Rust",
      githubUsername: "seraphina",
      vibeBadge: "Real Developer",
      favoriteFramework: "Axum",
      favoriteOS: "Linux",
      favoriteDataStructure: "Set",
      favoriteAlgorithm: "DFS",
      challengeLevel: "HARD"
    }
  },
  {
    order: 9,
    name: "Sloane",
    email: "sloane@gitlove.com",
    image: "/images/users/Sloane.jpg",
    defaults: {
      age: 30,
      occupation: "Cloud Engineer",
      hobbies: ["Camping", "Skiing", "Game Nights"],
      editorChoice: "VS Code",
      languageChoice: "Go",
      githubUsername: "sloane",
      vibeBadge: "Real Developer",
      favoriteFramework: "Terraform",
      favoriteOS: "Linux",
      favoriteDataStructure: "Tree",
      favoriteAlgorithm: "Greedy",
      challengeLevel: "MEDIUM"
    }
  },
  {
    order: 10,
    name: "Yuna",
    email: "yuna@gitlove.com",
    image: "/images/users/Yuna.png",
    defaults: {
      age: 24,
      occupation: "Mobile Engineer",
      hobbies: ["Pilates", "Sushi Nights", "Travel"],
      editorChoice: "Xcode",
      languageChoice: "Swift",
      githubUsername: "yuna",
      vibeBadge: "Vibe Coder",
      favoriteFramework: "SwiftUI",
      favoriteOS: "macOS",
      favoriteDataStructure: "Trie",
      favoriteAlgorithm: "Two Pointers",
      challengeLevel: "EASY"
    }
  }
];

const WOMEN_ROSTER_BY_EMAIL = new Map<string, RosterEntry>();
for (const entry of WOMEN_ROSTER) {
  WOMEN_ROSTER_BY_EMAIL.set(entry.email, entry);
  for (const alias of entry.aliases ?? []) {
    WOMEN_ROSTER_BY_EMAIL.set(alias, entry);
  }
}

function getRosterOrder(email: string) {
  return WOMEN_ROSTER_BY_EMAIL.get(email.toLowerCase())?.order ?? 9999;
}

function sortCandidates(left: User, right: User) {
  const rosterDelta = getRosterOrder(left.email) - getRosterOrder(right.email);
  if (rosterDelta !== 0) {
    return rosterDelta;
  }
  return left.name.localeCompare(right.name);
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function isFiniteCoord(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUserId } = useAuth();
  const [cursor, setCursor] = useState(0);
  const [activeRequest, setActiveRequest] = useState<InterestRequest | null>(null);
  const [expandedAttributes, setExpandedAttributes] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState<"ANY" | 5 | 25 | 50 | 100>("ANY");
  const [actionError, setActionError] = useState<string | null>(null);
  const [openingChallenge, setOpeningChallenge] = useState(false);
  const [candidateImageLoaded, setCandidateImageLoaded] = useState(false);
  const [postSolvePrompt, setPostSolvePrompt] = useState<PostSolvePrompt | null>(null);
  const [firstMessage, setFirstMessage] = useState("");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users"),
    staleTime: 30_000,
    retry: 1
  });

  const outgoingQuery = useQuery({
    queryKey: ["outgoing-requests", currentUserId],
    queryFn: () => api.get<string[]>(`/interest/outgoing/${currentUserId}`),
    enabled: Boolean(currentUserId),
    staleTime: 15_000,
    retry: 1
  });

  const users = usersQuery.data ?? [];
  const requestedTargetIds = outgoingQuery.data ?? [];
  const currentUser = users.find((user) => user.id === currentUserId) ?? null;
  const currentGender = currentUser?.profile?.gender ?? null;
  const currentLatitude = currentUser?.profile?.latitude ?? null;
  const currentLongitude = currentUser?.profile?.longitude ?? null;

  const targetGender: ProfileGender | null =
    currentGender === "MALE"
      ? "FEMALE"
      : currentGender === "FEMALE"
        ? "MALE"
        : null;

  const candidates = useMemo(() => {
    const requestedSet = new Set(requestedTargetIds);
    const basePool = users.filter((user) => user.id !== currentUserId && isProfileComplete(user));

    const genderFilteredPool = targetGender
      ? basePool.filter((user) => user.profile?.gender === targetGender)
      : basePool;

    const genderPool = genderFilteredPool.length > 0 ? genderFilteredPool : basePool;
    const freshQueuePool = genderPool.filter((user) => !requestedSet.has(user.id));
    const queuePool = freshQueuePool.length > 0 ? freshQueuePool : genderPool;

    const radiusFiltered = queuePool.filter((user) => {
      if (radiusMiles === "ANY") {
        return true;
      }
      const sourceLat = currentLatitude;
      const sourceLng = currentLongitude;
      if (!isFiniteCoord(sourceLat) || !isFiniteCoord(sourceLng)) {
        return true;
      }

      const candidateLat = user.profile?.latitude;
      const candidateLng = user.profile?.longitude;
      if (!isFiniteCoord(candidateLat) || !isFiniteCoord(candidateLng)) {
        return false;
      }

      return haversineMiles(sourceLat, sourceLng, candidateLat, candidateLng) <= radiusMiles;
    });

    if (radiusMiles === "ANY") {
      return [...queuePool].sort(sortCandidates);
    }

    return [...radiusFiltered].sort(sortCandidates);
  }, [
    currentLatitude,
    currentLongitude,
    currentUserId,
    radiusMiles,
    requestedTargetIds,
    targetGender,
    users
  ]);
  const isLoadingQueue = usersQuery.isLoading || outgoingQuery.isLoading;
  const candidate = candidates.length > 0 ? candidates[cursor % candidates.length] : null;
  const candidateRoster = useMemo(
    () => (candidate ? WOMEN_ROSTER_BY_EMAIL.get(candidate.email.toLowerCase()) ?? null : null),
    [candidate]
  );
  const candidateImage = useMemo(() => {
    if (!candidate) {
      return null;
    }
    return candidate.profile?.profileImage || candidateRoster?.image || null;
  }, [candidate, candidateRoster]);

  const openMutation = useMutation({
    mutationFn: async (targetId: string) =>
      api.post<InterestRequest>("/interest/open", {
        challengerId: currentUserId,
        targetId
      }),
    onSuccess: (request) => {
      setOpeningChallenge(false);
      setActionError(null);
      setActiveRequest(request);
      void queryClient.invalidateQueries({ queryKey: ["outgoing-requests", currentUserId] });
    },
    onError: (error) => {
      setOpeningChallenge(false);
      const message = error instanceof Error ? error.message : "Failed to open challenge";
      if (message.toLowerCase().includes("already requested")) {
        setActionError(null);
        advanceToNextCandidate();
        void queryClient.invalidateQueries({ queryKey: ["outgoing-requests", currentUserId] });
        return;
      }
      setActionError(message);
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
      advanceToNextCandidate();
    }
  });

  const sendFirstMessageMutation = useMutation({
    mutationFn: async (input: { targetId: string; message: string }) => {
      if (!currentUserId) {
        throw new Error("No signed-in user");
      }

      const trimmed = input.message.trim();
      if (!trimmed) {
        return null;
      }

      const matches = await api.get<Match[]>(`/matches/${currentUserId}`);
      const match = matches.find(
        (candidateMatch) =>
          (candidateMatch.userA.id === currentUserId && candidateMatch.userB.id === input.targetId) ||
          (candidateMatch.userB.id === currentUserId && candidateMatch.userA.id === input.targetId)
      );

      if (!match) {
        throw new Error("Chat thread is still syncing. Please try again.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("gitlove_last_active_match_id", match.id);
      }

      return api.post(`/chat/${match.id}/messages`, {
        senderId: currentUserId,
        content: trimmed,
        format: "TEXT"
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["matches", currentUserId] });
    }
  });

  function swipeLeft() {
    if (!candidate || activeRequest || openMutation.isPending || openingChallenge) return;
    setActionError(null);
    animateSwipe("left", () => {
      setCursor((value) => value + 1);
      setExpandedAttributes(false);
    });
  }

  function swipeRight() {
    if (!candidate || !currentUserId || activeRequest || openMutation.isPending || openingChallenge) return;
    setActionError(null);
    const targetId = candidate.id;
    setOpeningChallenge(true);
    animateSwipe("right", () => {
      openMutation.mutate(targetId);
    });
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
    if (activeRequest || openMutation.isPending || openingChallenge) {
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
      swipeLeft();
      return;
    }

    resetDragTransform(true);
  }

  useEffect(() => {
    resetDragTransform(false);
  }, [candidate?.id]);

  useEffect(() => {
    setCandidateImageLoaded(!candidateImage);
  }, [candidate?.id, candidateImage]);

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
        ["Occupation", candidate.profile?.occupation ?? candidateRoster?.defaults.occupation ?? "Software Engineer"],
        ["Age", String(candidate.profile?.age ?? candidateRoster?.defaults.age ?? 24)],
      ["Hobbies", candidate.profile?.hobbies?.join(", ") || candidateRoster?.defaults.hobbies.join(", ") || "Coding, Travel, Coffee"],
      ["IDE", candidate.profile?.editorChoice ?? candidateRoster?.defaults.editorChoice ?? "VS Code"],
      ["Language", candidate.profile?.languageChoice ?? candidateRoster?.defaults.languageChoice ?? "TypeScript"],
      ["Vibe", candidate.profile?.vibeBadge ?? candidateRoster?.defaults.vibeBadge ?? "Real Developer"],
      ["Framework", candidate.profile?.favoriteFramework ?? candidateRoster?.defaults.favoriteFramework ?? "React"],
      ["OS", candidate.profile?.favoriteOS ?? candidateRoster?.defaults.favoriteOS ?? "macOS"],
        ["Data Structure", candidate.profile?.favoriteDataStructure ?? candidateRoster?.defaults.favoriteDataStructure ?? "Hash Map"],
        ["Algorithm", candidate.profile?.favoriteAlgorithm ?? candidateRoster?.defaults.favoriteAlgorithm ?? "Two Pointers"],
        ["Challenge Level", candidate.profile?.challengeLevel ?? candidateRoster?.defaults.challengeLevel ?? "EASY"]
      ]
    : [];
  const candidateDisplayName = candidate
    ? candidateRoster?.name ?? candidate.name
    : "";
  const candidateAge = candidate?.profile?.age ?? candidateRoster?.defaults.age ?? 24;
  const candidateOccupation = candidate?.profile?.occupation ?? candidateRoster?.defaults.occupation ?? "Software Engineer";
  const candidateLocation = candidate?.profile?.locationText ?? "Location not set";

  function advanceToNextCandidate() {
    setExpandedAttributes(false);
    setCursor((value) => value + 1);
  }

  return (
    <RequireAuth>
      <div className="h-screen w-full p-4 pt-4">
        <div className="mx-auto mb-3 flex w-full max-w-[560px] items-center gap-3 rounded-xl border border-line bg-panel/70 px-4 py-2.5">
          <div className="min-w-0 flex-1 truncate text-xs text-muted">
            <span className="font-medium text-text">Location:</span>{" "}
            <span className="truncate">{currentUser?.profile?.locationText || "Not set"}</span>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-xs text-muted">
            Radius
            <select
              value={radiusMiles}
              onChange={(event) =>
                setRadiusMiles(
                  event.target.value === "ANY"
                    ? "ANY"
                    : (Number(event.target.value) as 5 | 25 | 50 | 100)
                )
              }
              className="rounded-md border border-line bg-panelAlt px-2 py-1 text-xs text-text outline-none focus:border-accent"
            >
              <option value="ANY">Any</option>
              <option value="5">5 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
              <option value="100">100 miles</option>
            </select>
          </label>
        </div>
        <div className="relative mx-auto flex h-[calc(100vh-90px)] w-full max-w-[440px] items-start justify-center">
          {isLoadingQueue ? (
            <div className="text-center p-8 rounded-[2rem] border border-dashed border-line bg-panel/30 w-full shadow-lg">
              <Code2 className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-text mb-2">Preparing Candidate Queue</h2>
              <p className="text-muted text-sm">Syncing developer profiles...</p>
            </div>
          ) : !candidate ? (
            <div className="text-center p-8 rounded-[2rem] border border-dashed border-line bg-panel/30 w-full shadow-lg">
              <Code2 className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-text mb-2">No nearby developers</h2>
              <p className="text-muted text-sm">
                {radiusMiles === "ANY"
                  ? "No complete profiles are available right now."
                  : `No candidates found within ${radiusMiles} miles.`}
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
                    key={`${candidate?.id ?? "candidate"}-${candidateImage}`}
                    src={candidateImage}
                    alt={candidateDisplayName}
                    onLoad={() => setCandidateImageLoaded(true)}
                    onError={() => setCandidateImageLoaded(true)}
                    className={`h-full w-full object-cover transition-[transform,opacity] duration-500 group-hover:scale-[1.02] ${
                      candidateImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-panelAlt">
                    <Code2 className="w-20 h-20 text-muted/30" />
                  </div>
                )}
                {!candidateImageLoaded ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-panelAlt">
                    <Code2 className="w-16 h-16 text-muted/30" />
                  </div>
                ) : null}
              </div>

              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#05030A] via-[#05030A]/50 to-transparent pointer-events-none" />

              <div className="relative z-20 flex flex-col h-full justify-end p-6 pb-[120px]">
                <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-2 mb-1 drop-shadow-md">
                  {candidateDisplayName}
                  <span className="text-2xl font-normal text-white/80">{candidateAge}</span>
                </h1>

                <div className="text-lg text-accent font-medium mb-4 flex items-center gap-2 drop-shadow-sm">
                  <Terminal className="w-4 h-4" />
                  {candidateOccupation}
                </div>
                <div className="mb-4 flex items-center gap-2 text-sm text-white/85 drop-shadow-sm">
                  <MapPin className="h-4 w-4 text-white/70" />
                  <span>{candidateLocation}</span>
                </div>

                <div className="rounded-2xl border border-white/15 bg-black/35 backdrop-blur-sm">
                  <div className="grid grid-cols-1 gap-1 p-3">
                    {attributes.slice(0, 4).map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-white/65">{label}</span>
                        <span className="text-right font-medium text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      expandedAttributes ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="grid grid-cols-1 gap-1 px-3 pb-3">
                        {attributes.slice(4).map(([label, value]) => (
                          <div
                            key={label}
                            className={`flex items-start justify-between gap-3 text-xs transition-all duration-300 ${
                              expandedAttributes ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
                            }`}
                          >
                            <span className="text-white/65">{label}</span>
                            <span className="text-right font-medium text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedAttributes((value) => !value)}
                    className="flex w-full items-center justify-center gap-1 border-t border-white/10 px-3 py-2 text-xs font-medium text-white/90 transition-all duration-300 hover:bg-white/10"
                  >
                    {expandedAttributes ? "Show less" : "Show all attributes"}
                    {expandedAttributes ? (
                      <ChevronUp className="h-4 w-4 transition-transform duration-300" />
                    ) : (
                      <ChevronDown className="h-4 w-4 transition-transform duration-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="absolute bottom-8 inset-x-0 z-30 flex items-center justify-center gap-8">
                <button
                  data-action-button="true"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={swipeLeft}
                  disabled={openMutation.isPending || Boolean(activeRequest) || openingChallenge}
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
                  disabled={openMutation.isPending || !currentUserId || Boolean(activeRequest) || openingChallenge}
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
        {openingChallenge ? (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
            <div className="rounded-full border border-line bg-panel/90 px-4 py-2 text-xs font-medium text-text shadow-xl">
              Opening challenge...
            </div>
          </div>
        ) : null}
        {actionError ? (
          <div className="mx-auto mt-3 max-w-[440px] rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {actionError}
          </div>
        ) : null}
      </div>
      {usersQuery.isError ? (
        <div className="mx-auto -mt-1 max-w-[440px] rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          Failed to load user roster. Check Supabase env keys and retry.
        </div>
      ) : null}
      {outgoingQuery.isError ? (
        <div className="mx-auto mt-2 max-w-[440px] rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Could not refresh request queue. Some profiles may appear out of date.
        </div>
      ) : null}

      {activeRequest && (
        <ChallengeModal
          challenge={activeRequest.challenge}
          busy={attemptMutation.isPending || cancelMutation.isPending}
          onPass={async (code) => {
            const solvedTargetId = activeRequest.targetId;
            const solvedTargetUser = users.find((user) => user.id === solvedTargetId) ?? null;
            const solvedTargetRoster = solvedTargetUser
              ? WOMEN_ROSTER_BY_EMAIL.get(solvedTargetUser.email.toLowerCase()) ?? null
              : null;

            await attemptMutation.mutateAsync({
              requestId: activeRequest.id,
              passed: true,
              submittedCode: code
            });
            setActiveRequest(null);
            setPostSolvePrompt({
              targetId: solvedTargetId,
              targetName: solvedTargetRoster?.name ?? solvedTargetUser?.name ?? "Developer",
              targetImage: solvedTargetUser?.profile?.profileImage ?? solvedTargetRoster?.image ?? null
            });
            setFirstMessage("");
          }}
          onFail={async (code) => {
            await attemptMutation.mutateAsync({
              requestId: activeRequest.id,
              passed: false,
              submittedCode: code
            });
            setActiveRequest(null);
            advanceToNextCandidate();
          }}
          onAbandon={async () => {
            await cancelMutation.mutateAsync(activeRequest.id);
          }}
        />
      )}
      {postSolvePrompt ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-line bg-panel p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {postSolvePrompt.targetImage ? (
                  <img
                    src={postSolvePrompt.targetImage}
                    alt={postSolvePrompt.targetName}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-panelAlt text-lg font-semibold text-text">
                    {postSolvePrompt.targetName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted">Request sent</p>
                  <h3 className="text-lg font-semibold text-text">{postSolvePrompt.targetName}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPostSolvePrompt(null);
                  setFirstMessage("");
                  advanceToNextCandidate();
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panelAlt text-muted transition hover:text-text"
                aria-label="Close message prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={firstMessage}
              onChange={(event) => setFirstMessage(event.target.value)}
              placeholder="Send your first message..."
              className="min-h-[120px] w-full resize-none rounded-2xl border border-line bg-panelAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />

            {sendFirstMessageMutation.isError ? (
              <p className="mt-2 text-xs text-rose-300">
                {sendFirstMessageMutation.error instanceof Error
                  ? sendFirstMessageMutation.error.message
                  : "Failed to send message"}
              </p>
            ) : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  await sendFirstMessageMutation.mutateAsync({
                    targetId: postSolvePrompt.targetId,
                    message: firstMessage
                  });
                  setPostSolvePrompt(null);
                  setFirstMessage("");
                  advanceToNextCandidate();
                }}
                disabled={sendFirstMessageMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sendFirstMessageMutation.isPending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </RequireAuth>
  );
}
