import { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { getSupabaseAdminClient, getSupabaseAnonServerClient } from "@/lib/supabase/server";

type ChallengeDifficulty = "EASY" | "MEDIUM" | "HARD";
type ProfileGender = "MALE" | "FEMALE";
type RequestStatus =
  | "PENDING_CHALLENGER"
  | "PENDING_RECIPIENT"
  | "MATCHED"
  | "FAILED"
  | "CANCELLED";
type MessageFormat = "TEXT" | "MARKDOWN" | "CODE";
type NotificationKind =
  | "REQUEST_RECEIVED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_DECLINED"
  | "REQUEST_CANCELLED"
  | "REQUEST_FAILED";

const FINAL_STATUSES = new Set<RequestStatus>(["MATCHED", "FAILED", "CANCELLED"]);
let usersCache: { expiresAt: number; data: ReturnType<typeof mapUser>[] } | null = null;
let ensuredProfileColumns = false;
let ensuredNotificationTables = false;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function clamp(limit: number, min: number, max: number) {
  return Math.min(max, Math.max(min, limit));
}

function normalizeHobbies(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

function mapChallenge(row: any) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    difficulty: row.difficulty as ChallengeDifficulty,
    starterCode: row.starter_code,
    testCases: row.test_cases
  };
}

function mapProfile(row: any | null) {
  if (!row) {
    return null;
  }

  return {
    occupation: row.occupation,
    age: row.age,
    hobbies: normalizeHobbies(row.hobbies),
    editorChoice: row.editor_choice,
    languageChoice: row.language_choice,
    githubUsername: row.github_username,
    vibeBadge: row.vibe_badge,
    profileImage: row.profile_image_url ?? row.profile_image ?? null,
    favoriteFramework: row.favorite_framework,
    favoriteOS: row.favorite_os,
    favoriteDataStructure: row.favorite_data_structure,
    favoriteAlgorithm: row.favorite_algorithm,
    gender: row.gender === "MALE" || row.gender === "FEMALE" ? (row.gender as ProfileGender) : null,
    locationText: row.location_text ?? null,
    latitude: typeof row.latitude === "number" ? row.latitude : null,
    longitude: typeof row.longitude === "number" ? row.longitude : null,
    challengeLevel: (row.challenge_level ?? "EASY") as ChallengeDifficulty
  };
}

type WomenRosterSeed = {
  email: string;
  name: string;
  aliases?: string[];
  profileImageUrl: string;
  occupation: string;
  age: number;
  hobbies: string[];
  editorChoice: string;
  languageChoice: string;
  githubUsername: string;
  vibeBadge: string;
  favoriteFramework: string;
  favoriteOS: string;
  favoriteDataStructure: string;
  favoriteAlgorithm: string;
  challengeLevel: ChallengeDifficulty;
};

const WOMEN_ROSTER_LOCATION: Record<string, { locationText: string; latitude: number; longitude: number }> = {
  Alana: { locationText: "New York, NY", latitude: 40.7128, longitude: -74.006 },
  Amara: { locationText: "Jersey City, NJ", latitude: 40.7178, longitude: -74.0431 },
  Isabelle: { locationText: "Brooklyn, NY", latitude: 40.6782, longitude: -73.9442 },
  Julia: { locationText: "Queens, NY", latitude: 40.7282, longitude: -73.7949 },
  Katrina: { locationText: "Hempstead, NY", latitude: 40.7062, longitude: -73.6187 },
  Maria: { locationText: "Stamford, CT", latitude: 41.0534, longitude: -73.5387 },
  Mei: { locationText: "Hoboken, NJ", latitude: 40.7439, longitude: -74.0324 },
  Nadia: { locationText: "White Plains, NY", latitude: 41.033, longitude: -73.7629 },
  Seraphina: { locationText: "Newark, NJ", latitude: 40.7357, longitude: -74.1724 },
  Sloane: { locationText: "New Haven, CT", latitude: 41.3083, longitude: -72.9279 },
  Yuna: { locationText: "Philadelphia, PA", latitude: 39.9526, longitude: -75.1652 }
};

const WOMEN_ROSTER_SEED: WomenRosterSeed[] = [
  {
    email: "alana@gitlove.com",
    name: "Alana",
    profileImageUrl: "/images/users/Alana.jpg",
    occupation: "Data Engineer",
    age: 28,
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
  },
  {
    email: "amara@gitlove.com",
    name: "Amara",
    profileImageUrl: "/images/users/Amara.png",
    occupation: "Platform Engineer",
    age: 27,
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
  },
  {
    email: "isabelle@gitlove.com",
    name: "Isabelle",
    aliases: ["isabella@gitlove.com"],
    profileImageUrl: "/images/users/Isabella.jpg",
    occupation: "Full-Stack Engineer",
    age: 25,
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
  },
  {
    email: "julia@gitlove.com",
    name: "Julia",
    profileImageUrl: "/images/users/Julia.png",
    occupation: "Backend Developer",
    age: 29,
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
  },
  {
    email: "katrina@gitlove.com",
    name: "Katrina",
    profileImageUrl: "/images/users/Katrina.png",
    occupation: "Frontend Engineer",
    age: 25,
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
  },
  {
    email: "maria@gitlove.com",
    name: "Maria",
    profileImageUrl: "/images/users/Maria.jpg",
    occupation: "Site Reliability Engineer",
    age: 29,
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
  },
  {
    email: "mei@gitlove.com",
    name: "Mei",
    profileImageUrl: "/images/users/Mei.jpg",
    occupation: "AI Engineer",
    age: 27,
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
  },
  {
    email: "nadia@gitlove.com",
    name: "Nadia",
    profileImageUrl: "/images/users/Nadia.jpg",
    occupation: "Frontend Architect",
    age: 26,
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
  },
  {
    email: "seraphina@gitlove.com",
    name: "Seraphina",
    profileImageUrl: "/images/users/Seraphina.jpg",
    occupation: "Security Engineer",
    age: 26,
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
  },
  {
    email: "sloane@gitlove.com",
    name: "Sloane",
    profileImageUrl: "/images/users/Sloane.jpg",
    occupation: "Cloud Engineer",
    age: 30,
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
  },
  {
    email: "yuna@gitlove.com",
    name: "Yuna",
    profileImageUrl: "/images/users/Yuna.png",
    occupation: "Mobile Engineer",
    age: 24,
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
];

const WOMEN_ROSTER_BY_EMAIL = new Map<string, WomenRosterSeed>();
const WOMEN_ROSTER_BY_NAME = new Map<string, WomenRosterSeed>();
for (const woman of WOMEN_ROSTER_SEED) {
  WOMEN_ROSTER_BY_EMAIL.set(woman.email.toLowerCase(), woman);
  for (const alias of woman.aliases ?? []) {
    WOMEN_ROSTER_BY_EMAIL.set(alias.toLowerCase(), woman);
  }
  WOMEN_ROSTER_BY_NAME.set(woman.name.toLowerCase(), woman);
}

let lastWomenRosterSyncAt = 0;
let womenRosterSyncPromise: Promise<void> | null = null;
let lastAuthAppUserSyncAt = 0;
let authAppUserSyncPromise: Promise<void> | null = null;

const FALLBACK_CHALLENGES: Record<ChallengeDifficulty, Array<{
  slug: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  starter_code: Record<string, string>;
  test_cases: unknown[];
}>> = {
  EASY: [
    {
      slug: "two-sum-fallback",
      title: "Two Sum",
      difficulty: "EASY",
      description:
        "<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to target.</p>",
      starter_code: {
        typescript: "function twoSum(nums: number[], target: number): number[] {\n  return [];\n}\n",
        python: "def twoSum(nums, target):\n    return []\n",
        java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}\n",
        go: "func twoSum(nums []int, target int) []int {\n    return []int{}\n}\n",
        rust: "impl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        vec![]\n    }\n}\n"
      },
      test_cases: []
    },
    {
      slug: "valid-parentheses-fallback",
      title: "Valid Parentheses",
      difficulty: "EASY",
      description:
        "<p>Given a string <code>s</code> containing just the characters <code>()[]{}</code>, determine if the input string is valid.</p>",
      starter_code: {
        typescript: "function isValid(s: string): boolean {\n  return false;\n}\n",
        python: "def isValid(s):\n    return False\n",
        java: "class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}\n",
        go: "func isValid(s string) bool {\n    return false\n}\n",
        rust: "impl Solution {\n    pub fn is_valid(s: String) -> bool {\n        false\n    }\n}\n"
      },
      test_cases: []
    },
    {
      slug: "merge-two-sorted-lists-fallback",
      title: "Merge Two Sorted Lists",
      difficulty: "EASY",
      description:
        "<p>Merge two sorted linked lists and return it as a sorted list.</p>",
      starter_code: {
        typescript: "function mergeTwoLists(list1: any, list2: any): any {\n  return null;\n}\n",
        python: "def mergeTwoLists(list1, list2):\n    return None\n",
        java: "class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        return null;\n    }\n}\n",
        go: "func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {\n    return nil\n}\n",
        rust: "impl Solution {\n    pub fn merge_two_lists(list1: Option<Box<ListNode>>, list2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {\n        None\n    }\n}\n"
      },
      test_cases: []
    },
    {
      slug: "best-time-to-buy-and-sell-stock-fallback",
      title: "Best Time to Buy and Sell Stock",
      difficulty: "EASY",
      description:
        "<p>You are given an array <code>prices</code> where <code>prices[i]</code> is the price of a given stock on the <code>i</code>th day. Return the maximum profit.</p>",
      starter_code: {
        typescript: "function maxProfit(prices: number[]): number {\n  return 0;\n}\n",
        python: "def maxProfit(prices):\n    return 0\n",
        java: "class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}\n",
        go: "func maxProfit(prices []int) int {\n    return 0\n}\n",
        rust: "impl Solution {\n    pub fn max_profit(prices: Vec<i32>) -> i32 {\n        0\n    }\n}\n"
      },
      test_cases: []
    },
    {
      slug: "contains-duplicate-fallback",
      title: "Contains Duplicate",
      difficulty: "EASY",
      description:
        "<p>Given an integer array <code>nums</code>, return <code>true</code> if any value appears at least twice in the array.</p>",
      starter_code: {
        typescript: "function containsDuplicate(nums: number[]): boolean {\n  return false;\n}\n",
        python: "def containsDuplicate(nums):\n    return False\n",
        java: "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}\n",
        go: "func containsDuplicate(nums []int) bool {\n    return false\n}\n",
        rust: "impl Solution {\n    pub fn contains_duplicate(nums: Vec<i32>) -> bool {\n        false\n    }\n}\n"
      },
      test_cases: []
    }
  ],
  MEDIUM: [
    {
      slug: "group-anagrams-fallback",
      title: "Group Anagrams",
      difficulty: "MEDIUM",
      description:
        "<p>Given an array of strings, group the anagrams together. You can return the answer in any order.</p>",
      starter_code: {
        typescript: "function groupAnagrams(strs: string[]): string[][] {\n  return [];\n}\n",
        python: "def groupAnagrams(strs):\n    return []\n",
        java: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        return new ArrayList<>();\n    }\n}\n",
        go: "func groupAnagrams(strs []string) [][]string {\n    return [][]string{}\n}\n",
        rust: "impl Solution {\n    pub fn group_anagrams(strs: Vec<String>) -> Vec<Vec<String>> {\n        vec![]\n    }\n}\n"
      },
      test_cases: []
    }
  ],
  HARD: [
    {
      slug: "median-of-two-sorted-arrays-fallback",
      title: "Median of Two Sorted Arrays",
      difficulty: "HARD",
      description:
        "<p>Given two sorted arrays <code>nums1</code> and <code>nums2</code> of size <code>m</code> and <code>n</code>, return the median of the two sorted arrays.</p>",
      starter_code: {
        typescript: "function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n  return 0;\n}\n",
        python: "def findMedianSortedArrays(nums1, nums2):\n    return 0.0\n",
        java: "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        return 0.0;\n    }\n}\n",
        go: "func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {\n    return 0\n}\n",
        rust: "impl Solution {\n    pub fn find_median_sorted_arrays(nums1: Vec<i32>, nums2: Vec<i32>) -> f64 {\n        0.0\n    }\n}\n"
      },
      test_cases: []
    }
  ]
};

