import { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { getSupabaseAdminClient, getSupabaseAnonServerClient } from "@/lib/supabase/server";

type ChallengeDifficulty = "EASY" | "MEDIUM" | "HARD";
type RequestStatus =
  | "PENDING_CHALLENGER"
  | "PENDING_RECIPIENT"
  | "MATCHED"
  | "FAILED"
  | "CANCELLED";
type MessageFormat = "TEXT" | "MARKDOWN" | "CODE";

const FINAL_STATUSES = new Set<RequestStatus>(["MATCHED", "FAILED", "CANCELLED"]);

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
    challengeLevel: (row.challenge_level ?? "EASY") as ChallengeDifficulty
  };
}

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
  return {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    profile: mapProfile(profileRow)
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

  return mapUser(userRow, profileRow ?? null);
}

function getConfiguredAdminEmail() {
  return process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export async function requireAdminUser(authHeader: string | null) {
  const authUser = await getAuthUserFromAuthorizationHeader(authHeader);
  const configuredAdminEmail = getConfiguredAdminEmail();
  const email = authUser.email?.trim().toLowerCase() ?? "";

  if (!configuredAdminEmail) {
    throw new ApiError(503, "Admin email is not configured");
  }

  if (!email || email !== configuredAdminEmail) {
    throw new ApiError(403, "Admin access is required");
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
        providers,
        hasProfile: Boolean(appUser?.profile),
        occupation: appUser?.profile?.occupation ?? null,
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

  return users.map((user) => mapUser(user, profileByUserId.get(user.id) ?? null));
}

export async function getUserById(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, email, name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw new ApiError(500, userError.message);
  }

  if (!userRow) {
    throw new ApiError(404, "User not found");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
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
    challengeLevel?: ChallengeDifficulty;
  }
) {
  const supabase = getSupabaseAdminClient();

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
  if (input.challengeLevel !== undefined) {
    profilePayload.challenge_level = input.challengeLevel;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" });

  if (profileError) {
    throw new ApiError(500, profileError.message);
  }

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
    .select("id")
    .eq("challenger_id", challengerId)
    .eq("target_id", targetId)
    .in("status", ["PENDING_CHALLENGER", "PENDING_RECIPIENT", "MATCHED"])
    .limit(1)
    .maybeSingle();

  if (existingRequestError) {
    throw new ApiError(500, existingRequestError.message);
  }
  if (existingRequest?.id) {
    throw new ApiError(400, "You already requested this user");
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

    // Create the DM thread immediately after successful first solve.
    await ensureMatchRoomForRequest(
      updatedRequest.id,
      updatedRequest.challenger_id,
      updatedRequest.target_id
    );

    const challengeRow = await getChallengeById(updatedRequest.challenge_id);
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

  const challengerRows = await getUserRowsByIds(rows.map((request) => request.challenger_id));
  const challengerById = new Map(challengerRows.map((challenger) => [challenger.id, challenger]));

  return rows.map((request) => {
    const challenge = challengeById.get(request.challenge_id);
    if (!challenge) {
      throw new ApiError(500, "Challenge missing for request");
    }

    const challenger = challengerById.get(request.challenger_id);

    return {
      ...mapInterestRequest(request, challenge),
      challenger: challenger
        ? {
            id: challenger.id,
            name: challenger.name
          }
        : null
    };
  });
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

  const userRows = await getUserRowsByIds(
    [...new Set(matches.flatMap((match) => [match.user_a_id, match.user_b_id]))]
  );
  const userById = new Map(userRows.map((user) => [user.id, user]));

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
    const userA = userById.get(match.user_a_id);
    const userB = userById.get(match.user_b_id);

    return {
      id: match.id,
      userA: {
        id: match.user_a_id,
        name: userA?.name ?? "Unknown"
      },
      userB: {
        id: match.user_b_id,
        name: userB?.name ?? "Unknown"
      },
      room: roomByMatchId.has(match.id)
        ? {
            id: roomByMatchId.get(match.id)!.id
          }
        : null
    };
  });
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
  const senderRows = await getUserRowsByIds([...new Set(messages.map((message) => message.sender_id))]);
  const senderById = new Map(senderRows.map((sender) => [sender.id, sender]));

  return messages.map((message) => mapChatMessage(message, senderById.get(message.sender_id) ?? null));
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

  const senderRows = await getUserRowsByIds([senderId]);
  return mapChatMessage(messageRow, senderRows[0] ?? null);
}

export async function seedDemoChatsForUser(userId: string) {
  const supabase = getSupabaseAdminClient();

  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const roster = [
    { email: "katrina@gitlove.com", name: "Katrina", occupation: "Frontend Engineer", language: "TypeScript", framework: "Next.js" },
    { email: "amara@gitlove.com", name: "Amara", occupation: "Platform Engineer", language: "Go", framework: "Gin" },
    { email: "yuna@gitlove.com", name: "Yuna", occupation: "Mobile Engineer", language: "Swift", framework: "SwiftUI" },
    { email: "julia@gitlove.com", name: "Julia", occupation: "Backend Developer", language: "Kotlin", framework: "Spring Boot" },
    { email: "alana@gitlove.com", name: "Alana", occupation: "Data Engineer", language: "Python", framework: "FastAPI" },
    { email: "seraphina@gitlove.com", name: "Seraphina", occupation: "Security Engineer", language: "Rust", framework: "Axum" },
    { email: "isabella@gitlove.com", name: "Isabella", occupation: "Full-Stack Engineer", language: "TypeScript", framework: "React" },
    { email: "mei@gitlove.com", name: "Mei", occupation: "AI Engineer", language: "Python", framework: "PyTorch" },
    { email: "sloane@gitlove.com", name: "Sloane", occupation: "Cloud Engineer", language: "Go", framework: "Terraform" },
    { email: "nadia@gitlove.com", name: "Nadia", occupation: "Frontend Architect", language: "TypeScript", framework: "Vue" },
    { email: "maria@gitlove.com", name: "Maria", occupation: "Site Reliability Engineer", language: "Go", framework: "Kubernetes" }
  ];

  const candidateEmails = roster.map((person) => person.email);
  const { data: existingWomenRows, error: womenError } = await supabase
    .from("users")
    .select("id, email, name")
    .in("email", candidateEmails);
  if (womenError) {
    throw new ApiError(500, womenError.message);
  }

  const existingByEmail = new Map((existingWomenRows ?? []).map((row) => [row.email, row]));
  const missingWomen = roster.filter((person) => !existingByEmail.has(person.email));

  for (const person of missingWomen) {
    const createdUserId = randomUUID();
    const { error: insertUserError } = await supabase.from("users").insert({
      id: createdUserId,
      email: person.email,
      name: person.name
    });
    if (insertUserError) {
      throw new ApiError(500, insertUserError.message);
    }

    const { error: insertProfileError } = await supabase.from("profiles").upsert(
      {
        user_id: createdUserId,
        occupation: person.occupation,
        age: 26,
        hobbies: ["Coding", "Coffee", "Travel"],
        editor_choice: "VS Code",
        language_choice: person.language,
        github_username: person.name.toLowerCase(),
        vibe_badge: "Real Developer",
        favorite_framework: person.framework,
        favorite_os: "macOS",
        favorite_data_structure: "Hash Map",
        favorite_algorithm: "Two Pointers",
        challenge_level: "EASY"
      },
      { onConflict: "user_id" }
    );
    if (insertProfileError) {
      throw new ApiError(500, insertProfileError.message);
    }
  }

  const { data: womenRows, error: refreshedWomenError } = await supabase
    .from("users")
    .select("id, email, name")
    .in("email", candidateEmails);
  if (refreshedWomenError) {
    throw new ApiError(500, refreshedWomenError.message);
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
    if (existingCount >= 20) {
      continue;
    }

    const template = [
      `Hey ${woman.name}, quick check: I’m cleaning up our API boundaries before demo.`,
      "Nice. I’d split transport DTOs from domain models to keep validation predictable.",
      "Exactly. Also adding idempotency around match + room creation so duplicate actions are safe.",
      "Good call. I usually protect with unique constraints and treat retries as normal flow.",
      "I pushed chat seeding too so we can show realistic active DMs during presentation.",
      "Perfect. Add a couple of code snippets and mention CI stability to make it feel authentic.",
      "Agreed. I’m also tightening challenge acceptance so correct LC submissions don’t get false negatives.",
      "That was the right fix. Nothing breaks trust faster than correct code being rejected."
    ];

    const needed = 20 - existingCount;
    const messages = [];
    for (let i = 0; i < needed; i += 1) {
      const fromUser = i % 2 === 0;
      const content = i % 5 === 3
        ? "const safeUpsert = async () => db.from('matches').upsert(payload, { onConflict: 'request_id' });"
        : template[i % template.length];
      messages.push({
        room_id: roomId,
        sender_id: fromUser ? userId : woman.id,
        content,
        format: i % 5 === 3 ? "CODE" : "MARKDOWN",
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
