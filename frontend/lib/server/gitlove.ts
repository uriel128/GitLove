import { User as SupabaseAuthUser } from "@supabase/supabase-js";
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
    favoriteFramework: row.favorite_framework,
    favoriteOS: row.favorite_os,
    favoriteDataStructure: row.favorite_data_structure,
    favoriteAlgorithm: row.favorite_algorithm,
    challengeLevel: (row.challenge_level ?? "EASY") as ChallengeDifficulty
  };
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
  const supabase = getSupabaseAdminClient();
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

  const { data: userRow, error: upsertError } = await supabase
    .from("users")
    .upsert(
      {
        id: authUser.id,
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
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (profileError) {
    throw new ApiError(500, profileError.message);
  }

  return mapUser(userRow, profileRow ?? null);
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

export async function getRandomChallenge(difficulty: string) {
  const normalized = difficulty.toUpperCase();
  if (normalized !== "EASY" && normalized !== "MEDIUM" && normalized !== "HARD") {
    throw new ApiError(400, "difficulty must be EASY, MEDIUM, or HARD");
  }

  const supabase = getSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("difficulty", normalized);

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!rows || rows.length === 0) {
    throw new ApiError(404, "No challenge available for this difficulty");
  }

  const challenge = rows[Math.floor(Math.random() * rows.length)];
  return mapChallenge(challenge);
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

  const difficulty = challenger.profile?.challengeLevel ?? "EASY";
  const challenge = await getRandomChallenge(difficulty);

  const supabase = getSupabaseAdminClient();
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
        user_a_id: requestRow.challenger_id,
        user_b_id: requestRow.target_id
      })
      .select("id")
      .single();

    if (createMatchError) {
      throw new ApiError(500, createMatchError.message);
    }

    matchId = createdMatch.id;
  }

  const { error: roomError } = await supabase
    .from("chat_rooms")
    .upsert({ match_id: matchId }, { onConflict: "match_id" });

  if (roomError) {
    throw new ApiError(500, roomError.message);
  }

  const challengeRow = await getChallengeById(matchedRequest.challenge_id);
  return mapInterestRequest(matchedRequest, challengeRow);
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