function getFallbackChallenge(difficulty: ChallengeDifficulty) {
  const pool = FALLBACK_CHALLENGES[difficulty];
  return pool[Math.floor(Math.random() * pool.length)];
}

function mapUser(userRow: any, profileRow: any | null) {
  const mappedProfile = mapProfile(profileRow);
  const rosterFallback =
    WOMEN_ROSTER_BY_EMAIL.get((userRow.email ?? "").toLowerCase()) ??
    WOMEN_ROSTER_BY_NAME.get((userRow.name ?? "").toLowerCase());
  const rosterLocation =
    rosterFallback ? WOMEN_ROSTER_LOCATION[rosterFallback.name] ?? WOMEN_ROSTER_LOCATION.Isabelle : null;

  if (!mappedProfile && rosterFallback) {
    return {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      profile: {
        occupation: rosterFallback.occupation,
        age: rosterFallback.age,
        hobbies: rosterFallback.hobbies,
        editorChoice: rosterFallback.editorChoice,
        languageChoice: rosterFallback.languageChoice,
        githubUsername: rosterFallback.githubUsername,
        vibeBadge: rosterFallback.vibeBadge,
        profileImage: rosterFallback.profileImageUrl,
        favoriteFramework: rosterFallback.favoriteFramework,
        favoriteOS: rosterFallback.favoriteOS,
        favoriteDataStructure: rosterFallback.favoriteDataStructure,
        favoriteAlgorithm: rosterFallback.favoriteAlgorithm,
        gender: "FEMALE" as ProfileGender,
        locationText: rosterLocation?.locationText ?? null,
        latitude: rosterLocation?.latitude ?? null,
        longitude: rosterLocation?.longitude ?? null,
        challengeLevel: rosterFallback.challengeLevel
      }
    };
  }

  if (mappedProfile && !mappedProfile.profileImage && rosterFallback?.profileImageUrl) {
    mappedProfile.profileImage = rosterFallback.profileImageUrl;
  }

  return {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    profile: mappedProfile
  };
}

function mapInterestRequest(requestRow: any, challengeRow: any) {
  return {
    id: requestRow.id,
    challengerId: requestRow.challenger_id,
    targetId: requestRow.target_id,
    status: requestRow.status as RequestStatus,
    challenge: mapChallenge(challengeRow)
  };
}

function mapChatMessage(messageRow: any, senderRow: any | null) {
  return {
    id: messageRow.id,
    roomId: messageRow.room_id,
    senderId: messageRow.sender_id,
    content: messageRow.content,
    format: messageRow.format as MessageFormat,
    createdAt: messageRow.created_at,
    sender: {
      id: senderRow?.id ?? messageRow.sender_id,
      name: senderRow?.name ?? "Unknown"
    }
  };
}

function mapNotification(notificationRow: any, actorRow: any | null, actorProfileRow: any | null) {
  return {
    id: notificationRow.id,
    recipientId: notificationRow.recipient_id,
    actorId: notificationRow.actor_id ?? null,
    requestId: notificationRow.request_id ?? null,
    kind: notificationRow.kind as NotificationKind,
    title: notificationRow.title,
    body: notificationRow.body,
    readAt: notificationRow.read_at ?? null,
    createdAt: notificationRow.created_at,
    actor: actorRow
      ? {
          id: actorRow.id,
          name: actorRow.name,
          profileImage: actorProfileRow?.profile_image_url ?? actorProfileRow?.profile_image ?? null
        }
      : null
  };
}

function invalidateUsersCache() {
  usersCache = null;
}

async function ensureMatchingProfileColumns() {
  if (ensuredProfileColumns) {
    return true;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      alter table public.profiles add column if not exists gender text check (gender in ('MALE', 'FEMALE'));
      alter table public.profiles add column if not exists location_text text;
      alter table public.profiles add column if not exists latitude double precision;
      alter table public.profiles add column if not exists longitude double precision;
    `
  });

  if (!error) {
    ensuredProfileColumns = true;
    return true;
  }

  // If RPC is unavailable in this environment, continue without hard-failing here.
  const { error: probeError } = await supabase.from("profiles").select("gender, location_text, latitude, longitude").limit(1);
  if (!probeError) {
    ensuredProfileColumns = true;
    return true;
  }

  return false;
}

async function ensureNotificationsTable() {
  if (ensuredNotificationTables) {
    return true;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      create table if not exists public.notifications (
        id uuid primary key default gen_random_uuid(),
        recipient_id uuid not null references public.users(id) on delete cascade,
        actor_id uuid references public.users(id) on delete set null,
        request_id uuid references public.interest_requests(id) on delete set null,
        kind text not null check (kind in ('REQUEST_RECEIVED', 'REQUEST_ACCEPTED', 'REQUEST_DECLINED', 'REQUEST_CANCELLED', 'REQUEST_FAILED')),
        title text not null,
        body text not null,
        payload jsonb not null default '{}'::jsonb,
        read_at timestamptz,
        created_at timestamptz not null default now()
      );
      create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);
      create index if not exists notifications_recipient_read_idx on public.notifications(recipient_id, read_at);
      alter publication supabase_realtime add table public.notifications;
      alter publication supabase_realtime add table public.interest_requests;
    `
  });

  if (!error) {
    ensuredNotificationTables = true;
    return true;
  }

  const probe = await supabase.from("notifications").select("id", { head: true, count: "exact" });
  if (!probe.error) {
    ensuredNotificationTables = true;
    return true;
  }

  return false;
}

async function createNotification(input: {
  recipientId: string;
  actorId?: string | null;
  requestId?: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}) {
  const ready = await ensureNotificationsTable();
  if (!ready) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("notifications").insert({
    recipient_id: input.recipientId,
    actor_id: input.actorId ?? null,
    request_id: input.requestId ?? null,
    kind: input.kind,
    title: input.title,
    body: input.body,
    payload: input.payload ?? {}
  });

  if (error) {
    console.warn("Failed to create notification", error.message);
  }
}

async function getUserRowsByIds(userIds: string[]) {
  const supabase = getSupabaseAdminClient();
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, created_at")
    .in("id", userIds);

  if (error) {
    throw new ApiError(500, error.message);
  }

  return data ?? [];
}

async function getProfileRowsByUserIds(userIds: string[]) {
  const supabase = getSupabaseAdminClient();
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from("profiles").select("*").in("user_id", userIds);

  if (error) {
    throw new ApiError(500, error.message);
  }

  return data ?? [];
}

function resolveRosterFallbackImage(email: string | null | undefined, name: string | null | undefined) {
  const byEmail = email ? WOMEN_ROSTER_BY_EMAIL.get(email.trim().toLowerCase()) : undefined;
  if (byEmail?.profileImageUrl) {
    return byEmail.profileImageUrl;
  }

  const byName = name ? WOMEN_ROSTER_BY_NAME.get(name.trim().toLowerCase()) : undefined;
  if (byName?.profileImageUrl) {
    return byName.profileImageUrl;
  }

  return null;
}

async function upsertAppUserFromAuthId(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);

  if (authError || !authData.user) {
    return null;
  }

  const email = authData.user.email?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  const metadataName =
    typeof authData.user.user_metadata?.name === "string"
      ? authData.user.user_metadata.name
      : typeof authData.user.user_metadata?.full_name === "string"
        ? authData.user.user_metadata.full_name
        : null;
  const resolvedName = (metadataName?.trim() || email.split("@")[0] || "Developer").slice(0, 80);

  const { data: userRow, error: upsertError } = await supabase
    .from("users")
    .upsert(
      {
        id: userId,
        email,
        name: resolvedName,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("id, email, name, created_at")
    .maybeSingle();

  if (upsertError) {
    const lower = upsertError.message.toLowerCase();
    const isEmailConflict =
      lower.includes("users_email_key") ||
      (lower.includes("duplicate key") && lower.includes("email"));

    if (isEmailConflict) {
      const { data: existingByEmail, error: existingByEmailError } = await supabase
        .from("users")
        .select("id, email, name, created_at")
        .eq("email", email)
        .maybeSingle();

      if (existingByEmailError) {
        throw new ApiError(500, existingByEmailError.message);
      }
      if (existingByEmail) {
        return existingByEmail;
      }
    }

    throw new ApiError(500, upsertError.message);
  }

  invalidateUsersCache();
  return userRow ?? null;
}

async function getUserRowsByEmails(emails: string[]) {
  const uniqueEmails = [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
  if (uniqueEmails.length === 0) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, created_at")
    .in("email", uniqueEmails);

  if (error) {
    throw new ApiError(500, error.message);
  }

  return data ?? [];
}

async function resolveUserRowsByRequestedIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)];
  const resolved = new Map<string, { id: string; email: string; name: string; created_at: string }>();

  if (uniqueIds.length === 0) {
    return resolved;
  }

  const existingRows = await getUserRowsByIds(uniqueIds);
  for (const row of existingRows) {
    resolved.set(row.id, row);
  }

  const missingIds = uniqueIds.filter((id) => !resolved.has(id));
  if (missingIds.length === 0) {
    return resolved;
  }

  const supabase = getSupabaseAdminClient();
  const authLookups = await Promise.all(
    missingIds.map(async (id) => {
      const { data, error } = await supabase.auth.admin.getUserById(id);
      if (error || !data.user) {
        return [id, null] as const;
      }

      const email = data.user.email?.trim().toLowerCase() ?? "";
      const metadataName =
        typeof data.user.user_metadata?.name === "string"
          ? data.user.user_metadata.name
          : typeof data.user.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : null;
      const name = (metadataName?.trim() || email.split("@")[0] || "Developer").slice(0, 80);

      return [
        id,
        {
          id,
          email,
          name,
          created_at: data.user.created_at ?? new Date().toISOString()
        }
      ] as const;
    })
  );

  const authByRequestedId = new Map(authLookups.filter((entry) => entry[1] !== null));
  const authEmails = [...new Set([...authByRequestedId.values()].map((entry) => entry!.email).filter(Boolean))];
  const existingByEmailRows = await getUserRowsByEmails(authEmails);
  const existingByEmail = new Map(
    existingByEmailRows.map((row) => [row.email.trim().toLowerCase(), row])
  );

  for (const missingId of missingIds) {
    const authRow = authByRequestedId.get(missingId);
    if (!authRow) {
      continue;
    }

    const matchedByEmail = existingByEmail.get(authRow.email);
    if (matchedByEmail) {
      resolved.set(missingId, matchedByEmail);
      continue;
    }

    try {
      const provisioned = await upsertAppUserFromAuthId(missingId);
      if (provisioned) {
        resolved.set(missingId, provisioned);
        continue;
      }
    } catch (error) {
      console.warn("Failed to provision user by requested ID", missingId, error);
    }

    resolved.set(missingId, authRow);
  }

  return resolved;
}

