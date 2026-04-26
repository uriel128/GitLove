import { NextRequest, NextResponse } from "next/server";
import {
  adminSetTemporaryPassword,
  ApiError,
  cancelInterestRequest,
  createChatMessage,
  getAuthUserFromAuthorizationHeader,
  listAdminUsers,
  getBuildLog,
  getChatMessages,
  getHealth,
  getMatchesForUser,
  getPendingForUser,
  getOutgoingRequestedTargetIds,
  getRandomChallenge,
  getStackTrace,
  getUserById,
  listUsers,
  openInterestRequest,
  requireAdminUser,
  submitInterestAttempt,
  syncAuthUser,
  provisionAuthUser,
  uploadProfileImage,
  devSignupAuthUser,
  seedDemoChatsForUser,
  updateUserProfile
} from "@/lib/server/gitlove";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    route?: string[];
  };
};

function jsonError(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.status, error.message);
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  return jsonError(500, message);
}

async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${field} is required`);
  }

  return value.trim();
}

function optionalNullableString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, "Invalid string field");
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseChallengeLevel(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (value !== "EASY" && value !== "MEDIUM" && value !== "HARD") {
    throw new ApiError(400, "challengeLevel must be EASY, MEDIUM, or HARD");
  }

  return value;
}

function parseAge(value: unknown) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 18 || value > 99) {
    throw new ApiError(400, "age must be an integer between 18 and 99");
  }

  return value;
}

function parseHobbies(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new ApiError(400, "hobbies must be an array of strings");
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const route = context.params.route ?? [];

    if (route.length === 1 && route[0] === "health") {
      return NextResponse.json(await getHealth());
    }

    if (route.length === 1 && route[0] === "users") {
      return NextResponse.json(await listUsers());
    }

    if (route.length === 2 && route[0] === "admin" && route[1] === "users") {
      await requireAdminUser(request.headers.get("authorization"));
      return NextResponse.json(await listAdminUsers());
    }

    if (route.length === 2 && route[0] === "users") {
      return NextResponse.json(await getUserById(route[1]));
    }

    if (route.length === 2 && route[0] === "matches") {
      return NextResponse.json(await getMatchesForUser(route[1]));
    }

    if (route.length === 3 && route[0] === "interest" && route[1] === "pending") {
      return NextResponse.json(await getPendingForUser(route[2]));
    }

    if (route.length === 3 && route[0] === "interest" && route[1] === "outgoing") {
      return NextResponse.json(await getOutgoingRequestedTargetIds(route[2]));
    }

    if (route.length === 3 && route[0] === "chat" && route[2] === "messages") {
      const userId = request.nextUrl.searchParams.get("userId");
      if (!userId) {
        throw new ApiError(400, "userId query param is required");
      }

      const limit = Number(request.nextUrl.searchParams.get("limit") ?? "50");
      return NextResponse.json(await getChatMessages(route[1], userId, limit));
    }

    if (route.length === 2 && route[0] === "build-log") {
      return NextResponse.json(await getBuildLog(route[1]));
    }

    if (route.length === 1 && route[0] === "stack-trace") {
      return NextResponse.json(await getStackTrace());
    }

    if (route.length === 2 && route[0] === "challenges" && route[1] === "random") {
      const difficulty = request.nextUrl.searchParams.get("difficulty");
      if (!difficulty) {
        throw new ApiError(400, "difficulty is required");
      }

      return NextResponse.json(await getRandomChallenge(difficulty));
    }

    return jsonError(404, "Endpoint not found");
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const route = context.params.route ?? [];

    if (route.length === 2 && route[0] === "auth" && route[1] === "sync") {
      const authUser = await getAuthUserFromAuthorizationHeader(request.headers.get("authorization"));
      const appUser = await syncAuthUser(authUser);
      return NextResponse.json({ appUser });
    }

    if (route.length === 2 && route[0] === "auth" && route[1] === "provision") {
      const body = await parseJson(request);
      const appUser = await provisionAuthUser({
        id: requiredString(body?.id, "id"),
        email: requiredString(body?.email, "email"),
        name: typeof body?.name === "string" ? body.name : null
      });
      return NextResponse.json({ appUser });
    }

    if (route.length === 2 && route[0] === "auth" && route[1] === "dev-signup") {
      const body = await parseJson(request);
      const appUser = await devSignupAuthUser({
        email: requiredString(body?.email, "email"),
        password: requiredString(body?.password, "password"),
        name: typeof body?.name === "string" ? body.name : null
      });
      return NextResponse.json({ appUser });
    }

    if (route.length === 2 && route[0] === "uploads" && route[1] === "profile-image") {
      const authUser = await getAuthUserFromAuthorizationHeader(request.headers.get("authorization"));
      const formData = await request.formData();
      const fileValue = formData.get("file");
      if (!fileValue || !(fileValue instanceof File)) {
        throw new ApiError(400, "file is required");
      }

      const bytes = new Uint8Array(await fileValue.arrayBuffer());
      const appUser = await uploadProfileImage({
        userId: authUser.id,
        fileName: fileValue.name || "profile-image",
        contentType: fileValue.type || "application/octet-stream",
        bytes
      });
      return NextResponse.json({ appUser });
    }

    if (route.length === 2 && route[0] === "auth" && route[1] === "me") {
      const authUser = await getAuthUserFromAuthorizationHeader(request.headers.get("authorization"));
      const appUser = await syncAuthUser(authUser);
      return NextResponse.json({ authUser, appUser });
    }

    if (route.length === 2 && route[0] === "interest" && route[1] === "open") {
      const body = await parseJson(request);
      const challengerId = requiredString(body?.challengerId, "challengerId");
      const targetId = requiredString(body?.targetId, "targetId");
      return NextResponse.json(await openInterestRequest(challengerId, targetId));
    }

    if (route.length === 3 && route[0] === "interest" && route[2] === "attempt") {
      const body = await parseJson(request);
      const userId = requiredString(body?.userId, "userId");
      if (typeof body?.passed !== "boolean") {
        throw new ApiError(400, "passed must be a boolean");
      }

      const submittedCode = body?.submittedCode;
      if (submittedCode !== undefined && typeof submittedCode !== "string") {
        throw new ApiError(400, "submittedCode must be a string");
      }

      return NextResponse.json(
        await submitInterestAttempt(route[1], userId, body.passed, submittedCode)
      );
    }

    if (route.length === 3 && route[0] === "interest" && route[2] === "cancel") {
      const body = await parseJson(request);
      const challengerId = requiredString(body?.challengerId, "challengerId");
      return NextResponse.json(await cancelInterestRequest(route[1], challengerId));
    }

    if (route.length === 3 && route[0] === "chat" && route[1] === "seed-demo" && route[2] === "messages") {
      const body = await parseJson(request);
      const userId = requiredString(body?.userId, "userId");
      return NextResponse.json(await seedDemoChatsForUser(userId));
    }

    if (route.length === 3 && route[0] === "chat" && route[2] === "messages") {
      const body = await parseJson(request);
      const senderId = requiredString(body?.senderId, "senderId");
      const content = requiredString(body?.content, "content");
      const format = body?.format;

      if (format !== "TEXT" && format !== "MARKDOWN" && format !== "CODE") {
        throw new ApiError(400, "format must be TEXT, MARKDOWN, or CODE");
      }

      return NextResponse.json(await createChatMessage(route[1], senderId, content, format));
    }

    if (route.length === 4 && route[0] === "admin" && route[1] === "users" && route[3] === "password") {
      await requireAdminUser(request.headers.get("authorization"));
      const body = await parseJson(request);
      const password = requiredString(body?.password, "password");
      return NextResponse.json(await adminSetTemporaryPassword(route[2], password));
    }

    return jsonError(404, "Endpoint not found");
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const route = context.params.route ?? [];

    if (route.length === 3 && route[0] === "users" && route[2] === "profile") {
      const body = await parseJson(request);

      const updated = await updateUserProfile(route[1], {
        name: body?.name !== undefined ? requiredString(body.name, "name") : undefined,
        occupation: optionalNullableString(body?.occupation),
        age: parseAge(body?.age),
        hobbies: parseHobbies(body?.hobbies),
        editorChoice: optionalNullableString(body?.editorChoice),
        languageChoice: optionalNullableString(body?.languageChoice),
        githubUsername: optionalNullableString(body?.githubUsername),
        vibeBadge: optionalNullableString(body?.vibeBadge),
        favoriteFramework: optionalNullableString(body?.favoriteFramework),
        favoriteOS: optionalNullableString(body?.favoriteOS),
        favoriteDataStructure: optionalNullableString(body?.favoriteDataStructure),
        favoriteAlgorithm: optionalNullableString(body?.favoriteAlgorithm),
        challengeLevel: parseChallengeLevel(body?.challengeLevel)
      });

      return NextResponse.json(updated);
    }

    return jsonError(404, "Endpoint not found");
  } catch (error) {
    return handleError(error);
  }
}