async function ensureAppUsersForIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) {
    return [];
  }

  const existingRows = await getUserRowsByIds(uniqueIds);
  const existingIds = new Set(existingRows.map((row) => row.id));
  const missingIds = uniqueIds.filter((id) => !existingIds.has(id));

  if (missingIds.length === 0) {
    return existingRows;
  }

  for (const missingId of missingIds) {
    try {
      await upsertAppUserFromAuthId(missingId);
    } catch (error) {
      console.warn("Failed to provision missing app user", missingId, error);
    }
  }

  return getUserRowsByIds(uniqueIds);
}

async function getChallengesByIds(challengeIds: string[]) {
  const supabase = getSupabaseAdminClient();
  if (challengeIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from("challenges").select("*").in("id", challengeIds);

  if (error) {
    throw new ApiError(500, error.message);
  }

  return data ?? [];
}

async function getInterestRequestById(requestId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("interest_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!data) {
    throw new ApiError(404, "Request not found");
  }

  return data;
}

async function getChallengeById(challengeId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!data) {
    throw new ApiError(404, "Challenge not found");
  }

  return data;
}

async function countRows(table: string) {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });

  if (error) {
    throw new ApiError(500, error.message);
  }

  return count ?? 0;
}

export async function getAuthUserFromAuthorizationHeader(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing bearer token");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new ApiError(401, "Missing bearer token");
  }

  const supabase = getSupabaseAnonServerClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiError(401, "Invalid auth token");
  }

  return data.user;
}

export async function syncAuthUser(authUser: SupabaseAuthUser) {
  const email = authUser.email?.trim().toLowerCase();

  if (!email) {
    throw new ApiError(400, "Auth user email is required");
  }

  const metadataName =
    typeof authUser.user_metadata?.name === "string"
      ? authUser.user_metadata.name
      : typeof authUser.user_metadata?.full_name === "string"
        ? authUser.user_metadata.full_name
        : null;

  const fallbackName = email.split("@")[0] ?? "Developer";
  const name = (metadataName?.trim() || fallbackName).slice(0, 80);

  return upsertAppUserRecord(authUser.id, email, name);
}

export async function provisionAuthUser(input: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const id = input.id.trim();
  const email = input.email.trim().toLowerCase();

  if (!id) {
    throw new ApiError(400, "id is required");
  }
  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(id);
  if (authError || !authData.user) {
    throw new ApiError(400, "Auth user not found");
  }

  const authEmail = authData.user.email?.trim().toLowerCase();
  if (!authEmail || authEmail !== email) {
    throw new ApiError(400, "Auth user email mismatch");
  }

  const metadataName =
    typeof authData.user.user_metadata?.name === "string"
      ? authData.user.user_metadata.name
      : typeof authData.user.user_metadata?.full_name === "string"
        ? authData.user.user_metadata.full_name
        : null;

  const displayName = (input.name?.trim() || metadataName?.trim() || authEmail.split("@")[0] || "Developer").slice(0, 80);

  return upsertAppUserRecord(id, authEmail, displayName);
}

export async function devSignupAuthUser(input: {
  email: string;
  password: string;
  name?: string | null;
}) {
  if (process.env.NODE_ENV === "production") {
    throw new ApiError(403, "dev-signup is disabled in production");
  }

  const supabase = getSupabaseAdminClient();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const name = input.name?.trim() || email.split("@")[0] || "Developer";

  if (!email) {
    throw new ApiError(400, "email is required");
  }
  if (!password || password.length < 6) {
    throw new ApiError(400, "password must be at least 6 characters");
  }

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  if (usersError) {
    throw new ApiError(500, usersError.message);
  }

  const existing = usersPage.users.find(
    (user) => user.email?.trim().toLowerCase() === email
  );

  if (existing) {
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password,
        user_metadata: {
          ...(existing.user_metadata ?? {}),
          name
        },
        email_confirm: true
      }
    );
    if (updateError || !updated.user) {
      throw new ApiError(500, updateError?.message ?? "Failed to update auth user");
    }
    return syncAuthUser(updated.user);
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });
  if (createError || !created.user) {
    throw new ApiError(500, createError?.message ?? "Failed to create auth user");
  }

  return syncAuthUser(created.user);
}

async function upsertAppUserRecord(userId: string, email: string, name: string) {
  const supabase = getSupabaseAdminClient();

  const { data: userRow, error: upsertError } = await supabase
    .from("users")
    .upsert(
      {
        id: userId,
        email,
        name,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (upsertError) {
    throw new ApiError(500, upsertError.message);
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw new ApiError(500, profileError.message);
  }

  invalidateUsersCache();
  return mapUser(userRow, profileRow ?? null);
}

function normalizeRole(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function hasAdminRole(authUser: SupabaseAuthUser) {
  const email = authUser.email?.trim().toLowerCase() ?? "";
  if (email === "admin@gitlove.com") {
    return true;
  }

  const appRole = normalizeRole(authUser.app_metadata?.role);
  if (appRole === "admin") {
    return true;
  }

  const userRole = normalizeRole((authUser.user_metadata as { role?: unknown } | null | undefined)?.role);
  if (userRole === "admin") {
    return true;
  }

  const appRoles = authUser.app_metadata?.roles;
  if (Array.isArray(appRoles) && appRoles.some((candidate) => normalizeRole(candidate) === "admin")) {
    return true;
  }

  const userRoles = (authUser.user_metadata as { roles?: unknown } | null | undefined)?.roles;
  if (Array.isArray(userRoles) && userRoles.some((candidate) => normalizeRole(candidate) === "admin")) {
    return true;
  }

  return false;
}

export async function requireAdminUser(authHeader: string | null) {
  const authUser = await getAuthUserFromAuthorizationHeader(authHeader);
  if (!hasAdminRole(authUser)) {
    throw new ApiError(403, "Admin role is required");
  }

  return authUser;
}

export async function listAdminUsers() {
  const supabase = getSupabaseAdminClient();
  const appUsers = await listUsers();
  const appUserById = new Map(appUsers.map((user) => [user.id, user]));
  const authUsers: SupabaseAuthUser[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200
    });

    if (error) {
      throw new ApiError(500, error.message);
    }

    const users = data.users ?? [];
    authUsers.push(...users);

    if (users.length < 200) {
      break;
    }

    page += 1;
  }

  return authUsers
    .map((authUser) => {
      const appUser = appUserById.get(authUser.id);
      const email = authUser.email?.trim().toLowerCase() ?? "";
      const metadataName =
        typeof authUser.user_metadata?.name === "string"
          ? authUser.user_metadata.name
          : typeof authUser.user_metadata?.full_name === "string"
            ? authUser.user_metadata.full_name
            : null;
      const providers =
        Array.isArray(authUser.app_metadata?.providers) && authUser.app_metadata.providers.length > 0
          ? authUser.app_metadata.providers.filter(
              (provider): provider is string => typeof provider === "string"
            )
          : typeof authUser.app_metadata?.provider === "string"
            ? [authUser.app_metadata.provider]
            : [];

      return {
        id: authUser.id,
        email,
        name: appUser?.name ?? metadataName?.trim() ?? email.split("@")[0] ?? "Developer",
        createdAt: authUser.created_at,
        lastSignInAt: authUser.last_sign_in_at ?? null,
        bannedUntil: authUser.banned_until ?? null,
        providers,
        hasProfile: Boolean(appUser?.profile),
        profileImage:
          appUser?.profile?.profileImage ??
          resolveRosterFallbackImage(
            email,
            appUser?.name ?? metadataName?.trim() ?? email.split("@")[0] ?? null
          ),
        occupation: appUser?.profile?.occupation ?? null,
        gender: appUser?.profile?.gender ?? null,
        locationText: appUser?.profile?.locationText ?? null,
        challengeLevel: appUser?.profile?.challengeLevel ?? null
      };
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function adminSetTemporaryPassword(userId: string, password: string) {
  const supabase = getSupabaseAdminClient();
  const normalizedPassword = password.trim();

  if (normalizedPassword.length < 8) {
    throw new ApiError(400, "Temporary password must be at least 8 characters");
  }

  const { data: existingUser, error: existingUserError } = await supabase.auth.admin.getUserById(userId);
  if (existingUserError) {
    throw new ApiError(500, existingUserError.message);
  }

  if (!existingUser.user) {
    throw new ApiError(404, "Auth user not found");
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: normalizedPassword
  });

  if (error) {
    throw new ApiError(500, error.message);
  }

  return {
    ok: true
  };
}

export async function adminUpdateUserName(userId: string, name: string) {
  const supabase = getSupabaseAdminClient();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new ApiError(400, "name is required");
  }

  const { data: existingUser, error: existingUserError } = await supabase.auth.admin.getUserById(userId);
  if (existingUserError) {
    throw new ApiError(500, existingUserError.message);
  }
  if (!existingUser.user) {
    throw new ApiError(404, "Auth user not found");
  }

  const { error: updateAppUserError } = await supabase
    .from("users")
    .update({ name: trimmedName, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateAppUserError) {
    throw new ApiError(500, updateAppUserError.message);
  }

  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(existingUser.user.user_metadata ?? {}),
      name: trimmedName
    }
  });

  invalidateUsersCache();
  return {
    ok: true
  };
}

export async function adminSetBanStatus(userId: string, banned: boolean) {
  const supabase = getSupabaseAdminClient();
  const { data: existingUser, error: existingUserError } = await supabase.auth.admin.getUserById(userId);
  if (existingUserError) {
    throw new ApiError(500, existingUserError.message);
  }
  if (!existingUser.user) {
    throw new ApiError(404, "Auth user not found");
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: banned ? "876000h" : "none"
  });
  if (error) {
    throw new ApiError(500, error.message);
  }

  return { ok: true };
}

const PROFILE_IMAGE_BUCKET = "profile-images";

function inferImageExtension(fileName: string, contentType: string) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".png") || contentType === "image/png") {
    return "png";
  }
  if (lowerName.endsWith(".webp") || contentType === "image/webp") {
    return "webp";
  }
  if (
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    contentType === "image/jpeg"
  ) {
    return "jpg";
  }

  return "png";
}

async function ensureProfileImageBucket() {
  const supabase = getSupabaseAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new ApiError(500, listError.message);
  }

  const exists = (buckets ?? []).some((bucket) => bucket.name === PROFILE_IMAGE_BUCKET);
  if (exists) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(PROFILE_IMAGE_BUCKET, {
    public: true,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    fileSizeLimit: 5 * 1024 * 1024
  });
  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new ApiError(500, createError.message);
  }
}

async function resolveProfileImageColumn() {
  const supabase = getSupabaseAdminClient();

  const { error: profileImageUrlProbeError } = await supabase
    .from("profiles")
    .select("profile_image_url")
    .limit(1);
  if (!profileImageUrlProbeError) {
    return "profile_image_url" as const;
  }

  const { error: profileImageProbeError } = await supabase
    .from("profiles")
    .select("profile_image")
    .limit(1);
  if (!profileImageProbeError) {
    return "profile_image" as const;
  }

  // Try to self-heal schema in dev environments when exec_sql RPC is available.
  const { error: alterError } = await supabase.rpc("exec_sql", {
    sql: "alter table public.profiles add column if not exists profile_image_url text;"
  });

  if (!alterError) {
    const { error: retryProbeError } = await supabase
      .from("profiles")
      .select("profile_image_url")
      .limit(1);
    if (!retryProbeError) {
      return "profile_image_url" as const;
    }
  }

  throw new ApiError(
    500,
    "Missing profile image column on profiles. Run SQL: alter table public.profiles add column if not exists profile_image_url text;"
  );
}

async function syncWomenRosterUsers() {
  const supabase = getSupabaseAdminClient();
  const { data: authUsersPage, error: authUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (authUsersError) {
    throw new ApiError(500, authUsersError.message);
  }

  const authByEmail = new Map(
    (authUsersPage.users ?? [])
      .map((authUser) => ({
        email: authUser.email?.trim().toLowerCase() ?? "",
        user: authUser
      }))
      .filter((item) => item.email)
      .map((item) => [item.email, item.user])
  );
  const rosterEmailAliases = WOMEN_ROSTER_SEED.flatMap((woman) => [
    woman.email,
    ...(woman.aliases ?? [])
  ]);
  const existingAppUsers = await getUserRowsByEmails(rosterEmailAliases);
  const existingAppByEmail = new Map(
    existingAppUsers.map((row) => [row.email.trim().toLowerCase(), row])
  );

  const imageColumn = await resolveProfileImageColumn();

  for (const woman of WOMEN_ROSTER_SEED) {
    let authUser =
      authByEmail.get(woman.email) ??
      (woman.aliases ?? []).map((alias) => authByEmail.get(alias)).find(Boolean);

    if (!authUser) {
      const { data: createdAuthUser, error: createAuthUserError } = await supabase.auth.admin.createUser({
        email: woman.email,
        password: "password",
        email_confirm: true,
        user_metadata: { name: woman.name }
      });

      if (createAuthUserError || !createdAuthUser.user) {
        throw new ApiError(500, createAuthUserError?.message ?? "Failed to create roster auth user");
      }

      authUser = createdAuthUser.user;
      authByEmail.set(woman.email, authUser);
    } else {
      const { data: updatedAuthUser, error: updateAuthUserError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          password: "password",
          email_confirm: true,
          user_metadata: {
            ...(authUser.user_metadata ?? {}),
            name: woman.name
          }
        }
      );

      if (!updateAuthUserError && updatedAuthUser.user) {
        authUser = updatedAuthUser.user;
      }
    }

    const userEmail = authUser.email?.trim().toLowerCase() || woman.email;
    const existingAppUser =
      existingAppByEmail.get(userEmail) ??
      existingAppByEmail.get(woman.email) ??
      (woman.aliases ?? [])
        .map((alias) => existingAppByEmail.get(alias.toLowerCase()))
        .find(Boolean);
    let userId = existingAppUser?.id ?? authUser.id;
    const now = new Date().toISOString();
    const fallbackLocation = WOMEN_ROSTER_LOCATION[woman.name] ?? WOMEN_ROSTER_LOCATION.Isabelle;

    const { error: upsertUserError } = await supabase.from("users").upsert(
      {
        id: userId,
        email: userEmail,
        name: woman.name,
        updated_at: now
      },
      { onConflict: "id" }
    );
    if (upsertUserError) {
      const lower = upsertUserError.message.toLowerCase();
      const isEmailConflict =
        lower.includes("users_email_key") ||
        (lower.includes("duplicate key") && lower.includes("email"));
      if (!isEmailConflict) {
        throw new ApiError(500, upsertUserError.message);
      }

      const { data: existingByEmail, error: existingByEmailError } = await supabase
        .from("users")
        .select("id, email, name, created_at")
        .eq("email", userEmail)
        .maybeSingle();

      if (existingByEmailError) {
        throw new ApiError(500, existingByEmailError.message);
      }
      if (!existingByEmail) {
        throw new ApiError(500, upsertUserError.message);
      }
      userId = existingByEmail.id;
    }

    const profilePayload: Record<string, unknown> = {
      user_id: userId,
      occupation: woman.occupation,
      age: woman.age,
      hobbies: woman.hobbies,
      editor_choice: woman.editorChoice,
      language_choice: woman.languageChoice,
      github_username: woman.githubUsername,
      vibe_badge: woman.vibeBadge,
      favorite_framework: woman.favoriteFramework,
      favorite_os: woman.favoriteOS,
      favorite_data_structure: woman.favoriteDataStructure,
      favorite_algorithm: woman.favoriteAlgorithm,
      gender: "FEMALE",
      location_text: fallbackLocation.locationText,
      latitude: fallbackLocation.latitude,
      longitude: fallbackLocation.longitude,
      challenge_level: woman.challengeLevel,
      updated_at: now
    };
    profilePayload[imageColumn] = woman.profileImageUrl;

    const { error: upsertProfileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "user_id" });
    if (upsertProfileError) {
      throw new ApiError(500, upsertProfileError.message);
    }

    existingAppByEmail.set(userEmail, {
      id: userId,
      email: userEmail,
      name: woman.name,
      created_at: now
    });
    existingAppByEmail.set(woman.email.toLowerCase(), {
      id: userId,
      email: userEmail,
      name: woman.name,
      created_at: now
    });
    for (const alias of woman.aliases ?? []) {
      existingAppByEmail.set(alias.toLowerCase(), {
        id: userId,
        email: userEmail,
        name: woman.name,
        created_at: now
      });
    }
  }

  invalidateUsersCache();
}

async function ensureWomenRosterUsers() {
  const now = Date.now();
  if (now - lastWomenRosterSyncAt < 10_000) {
    return;
  }

  if (womenRosterSyncPromise) {
    return womenRosterSyncPromise;
  }

  womenRosterSyncPromise = (async () => {
    await syncWomenRosterUsers();
    lastWomenRosterSyncAt = Date.now();
  })().finally(() => {
    womenRosterSyncPromise = null;
  });

  return womenRosterSyncPromise;
}

async function syncAuthUsersIntoAppUsers() {
  const supabase = getSupabaseAdminClient();
  const { data: authUsersPage, error: authUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (authUsersError) {
    throw new ApiError(500, authUsersError.message);
  }

  const authUsers = authUsersPage.users ?? [];
  const authIds = authUsers.map((user) => user.id);
  if (authIds.length === 0) {
    return;
  }

  const existingRows = await getUserRowsByIds(authIds);
  const existingIds = new Set(existingRows.map((row) => row.id));
  const missingUsers = authUsers.filter((user) => !existingIds.has(user.id));

  if (missingUsers.length === 0) {
    return;
  }

  const upsertRows = missingUsers
    .map((authUser) => {
      const email = authUser.email?.trim().toLowerCase();
      if (!email) {
        return null;
      }
      const metadataName =
        typeof authUser.user_metadata?.name === "string"
          ? authUser.user_metadata.name
          : typeof authUser.user_metadata?.full_name === "string"
            ? authUser.user_metadata.full_name
            : null;

      return {
        id: authUser.id,
        email,
        name: (metadataName?.trim() || email.split("@")[0] || "Developer").slice(0, 80),
        updated_at: new Date().toISOString()
      };
    })
    .filter((row): row is { id: string; email: string; name: string; updated_at: string } => Boolean(row));

  if (upsertRows.length === 0) {
    return;
  }

  const { error: upsertError } = await supabase.from("users").upsert(upsertRows, {
    onConflict: "id"
  });
  if (upsertError) {
    throw new ApiError(500, upsertError.message);
  }

  invalidateUsersCache();
}

async function ensureAuthUsersInAppTable() {
  const now = Date.now();
  if (now - lastAuthAppUserSyncAt < 30_000) {
    return;
  }

  if (authAppUserSyncPromise) {
    return authAppUserSyncPromise;
  }

  authAppUserSyncPromise = (async () => {
    await syncAuthUsersIntoAppUsers();
    lastAuthAppUserSyncAt = Date.now();
  })().finally(() => {
    authAppUserSyncPromise = null;
  });

  return authAppUserSyncPromise;
}

export async function uploadProfileImage(input: {
  userId: string;
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
}) {
  const supabase = getSupabaseAdminClient();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("id", input.userId)
    .maybeSingle();
  if (userError) {
    throw new ApiError(500, userError.message);
  }
  if (!userRow) {
    throw new ApiError(404, "User not found");
  }

  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  if (!allowedTypes.has(input.contentType)) {
    throw new ApiError(400, "Only PNG, JPG, and WEBP images are allowed");
  }
  if (input.bytes.byteLength > 5 * 1024 * 1024) {
    throw new ApiError(400, "Image size must be 5MB or less");
  }

  await ensureProfileImageBucket();

  const extension = inferImageExtension(input.fileName, input.contentType);
  const filePath = `${input.userId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(filePath, input.bytes, {
      contentType: input.contentType,
      upsert: true
    });
  if (uploadError) {
    throw new ApiError(500, uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .getPublicUrl(filePath);
  const imageUrl = publicUrlData.publicUrl;

  const imageColumn = await resolveProfileImageColumn();
  const profilePayload: Record<string, unknown> = {
    user_id: input.userId,
    updated_at: new Date().toISOString()
  };
  profilePayload[imageColumn] = imageUrl;

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" });

  if (profileError) {
    throw new ApiError(500, profileError.message);
  }

  invalidateUsersCache();
  return getUserById(input.userId);
}

export async function getHealth() {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("users").select("id").limit(1);
  const db: "up" | "down" = error ? "down" : "up";

  return {
    status: db === "up" ? "ok" : "degraded",
    services: { db },
    timestamp: new Date().toISOString()
  };
}

export async function listUsers() {
  const now = Date.now();
  if (usersCache && usersCache.expiresAt > now) {
    return usersCache.data;
  }

  await ensureMatchingProfileColumns();
  try {
    await ensureWomenRosterUsers();
  } catch (error) {
    console.warn("Women roster sync skipped:", error);
  }
  try {
    await ensureAuthUsersInAppTable();
  } catch (error) {
    console.warn("Auth user sync skipped:", error);
  }

  const supabase = getSupabaseAdminClient();
  const { data: userRows, error: usersError } = await supabase
    .from("users")
    .select("id, email, name, created_at")
    .order("created_at", { ascending: true });

  if (usersError) {
    throw new ApiError(500, usersError.message);
  }

  const users = userRows ?? [];
  const profiles = await getProfileRowsByUserIds(users.map((user) => user.id));
  const profileByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]));

  const mapped = users.map((user) => mapUser(user, profileByUserId.get(user.id) ?? null));
  usersCache = {
    data: mapped,
    expiresAt: Date.now() + 30_000
  };
  return mapped;
}

export async function getUserById(userId: string) {
  const supabase = getSupabaseAdminClient();
  let { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, email, name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw new ApiError(500, userError.message);
  }

  if (!userRow) {
    const resolvedRows = await resolveUserRowsByRequestedIds([userId]);
    const resolved = resolvedRows.get(userId);
    if (!resolved) {
      throw new ApiError(404, "User not found");
    }
    userRow = resolved;
  }

  const profileUserId = userRow.id ?? userId;
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", profileUserId)
    .maybeSingle();

  if (profileError) {
    throw new ApiError(500, profileError.message);
  }

  return mapUser(userRow, profileRow ?? null);
}

export async function updateUserProfile(
  userId: string,
  input: {
    name?: string;
    occupation?: string | null;
    age?: number | null;
    hobbies?: string[];
    editorChoice?: string | null;
    languageChoice?: string | null;
    githubUsername?: string | null;
    vibeBadge?: string | null;
    favoriteFramework?: string | null;
    favoriteOS?: string | null;
    favoriteDataStructure?: string | null;
    favoriteAlgorithm?: string | null;
    gender?: ProfileGender | null;
    locationText?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    challengeLevel?: ChallengeDifficulty;
  }
) {
  const supabase = getSupabaseAdminClient();
  const hasMatchingFields =
    input.gender !== undefined ||
    input.locationText !== undefined ||
    input.latitude !== undefined ||
    input.longitude !== undefined;
  const hasColumns = await ensureMatchingProfileColumns();
  if (hasMatchingFields && !hasColumns) {
    throw new ApiError(
      500,
      "Missing profile matching columns. Run supabase/schema.sql to add gender/location fields."
    );
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingUserError) {
    throw new ApiError(500, existingUserError.message);
  }

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  if (typeof input.name === "string") {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new ApiError(400, "name must not be empty");
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({ name: trimmedName, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateUserError) {
      throw new ApiError(500, updateUserError.message);
    }
  }

  const profilePayload: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString()
  };

  if (input.occupation !== undefined) {
    profilePayload.occupation = input.occupation;
  }
  if (input.age !== undefined) {
    profilePayload.age = input.age;
  }
  if (input.hobbies !== undefined) {
    profilePayload.hobbies = normalizeHobbies(input.hobbies);
  }
  if (input.editorChoice !== undefined) {
    profilePayload.editor_choice = input.editorChoice;
  }
  if (input.languageChoice !== undefined) {
    profilePayload.language_choice = input.languageChoice;
  }
  if (input.githubUsername !== undefined) {
    profilePayload.github_username = input.githubUsername;
  }
  if (input.vibeBadge !== undefined) {
    profilePayload.vibe_badge = input.vibeBadge;
  }
  if (input.favoriteFramework !== undefined) {
    profilePayload.favorite_framework = input.favoriteFramework;
  }
  if (input.favoriteOS !== undefined) {
    profilePayload.favorite_os = input.favoriteOS;
  }
  if (input.favoriteDataStructure !== undefined) {
    profilePayload.favorite_data_structure = input.favoriteDataStructure;
  }
  if (input.favoriteAlgorithm !== undefined) {
    profilePayload.favorite_algorithm = input.favoriteAlgorithm;
  }
  if (input.gender !== undefined) {
    profilePayload.gender = input.gender;
  }
  if (input.locationText !== undefined) {
    profilePayload.location_text = input.locationText;
  }
  if (input.latitude !== undefined) {
    profilePayload.latitude = input.latitude;
  }
  if (input.longitude !== undefined) {
    profilePayload.longitude = input.longitude;
  }
  if (input.challengeLevel !== undefined) {
    profilePayload.challenge_level = input.challengeLevel;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" });

  if (profileError) {
    throw new ApiError(500, profileError.message);
  }

  invalidateUsersCache();
  return getUserById(userId);
}

async function fetchLeetCodeProblem(difficulty: string) {
  // Convert our difficulty to LeetCode's TitleCase format (EASY -> Easy)
  const lcDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

  const randomQuery = `
    query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
      randomQuestion(categorySlug: $categorySlug, filters: $filters) {
        titleSlug
      }
    }
  `;
  const randomRes = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: randomQuery,
      variables: { categorySlug: "", filters: { difficulty: lcDifficulty } }
    }),
    cache: "no-store"
  });

  if (!randomRes.ok) {
    throw new ApiError(500, "Failed to fetch random question from LeetCode");
  }

  const randomData = await randomRes.json();
  const titleSlug = randomData.data?.randomQuestion?.titleSlug;

  if (!titleSlug) {
    throw new ApiError(500, "Could not find a random question for this difficulty");
  }

  const questionQuery = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        titleSlug
        content
        difficulty
        codeSnippets {
          langSlug
          code
        }
      }
    }
  `;

  const questionRes = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: questionQuery,
      variables: { titleSlug }
    }),
    cache: "no-store"
  });

  if (!questionRes.ok) {
    throw new ApiError(500, "Failed to fetch question details from LeetCode");
  }

  const questionData = await questionRes.json();
  const q = questionData.data?.question;

  if (!q) {
    throw new ApiError(500, "Failed to parse question details from LeetCode");
  }

  const starterCode: Record<string, string> = {};
  if (Array.isArray(q.codeSnippets)) {
    for (const snippet of q.codeSnippets) {
      starterCode[snippet.langSlug] = snippet.code;
    }
  }

  return {
    slug: q.titleSlug,
    title: q.title,
    difficulty: q.difficulty.toUpperCase(),
    description: q.content ?? "",
    starter_code: starterCode,
    test_cases: [] // Empty array for now since LeetCode hides actual testcases
  };
}

export async function getRandomChallenge(difficulty: string) {
  const normalized = difficulty.toUpperCase();
  if (normalized !== "EASY" && normalized !== "MEDIUM" && normalized !== "HARD") {
    throw new ApiError(400, "difficulty must be EASY, MEDIUM, or HARD");
  }

  const supabase = getSupabaseAdminClient();
  const challengeDifficulty = normalized as ChallengeDifficulty;
  let challengePayload: {
    slug: string;
    title: string;
    difficulty: string;
    description: string;
    starter_code: Record<string, string>;
    test_cases: unknown[];
  };

  try {
    challengePayload = await fetchLeetCodeProblem(challengeDifficulty);
  } catch {
    challengePayload = getFallbackChallenge(challengeDifficulty);
  }

  const { data: challengeRow, error } = await supabase
    .from("challenges")
    .upsert(
      {
        slug: challengePayload.slug,
        title: challengePayload.title,
        difficulty: challengePayload.difficulty,
        description: challengePayload.description,
        starter_code: challengePayload.starter_code,
        test_cases: challengePayload.test_cases,
        updated_at: new Date().toISOString()
      },
      { onConflict: "slug" }
    )
    .select("*")
    .single();

  if (error) {
    throw new ApiError(500, error.message);
  }

  return mapChallenge(challengeRow);
}

export async function openInterestRequest(challengerId: string, targetId: string) {
  if (challengerId === targetId) {
    throw new ApiError(400, "You cannot request yourself");
  }

  const [challenger, target] = await Promise.all([getUserById(challengerId), getUserById(targetId)]);
  if (!challenger) {
    throw new ApiError(404, "Challenger not found");
  }
  if (!target) {
    throw new ApiError(404, "Target user not found");
  }

  const supabase = getSupabaseAdminClient();
  const { data: existingRequest, error: existingRequestError } = await supabase
    .from("interest_requests")
    .select("*")
    .eq("challenger_id", challengerId)
    .eq("target_id", targetId)
    .in("status", ["PENDING_CHALLENGER", "PENDING_RECIPIENT"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRequestError) {
    throw new ApiError(500, existingRequestError.message);
  }
  if (existingRequest?.id) {
    if (existingRequest.status === "PENDING_CHALLENGER") {
      const challengeRow = await getChallengeById(existingRequest.challenge_id);
      return mapInterestRequest(existingRequest, challengeRow);
    }

    const { error: cancelPreviousError } = await supabase
      .from("interest_requests")
      .update({ status: "CANCELLED" })
      .eq("id", existingRequest.id)
      .eq("status", "PENDING_RECIPIENT");

    if (cancelPreviousError) {
      throw new ApiError(500, cancelPreviousError.message);
    }
  }

  const difficulty = challenger.profile?.challengeLevel ?? "EASY";
  const challenge = await getRandomChallenge(difficulty);

  const { data: requestRow, error: requestError } = await supabase
    .from("interest_requests")
    .insert({
      challenger_id: challengerId,
      target_id: targetId,
      challenge_id: challenge.id,
      status: "PENDING_CHALLENGER"
    })
    .select("*")
    .single();

  if (requestError) {
    throw new ApiError(500, requestError.message);
  }

  return mapInterestRequest(requestRow, {
    id: challenge.id,
    title: challenge.title,
    slug: challenge.slug,
    description: challenge.description,
    difficulty: challenge.difficulty,
    starter_code: challenge.starterCode,
    test_cases: challenge.testCases
  });
}

async function ensureMatchRoomForRequest(requestId: string, challengerId: string, targetId: string) {
  const supabase = getSupabaseAdminClient();

  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .upsert(
      {
        request_id: requestId,
        user_a_id: challengerId,
        user_b_id: targetId
      },
      { onConflict: "request_id" }
    )
    .select("id")
    .single();

  if (matchError) {
    throw new ApiError(500, matchError.message);
  }

  const { error: roomError } = await supabase
    .from("chat_rooms")
    .upsert({ match_id: matchRow.id }, { onConflict: "match_id" });

  if (roomError) {
    throw new ApiError(500, roomError.message);
  }
}

export async function submitInterestAttempt(
  requestId: string,
  userId: string,
  passed: boolean,
  submittedCode?: string
) {
  const supabase = getSupabaseAdminClient();

  const requestRow = await getInterestRequestById(requestId);
  const status = requestRow.status as RequestStatus;

  if (FINAL_STATUSES.has(status)) {
    throw new ApiError(400, "Request already finalized");
  }

  const { data: attemptRows, error: attemptsError } = await supabase
    .from("challenge_attempts")
    .select("id, user_id")
    .eq("request_id", requestId);

  if (attemptsError) {
    throw new ApiError(500, attemptsError.message);
  }

  if ((attemptRows ?? []).some((attempt) => attempt.user_id === userId)) {
    throw new ApiError(400, "One attempt already used for this request");
  }

  const isChallenger = requestRow.challenger_id === userId;
  const isTarget = requestRow.target_id === userId;

  if (!isChallenger && !isTarget) {
    throw new ApiError(403, "User is not part of this request");
  }

  if (status === "PENDING_CHALLENGER" && !isChallenger) {
    throw new ApiError(403, "Only challenger can submit first attempt");
  }

  if (status === "PENDING_RECIPIENT" && !isTarget) {
    throw new ApiError(403, "Only recipient can submit handshake attempt");
  }

  const { error: createAttemptError } = await supabase.from("challenge_attempts").insert({
    request_id: requestId,
    user_id: userId,
    passed,
    submitted_code: submittedCode ?? null
  });

  if (createAttemptError) {
    throw new ApiError(500, createAttemptError.message);
  }

  if (!passed) {
    const { data: failedRequest, error: failedRequestError } = await supabase
      .from("interest_requests")
      .update({ status: "FAILED" })
      .eq("id", requestId)
      .select("*")
      .single();

    if (failedRequestError) {
      throw new ApiError(500, failedRequestError.message);
    }

    const challengeRow = await getChallengeById(failedRequest.challenge_id);
    await createNotification({
      recipientId: failedRequest.challenger_id,
      requestId: failedRequest.id,
      kind: "REQUEST_FAILED",
      title: "Request failed",
      body: "Your coding challenge attempt failed, so the request was not sent."
    });
    return mapInterestRequest(failedRequest, challengeRow);
  }

  if (status === "PENDING_CHALLENGER") {
    const { data: updatedRequest, error: updatedRequestError } = await supabase
      .from("interest_requests")
      .update({
        status: "PENDING_RECIPIENT",
        requested_at: new Date().toISOString()
      })
      .eq("id", requestId)
      .select("*")
      .single();

    if (updatedRequestError) {
      throw new ApiError(500, updatedRequestError.message);
    }

    const [challenger, challengeRow] = await Promise.all([
      getUserById(updatedRequest.challenger_id),
      getChallengeById(updatedRequest.challenge_id)
    ]);

    await createNotification({
      recipientId: updatedRequest.target_id,
      actorId: updatedRequest.challenger_id,
      requestId: updatedRequest.id,
      kind: "REQUEST_RECEIVED",
      title: `${challenger?.name ?? "Someone"} sent you a request`,
      body: `They cleared ${challengeRow.title}. Review the request in Notifications.`,
      payload: {
        challengeTitle: challengeRow.title,
        difficulty: challengeRow.difficulty
      }
    });

    return mapInterestRequest(updatedRequest, challengeRow);
  }

  const { data: matchedRequest, error: matchedRequestError } = await supabase
    .from("interest_requests")
    .update({
      status: "MATCHED",
      matched_at: new Date().toISOString()
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (matchedRequestError) {
    throw new ApiError(500, matchedRequestError.message);
  }

  await ensureMatchRoomForRequest(
    matchedRequest.id,
    matchedRequest.challenger_id,
    matchedRequest.target_id
  );

  const challengeRow = await getChallengeById(matchedRequest.challenge_id);
  return mapInterestRequest(matchedRequest, challengeRow);
}

export async function getOutgoingRequestedTargetIds(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("interest_requests")
    .select("target_id")
    .eq("challenger_id", userId)
    .in("status", ["PENDING_CHALLENGER", "PENDING_RECIPIENT", "MATCHED"]);

  if (error) {
    throw new ApiError(500, error.message);
  }

  return [...new Set((rows ?? []).map((row) => row.target_id))];
}

export async function cancelInterestRequest(requestId: string, challengerId: string) {
  const supabase = getSupabaseAdminClient();
  const requestRow = await getInterestRequestById(requestId);

  if (requestRow.challenger_id !== challengerId) {
    throw new ApiError(403, "Only challenger can cancel this request");
  }

  if (FINAL_STATUSES.has(requestRow.status as RequestStatus)) {
    throw new ApiError(400, "Request already finalized");
  }

  const { data, error } = await supabase
    .from("interest_requests")
    .update({ status: "CANCELLED" })
    .eq("id", requestId)
    .select("*")
    .single();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (requestRow.status === "PENDING_RECIPIENT") {
    const challenger = await getUserById(challengerId);
    await createNotification({
      recipientId: requestRow.target_id,
      actorId: challengerId,
      requestId,
      kind: "REQUEST_CANCELLED",
      title: `${challenger?.name ?? "Someone"} withdrew a request`,
      body: "The pending request was cancelled before you responded."
    });
  }

  return data;
}

export async function getPendingForUser(userId: string) {
  const supabase = getSupabaseAdminClient();

  const { data: requestRows, error: requestError } = await supabase
    .from("interest_requests")
    .select("*")
    .eq("target_id", userId)
    .eq("status", "PENDING_RECIPIENT")
    .order("created_at", { ascending: false });

  if (requestError) {
    throw new ApiError(500, requestError.message);
  }

  const rows = requestRows ?? [];
  const challengeRows = await getChallengesByIds(rows.map((request) => request.challenge_id));
  const challengeById = new Map(challengeRows.map((challenge) => [challenge.id, challenge]));

  const challengerIds = rows.map((request) => request.challenger_id);
  const [challengerRows, challengerProfiles] = await Promise.all([
    getUserRowsByIds(challengerIds),
    getProfileRowsByUserIds(challengerIds)
  ]);
  const challengerById = new Map(challengerRows.map((challenger) => [challenger.id, challenger]));
  const challengerProfileById = new Map(
    challengerProfiles.map((profile) => [profile.user_id, profile])
  );

  return rows.map((request) => {
    const challenge = challengeById.get(request.challenge_id);
    if (!challenge) {
      throw new ApiError(500, "Challenge missing for request");
    }

    const challenger = challengerById.get(request.challenger_id);

    return {
      ...mapInterestRequest(request, challenge),
      createdAt: request.created_at,
      requestedAt: request.requested_at,
      challenger: challenger
        ? {
            id: challenger.id,
            name: challenger.name,
            profileImage:
              challengerProfileById.get(challenger.id)?.profile_image_url ??
              challengerProfileById.get(challenger.id)?.profile_image ??
              null
          }
        : null
    };
  });
}

export async function respondToInterestRequest(
  requestId: string,
  userId: string,
  decision: "ACCEPT" | "DECLINE"
) {
  const supabase = getSupabaseAdminClient();
  const requestRow = await getInterestRequestById(requestId);

  if (requestRow.target_id !== userId) {
    throw new ApiError(403, "Only the recipient can respond to this request");
  }

  if (requestRow.status !== "PENDING_RECIPIENT") {
    throw new ApiError(400, "This request is no longer awaiting a response");
  }

  const [recipient, challenger, challengeRow] = await Promise.all([
    getUserById(userId),
    getUserById(requestRow.challenger_id),
    getChallengeById(requestRow.challenge_id)
  ]);

  if (decision === "DECLINE") {
    const { data: declinedRequest, error: declinedRequestError } = await supabase
      .from("interest_requests")
      .update({ status: "CANCELLED" })
      .eq("id", requestId)
      .eq("status", "PENDING_RECIPIENT")
      .select("*")
      .single();

    if (declinedRequestError) {
      throw new ApiError(500, declinedRequestError.message);
    }

    await createNotification({
      recipientId: requestRow.challenger_id,
      actorId: userId,
      requestId,
      kind: "REQUEST_DECLINED",
      title: `${recipient?.name ?? "A user"} declined your request`,
      body: `Your request for ${challengeRow.title} was declined.`
    });

    return mapInterestRequest(declinedRequest, challengeRow);
  }

  const { data: matchedRequest, error: matchedRequestError } = await supabase
    .from("interest_requests")
    .update({
      status: "MATCHED",
      matched_at: new Date().toISOString()
    })
    .eq("id", requestId)
    .eq("status", "PENDING_RECIPIENT")
    .select("*")
    .single();

  if (matchedRequestError) {
    throw new ApiError(500, matchedRequestError.message);
  }

  await ensureMatchRoomForRequest(
    matchedRequest.id,
    matchedRequest.challenger_id,
    matchedRequest.target_id
  );

  await createNotification({
    recipientId: requestRow.challenger_id,
    actorId: userId,
    requestId,
    kind: "REQUEST_ACCEPTED",
    title: `${recipient?.name ?? "A user"} accepted your request`,
    body: `You matched with ${recipient?.name ?? "them"}. Open Chat to continue.`,
    payload: {
      challengerName: challenger?.name ?? null,
      recipientName: recipient?.name ?? null
    }
  });

  return mapInterestRequest(matchedRequest, challengeRow);
}

export async function getMatchesForUser(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: matchRows, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (matchError) {
    throw new ApiError(500, matchError.message);
  }

  const matches = matchRows ?? [];
  if (matches.length === 0) {
    return [];
  }

  const participantIds = [...new Set(matches.flatMap((match) => [match.user_a_id, match.user_b_id]))];
  const resolvedByRequestedId = await resolveUserRowsByRequestedIds(participantIds);
  const canonicalProfileIds = [...new Set([...resolvedByRequestedId.values()].map((row) => row.id))];
  const profileRows = await getProfileRowsByUserIds(canonicalProfileIds);
  const profileByCanonicalUserId = new Map(
    profileRows.map((profile) => [profile.user_id, mapProfile(profile)])
  );

  const { data: roomRows, error: roomError } = await supabase
    .from("chat_rooms")
    .select("*")
    .in(
      "match_id",
      matches.map((match) => match.id)
    );

  if (roomError) {
    throw new ApiError(500, roomError.message);
  }

  const roomByMatchId = new Map((roomRows ?? []).map((room) => [room.match_id, room]));

  return matches.map((match) => {
    const userA = resolvedByRequestedId.get(match.user_a_id);
    const userB = resolvedByRequestedId.get(match.user_b_id);
    const userAProfile = profileByCanonicalUserId.get(userA?.id ?? match.user_a_id);
    const userBProfile = profileByCanonicalUserId.get(userB?.id ?? match.user_b_id);

    return {
      id: match.id,
      userA: {
        id: match.user_a_id,
        name: userA?.name ?? "Unknown",
        profileImage:
          userAProfile?.profileImage ??
          resolveRosterFallbackImage(userA?.email ?? null, userA?.name ?? null)
      },
      userB: {
        id: match.user_b_id,
        name: userB?.name ?? "Unknown",
        profileImage:
          userBProfile?.profileImage ??
          resolveRosterFallbackImage(userB?.email ?? null, userB?.name ?? null)
      },
      room: roomByMatchId.has(match.id)
        ? {
            id: roomByMatchId.get(match.id)!.id
          }
        : null
    };
  });
}

export async function listNotifications(userId: string) {
  const ready = await ensureNotificationsTable();
  if (!ready) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data: notificationRows, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new ApiError(500, error.message);
  }

  const rows = notificationRows ?? [];
  const actorIds = [...new Set(rows.map((row) => row.actor_id).filter((value): value is string => Boolean(value)))];
  const [actorRows, actorProfiles] = await Promise.all([
    getUserRowsByIds(actorIds),
    getProfileRowsByUserIds(actorIds)
  ]);

  const actorById = new Map(actorRows.map((row) => [row.id, row]));
  const actorProfileById = new Map(actorProfiles.map((row) => [row.user_id, row]));

  return rows.map((row) =>
    mapNotification(row, actorById.get(row.actor_id ?? "") ?? null, actorProfileById.get(row.actor_id ?? "") ?? null)
  );
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const ready = await ensureNotificationsTable();
  if (!ready) {
    return { ok: true };
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) {
    throw new ApiError(500, error.message);
  }

  return { ok: true };
}

export async function markAllNotificationsRead(userId: string) {
  const ready = await ensureNotificationsTable();
  if (!ready) {
    return { ok: true };
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) {
    throw new ApiError(500, error.message);
  }

  return { ok: true };
}

async function ensureMatchMembership(matchId: string, userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) {
    throw new ApiError(500, matchError.message);
  }

  if (!matchRow) {
    throw new ApiError(404, "Match not found");
  }

  if (matchRow.user_a_id !== userId && matchRow.user_b_id !== userId) {
    throw new ApiError(403, "You are not part of this match");
  }

  const { data: roomRow, error: roomError } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("match_id", matchId)
    .maybeSingle();

  if (roomError) {
    throw new ApiError(500, roomError.message);
  }

  if (roomRow) {
    return {
      match: matchRow,
      room: roomRow
    };
  }

  const { data: createdRoom, error: createRoomError } = await supabase
    .from("chat_rooms")
    .insert({ match_id: matchId })
    .select("*")
    .single();

  if (createRoomError) {
    throw new ApiError(500, createRoomError.message);
  }

  return {
    match: matchRow,
    room: createdRoom
  };
}

export async function getChatMessages(matchId: string, userId: string, limit: number) {
  const supabase = getSupabaseAdminClient();
  const { room } = await ensureMatchMembership(matchId, userId);

  const boundedLimit = clamp(Number(limit) || 50, 1, 100);

  const { data: messageRows, error: messageError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true })
    .limit(boundedLimit);

  if (messageError) {
    throw new ApiError(500, messageError.message);
  }

  const messages = messageRows ?? [];
  const senderByRequestedId = await resolveUserRowsByRequestedIds(
    [...new Set(messages.map((message) => message.sender_id))]
  );

  return messages.map((message) =>
    mapChatMessage(message, senderByRequestedId.get(message.sender_id) ?? null)
  );
}

export async function createChatMessage(
  matchId: string,
  senderId: string,
  content: string,
  format: MessageFormat
) {
  const supabase = getSupabaseAdminClient();
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    throw new ApiError(400, "Message content is required");
  }

  const { room } = await ensureMatchMembership(matchId, senderId);

  const { data: messageRow, error: messageError } = await supabase
    .from("chat_messages")
    .insert({
      room_id: room.id,
      sender_id: senderId,
      content: normalizedContent,
      format
    })
    .select("*")
    .single();

  if (messageError) {
    throw new ApiError(500, messageError.message);
  }

  const senderByRequestedId = await resolveUserRowsByRequestedIds([senderId]);
  return mapChatMessage(messageRow, senderByRequestedId.get(senderId) ?? null);
}

function buildDemoConversation(
  person: WomenRosterSeed,
  currentUserName: string
) {
  const focusByName: Record<string, string> = {
    Alana: "data pipeline retries and backfills",
    Amara: "platform reliability and incident reduction",
    Isabelle: "frontend polish and interaction quality",
    Julia: "API design and transactional boundaries",
    Katrina: "UI smoothness and perceived performance",
    Maria: "observability and release safety",
    Mei: "model-serving latency and feature quality",
    Nadia: "design-system consistency and UX details",
    Seraphina: "security hardening and auth flows",
    Sloane: "infra automation and rollout safety",
    Yuna: "mobile architecture and offline sync"
  };

  const focus = focusByName[person.name] ?? "product quality";
  const snippetByLanguage: Record<string, string> = {
    TypeScript: "const byId = new Map(rows.map((row) => [row.id, row]));\nreturn ids.map((id) => byId.get(id)).filter(Boolean);",
    Go: "if err := tx.WithContext(ctx).Create(&req).Error; err != nil {\n  return err\n}\nreturn tx.Commit().Error",
    Swift: "func retry<T>(_ attempts: Int, _ work: () async throws -> T) async throws -> T {\n  var last: Error?\n  for _ in 0..<attempts { do { return try await work() } catch { last = error } }\n  throw last!\n}",
    Kotlin: "transactionTemplate.execute {\n  requestRepo.save(entity)\n  auditRepo.save(audit)\n}",
    Python: "for attempt in range(max_retries):\n    try:\n        return run_job()\n    except Exception:\n        time.sleep(2 ** attempt)",
    Rust: "match cache.get(&key) {\n    Some(v) => Ok(v.clone()),\n    None => {\n        let fresh = load_from_db().await?;\n        cache.insert(key, fresh.clone());\n        Ok(fresh)\n    }\n}"
  };

  const codeSnippet = snippetByLanguage[person.languageChoice] ??
    "const room = await db.from('chat_rooms').upsert(payload, { onConflict: 'match_id' });";

  return [
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `Hey ${person.name}, I liked how you described ${focus}. Want to pair on the GitLove demo polish tonight?`
    },
    {
      sender: "target",
      format: "MARKDOWN" as const,
      content: `Yes. Also, your message style is unexpectedly calm for launch week, ${currentUserName}. I like it.`
    },
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `I can stay calm if the architecture is clean. If not, I panic in private and fix it fast.`
    },
    {
      sender: "target",
      format: "MARKDOWN" as const,
      content: `Same. Let's make the app feel alive and still technically solid.`
    },
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `For ${focus}, I’m planning stricter state transitions plus clearer telemetry labels.`
    },
    {
      sender: "target",
      format: "CODE" as const,
      content: codeSnippet
    },
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `This is clean. Also not going to lie, discussing ${person.favoriteAlgorithm} with you is a green flag.`
    },
    {
      sender: "target",
      format: "MARKDOWN" as const,
      content: `Then I should mention I still benchmark solutions before I trust intuition.`
    },
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `Perfect. I’m doing the same for chat latency and match transitions before we present.`
    },
    {
      sender: "target",
      format: "MARKDOWN" as const,
      content: `Let's ship this and then celebrate with coffee. You can choose the place, I’ll choose the PR review order.`
    },
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `Deal. Also I want your take on whether ${person.favoriteFramework} is still the right long-term fit for this flow.`
    },
    {
      sender: "target",
      format: "MARKDOWN" as const,
      content: `For this scope, yes. Long-term we modularize and keep the domain layer boring.`
    },
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `Boring domain layer is attractive. Predictable systems and thoughtful people win every time.`
    },
    {
      sender: "target",
      format: "MARKDOWN" as const,
      content: `Agreed. Push your latest branch when ready, I’ll review with context notes not just nitpicks.`
    },
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `Sent. After this demo, we should do a no-laptop date and only talk about non-technical things for one hour.`
    },
    {
      sender: "target",
      format: "MARKDOWN" as const,
      content: `One hour might be hard, but I'll try. No promises if someone mentions distributed systems.`
    },
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `Fair. Final checklist: seeded chats, swipe flow smooth, LC gate stable, and profile data complete.`
    },
    {
      sender: "target",
      format: "MARKDOWN" as const,
      content: `All of that plus better micro-interactions. Smooth details are what make this feel premium.`
    },
    {
      sender: "admin",
      format: "MARKDOWN" as const,
      content: `Then let's close this cleanly. Thanks for being sharp and kind under pressure.`
    },
    {
      sender: "target",
      format: "MARKDOWN" as const,
      content: `Same to you. See you in the final rehearsal.`
    }
  ];
}

export async function seedDemoChatsForUser(userId: string) {
  await ensureWomenRosterUsers();

  const supabase = getSupabaseAdminClient();

  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const candidateEmails = WOMEN_ROSTER_SEED.map((person) => person.email);
  const { data: womenRows, error: womenError } = await supabase
    .from("users")
    .select("id, email, name")
    .in("email", candidateEmails);
  if (womenError) {
    throw new ApiError(500, womenError.message);
  }

  const women = (womenRows ?? []).filter((row) => row.id !== userId);
  if (women.length === 0) {
    return { createdMatches: 0, insertedMessages: 0 };
  }

  const { data: challengeRow, error: challengeError } = await supabase
    .from("challenges")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (challengeError) {
    throw new ApiError(500, challengeError.message);
  }

  let challengeId = challengeRow?.id;
  if (!challengeId) {
    const { data: createdChallenge, error: createChallengeError } = await supabase
      .from("challenges")
      .insert({
        slug: "demo-two-sum-seed",
        title: "Two Sum",
        difficulty: "EASY",
        description: "<p>Demo challenge for populated chats</p>",
        starter_code: { typescript: "function twoSum(nums:number[], target:number){ return []; }" },
        test_cases: []
      })
      .select("id")
      .single();

    if (createChallengeError) {
      throw new ApiError(500, createChallengeError.message);
    }
    challengeId = createdChallenge.id;
  }

  let createdMatches = 0;
  let insertedMessages = 0;

  for (const woman of women) {
    const rosterProfile = WOMEN_ROSTER_SEED.find(
      (entry) => entry.email === woman.email.toLowerCase()
    );

    const { data: existingRequest, error: existingRequestError } = await supabase
      .from("interest_requests")
      .select("id")
      .eq("challenger_id", userId)
      .eq("target_id", woman.id)
      .in("status", ["PENDING_RECIPIENT", "MATCHED"])
      .limit(1)
      .maybeSingle();
    if (existingRequestError) {
      throw new ApiError(500, existingRequestError.message);
    }

    let requestId = existingRequest?.id;
    if (!requestId) {
      const { data: requestRow, error: requestInsertError } = await supabase
        .from("interest_requests")
        .insert({
          challenger_id: userId,
          target_id: woman.id,
          challenge_id: challengeId,
          status: "MATCHED",
          requested_at: new Date().toISOString(),
          matched_at: new Date().toISOString()
        })
        .select("id")
        .single();
      if (requestInsertError) {
        throw new ApiError(500, requestInsertError.message);
      }
      requestId = requestRow.id;
    }

    const { data: existingMatch, error: existingMatchError } = await supabase
      .from("matches")
      .select("id")
      .eq("request_id", requestId)
      .maybeSingle();
    if (existingMatchError) {
      throw new ApiError(500, existingMatchError.message);
    }

    let matchId = existingMatch?.id;
    if (!matchId) {
      const { data: createdMatch, error: createMatchError } = await supabase
        .from("matches")
        .insert({
          request_id: requestId,
          user_a_id: userId,
          user_b_id: woman.id
        })
        .select("id")
        .single();
      if (createMatchError) {
        throw new ApiError(500, createMatchError.message);
      }
      matchId = createdMatch.id;
      createdMatches += 1;
    }

    const { data: roomRow, error: roomSelectError } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("match_id", matchId)
      .maybeSingle();
    if (roomSelectError) {
      throw new ApiError(500, roomSelectError.message);
    }

    let roomId = roomRow?.id;
    if (!roomId) {
      const { data: createdRoom, error: createRoomError } = await supabase
        .from("chat_rooms")
        .insert({ match_id: matchId })
        .select("id")
        .single();
      if (createRoomError) {
        throw new ApiError(500, createRoomError.message);
      }
      roomId = createdRoom.id;
    }

    const { count: messageCount, error: messageCountError } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId);
    if (messageCountError) {
      throw new ApiError(500, messageCountError.message);
    }

    const existingCount = messageCount ?? 0;
    if (existingCount >= 36) {
      continue;
    }

    const thread = buildDemoConversation(
      rosterProfile ?? {
        email: woman.email,
        name: woman.name,
        profileImageUrl: "/images/users/Profile.png",
        occupation: "Software Engineer",
        age: 26,
        hobbies: ["Coding", "Coffee", "Travel"],
        editorChoice: "VS Code",
        languageChoice: "TypeScript",
        githubUsername: woman.name.toLowerCase(),
        vibeBadge: "Real Developer",
        favoriteFramework: "React",
        favoriteOS: "macOS",
        favoriteDataStructure: "Hash Map",
        favoriteAlgorithm: "Two Pointers",
        challengeLevel: "EASY"
      },
      user.name
    );

    const needed = Math.max(0, 36 - existingCount);
    const messages = [];
    for (let i = 0; i < needed; i += 1) {
      const line = thread[i % thread.length];
      messages.push({
        room_id: roomId,
        sender_id: line.sender === "admin" ? userId : woman.id,
        content: line.content,
        format: line.format,
        created_at: new Date(Date.now() - (needed - i) * 1000 * 60 * 15).toISOString()
      });
    }

    const { error: insertMessagesError } = await supabase.from("chat_messages").insert(messages);
    if (insertMessagesError) {
      throw new ApiError(500, insertMessagesError.message);
    }
    insertedMessages += messages.length;
  }

  return { createdMatches, insertedMessages };
}

export async function getBuildLog(userId: string) {
  const supabase = getSupabaseAdminClient();
  const user = await getUserById(userId);
  const globalSignals = await getStackTrace();

  const [attemptRowsResult, commitCountResult, pendingRowsResult, matchCountAResult, matchCountBResult] =
    await Promise.all([
      supabase
        .from("challenge_attempts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("interest_requests").select("id", { count: "exact", head: true }).eq("challenger_id", userId),
      supabase
        .from("interest_requests")
        .select("*")
        .eq("challenger_id", userId)
        .eq("status", "PENDING_RECIPIENT")
        .order("created_at", { ascending: false }),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_a_id", userId),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_b_id", userId)
    ]);

  const allResults = [
    attemptRowsResult,
    commitCountResult,
    pendingRowsResult,
    matchCountAResult,
    matchCountBResult
  ];

  for (const result of allResults) {
    if (result.error) {
      throw new ApiError(500, result.error.message);
    }
  }

  const attempts = attemptRowsResult.data ?? [];
  const pendingRows = pendingRowsResult.data ?? [];
  const commits = commitCountResult.count ?? 0;
  const matchCount = (matchCountAResult.count ?? 0) + (matchCountBResult.count ?? 0);

  const attemptRequestIds = [...new Set(attempts.map((attempt) => attempt.request_id))];
  const pendingChallengeIds = pendingRows.map((request) => request.challenge_id);
  const pendingTargetIds = pendingRows.map((request) => request.target_id);

  const { data: requestRows, error: requestRowsError } = attemptRequestIds.length
    ? await supabase.from("interest_requests").select("*").in("id", attemptRequestIds)
    : { data: [], error: null };

  if (requestRowsError) {
    throw new ApiError(500, requestRowsError.message);
  }

  const requests = requestRows ?? [];
  const requestById = new Map(requests.map((request) => [request.id, request]));

  const challengeIds = [
    ...new Set([
      ...pendingChallengeIds,
      ...requests.map((request) => request.challenge_id)
    ])
  ];

  const targetUserIds = [
    ...new Set([
      ...pendingTargetIds,
      ...requests.map((request) => request.target_id)
    ])
  ];

  const [challengeRows, targetRows] = await Promise.all([
    getChallengesByIds(challengeIds),
    getUserRowsByIds(targetUserIds)
  ]);

  const challengeById = new Map(challengeRows.map((challenge) => [challenge.id, challenge]));
  const targetById = new Map(targetRows.map((target) => [target.id, target]));

  const passedAttempts = attempts.filter((attempt) => attempt.passed).length;
  const failedAttempts = attempts.length - passedAttempts;
  const successRate = attempts.length > 0 ? (passedAttempts / attempts.length) * 100 : 0;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    },
    systemHealth: {
      successRate: Number(successRate.toFixed(2)),
      totalAttempts: attempts.length,
      passedAttempts,
      failedAttempts,
      matchCount
    },
    globalSignals: {
      trendingLanguages: globalSignals.trendingLanguages,
      challengePassRateByDifficulty: globalSignals.challengePassRateByDifficulty
    },
    commits,
    pendingPullRequests: pendingRows.map((request) => ({
      requestId: request.id,
      target: {
        id: request.target_id,
        name: targetById.get(request.target_id)?.name ?? "Unknown"
      },
      challenge: (() => {
        const challenge = challengeById.get(request.challenge_id);
        return {
          id: request.challenge_id,
          title: challenge?.title ?? "Unknown",
          difficulty: challenge?.difficulty ?? "EASY"
        };
      })(),
      requestedAt: request.requested_at,
      createdAt: request.created_at
    })),
    recentAttempts: attempts.slice(0, 10).map((attempt) => {
      const request = requestById.get(attempt.request_id);
      const challenge = request ? challengeById.get(request.challenge_id) : null;
      const targetName = request ? targetById.get(request.target_id)?.name ?? "Unknown" : "Unknown";

      return {
        attemptId: attempt.id,
        requestId: attempt.request_id,
        passed: attempt.passed,
        challenge: {
          id: challenge?.id ?? "unknown",
          title: challenge?.title ?? "Unknown",
          difficulty: (challenge?.difficulty ?? "EASY") as ChallengeDifficulty
        },
        targetName,
        createdAt: attempt.created_at
      };
    })
  };
}

function toRate(passed: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number(((passed / total) * 100).toFixed(2));
}

export async function getStackTrace() {
  const supabase = getSupabaseAdminClient();

  const [users, matches, requests, messages] = await Promise.all([
    countRows("users"),
    countRows("matches"),
    countRows("interest_requests"),
    countRows("chat_messages")
  ]);

  const { data: recentMatches, error: recentMatchesError } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  if (recentMatchesError) {
    throw new ApiError(500, recentMatchesError.message);
  }

  const mergeRows = recentMatches ?? [];
  const mergeUserIds = [
    ...new Set(mergeRows.flatMap((match) => [match.user_a_id, match.user_b_id]))
  ];

  const [mergeUsers, mergeProfiles] = await Promise.all([
    getUserRowsByIds(mergeUserIds),
    getProfileRowsByUserIds(mergeUserIds)
  ]);

  const mergeUserById = new Map(mergeUsers.map((user) => [user.id, user]));
  const mergeProfileByUserId = new Map(mergeProfiles.map((profile) => [profile.user_id, profile]));

  const languageCounter = new Map<string, number>();
  for (const merge of mergeRows) {
    const userLanguages = [
      mergeProfileByUserId.get(merge.user_a_id)?.language_choice,
      mergeProfileByUserId.get(merge.user_b_id)?.language_choice
    ];

    for (const language of userLanguages) {
      if (!language || typeof language !== "string") {
        continue;
      }
      languageCounter.set(language, (languageCounter.get(language) ?? 0) + 1);
    }
  }

  const trendingLanguages = [...languageCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([language, count]) => ({ language, count }));

  const liveMerges = mergeRows.map((merge) => ({
    matchId: merge.id,
    createdAt: merge.created_at,
    users: [
      {
        id: merge.user_a_id,
        name: mergeUserById.get(merge.user_a_id)?.name ?? "Unknown"
      },
      {
        id: merge.user_b_id,
        name: mergeUserById.get(merge.user_b_id)?.name ?? "Unknown"
      }
    ]
  }));

  const { data: attemptRows, error: attemptRowsError } = await supabase
    .from("challenge_attempts")
    .select("request_id, passed");

  if (attemptRowsError) {
    throw new ApiError(500, attemptRowsError.message);
  }

  const attempts = attemptRows ?? [];
  const requestIds = [...new Set(attempts.map((attempt) => attempt.request_id))];

  const { data: requestRows, error: requestRowsError } = requestIds.length
    ? await supabase.from("interest_requests").select("id, challenge_id").in("id", requestIds)
    : { data: [], error: null };

  if (requestRowsError) {
    throw new ApiError(500, requestRowsError.message);
  }

  const requestById = new Map((requestRows ?? []).map((request) => [request.id, request]));

  const challenges = await getChallengesByIds(
    [...new Set((requestRows ?? []).map((request) => request.challenge_id))]
  );
  const challengeById = new Map(challenges.map((challenge) => [challenge.id, challenge]));

  const byDifficulty: Record<ChallengeDifficulty, { attempts: number; passed: number }> = {
    EASY: { attempts: 0, passed: 0 },
    MEDIUM: { attempts: 0, passed: 0 },
    HARD: { attempts: 0, passed: 0 }
  };

  for (const attempt of attempts) {
    const request = requestById.get(attempt.request_id);
    const challenge = request ? challengeById.get(request.challenge_id) : null;
    const difficulty = (challenge?.difficulty ?? "EASY") as ChallengeDifficulty;

    byDifficulty[difficulty].attempts += 1;
    if (attempt.passed) {
      byDifficulty[difficulty].passed += 1;
    }
  }

  return {
    totals: {
      users,
      matches,
      requests,
      messages
    },
    trendingLanguages,
    liveMerges,
    challengePassRateByDifficulty: {
      EASY: toRate(byDifficulty.EASY.passed, byDifficulty.EASY.attempts),
      MEDIUM: toRate(byDifficulty.MEDIUM.passed, byDifficulty.MEDIUM.attempts),
      HARD: toRate(byDifficulty.HARD.passed, byDifficulty.HARD.attempts)
    }
  };
}
