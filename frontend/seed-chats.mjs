import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const womenEmails = [
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
];

function convo(name) {
  return [
    {
      sender: "admin",
      format: "MARKDOWN",
      content:
        `Hey ${name}, I looked at your profile and noticed your stack is clean. I just finished a refactor from REST handlers to typed route modules and the error boundaries became way easier to reason about. How do you usually structure domain logic in your projects?`
    },
    {
      sender: "target",
      format: "MARKDOWN",
      content:
        "I keep the domain layer isolated and force every API path to call use-cases instead of writing business logic inline. It makes test coverage less painful and helps when product changes happen late."
    },
    {
      sender: "admin",
      format: "CODE",
      content:
        "type CreateMatchInput = { challengerId: string; targetId: string };\n\nexport async function createMatch(input: CreateMatchInput) {\n  const request = await openInterest(input.challengerId, input.targetId);\n  return finalizeHandshake(request.id);\n}"
    },
    {
      sender: "target",
      format: "MARKDOWN",
      content:
        "Nice. I’d probably wrap that with an idempotency key if users can spam clicks. Also I like pushing telemetry at each state transition so analytics stays accurate."
    },
    {
      sender: "admin",
      format: "MARKDOWN",
      content:
        "Agreed. I’m tracking `PENDING_CHALLENGER -> PENDING_RECIPIENT -> MATCHED` now. Next step is adding retry-safe writes for chat notifications."
    },
    {
      sender: "target",
      format: "CODE",
      content:
        "const transition = (state: RequestState, event: Event) => {\n  if (state === 'PENDING_CHALLENGER' && event === 'PASS') return 'PENDING_RECIPIENT';\n  if (state === 'PENDING_RECIPIENT' && event === 'PASS') return 'MATCHED';\n  if (event === 'FAIL') return 'FAILED';\n  return state;\n};"
    },
    {
      sender: "admin",
      format: "MARKDOWN",
      content:
        "This is exactly the style I like. Do you usually unit test these transitions table-driven or with snapshots?"
    },
    {
      sender: "target",
      format: "MARKDOWN",
      content:
        "Table-driven. Snapshots hide intent for state machines. I keep explicit cases so failures are obvious in CI logs."
    },
    {
      sender: "admin",
      format: "MARKDOWN",
      content:
        "Makes sense. I’m also improving challenge evaluation because teammates said correct LC solutions got rejected. I’m replacing fragile checks with a more realistic submission validator in this prototype."
    },
    {
      sender: "target",
      format: "MARKDOWN",
      content:
        "Good move. Nothing kills trust faster than false negatives in coding gates. Even a lightweight deterministic validator is better than magic comments."
    },
    {
      sender: "admin",
      format: "CODE",
      content:
        "const qualitySignals = {\n  changedFromStarter: true,\n  syntaxValid: true,\n  notPlaceholder: true\n};\n\nconst pass = Object.values(qualitySignals).every(Boolean);"
    },
    {
      sender: "target",
      format: "MARKDOWN",
      content:
        "Love it. After that, we can add language-specific runners gradually. Start reliable, then make it strict."
    }
  ];
}

async function getOrCreateChallengeId() {
  const { data: existing, error: existingError } = await supabase
    .from("challenges")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("challenges")
    .insert({
      slug: "seed-two-sum",
      title: "Two Sum",
      difficulty: "EASY",
      description: "<p>Seed challenge for chat setup</p>",
      starter_code: { typescript: "function twoSum(nums:number[], target:number){ return []; }" },
      test_cases: []
    })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id;
}

async function ensureAppUser(authUser) {
  const email = (authUser.email || "").toLowerCase();
  const name =
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    email.split("@")[0] ||
    "Developer";

  const { data, error } = await supabase
    .from("users")
    .upsert(
      { id: authUser.id, email, name, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function ensureMatchedRoom(challengerId, targetId, challengeId) {
  const { data: existingRequest, error: requestQueryError } = await supabase
    .from("interest_requests")
    .select("id")
    .eq("challenger_id", challengerId)
    .eq("target_id", targetId)
    .eq("status", "MATCHED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (requestQueryError) throw requestQueryError;

  let requestId = existingRequest?.id;
  if (!requestId) {
    const { data: newRequest, error: requestInsertError } = await supabase
      .from("interest_requests")
      .insert({
        challenger_id: challengerId,
        target_id: targetId,
        challenge_id: challengeId,
        status: "MATCHED",
        requested_at: new Date().toISOString(),
        matched_at: new Date().toISOString()
      })
      .select("id")
      .single();
    if (requestInsertError) throw requestInsertError;
    requestId = newRequest.id;
  }

  const { data: existingMatch, error: matchQueryError } = await supabase
    .from("matches")
    .select("id")
    .eq("request_id", requestId)
    .maybeSingle();
  if (matchQueryError) throw matchQueryError;

  let matchId = existingMatch?.id;
  if (!matchId) {
    const { data: newMatch, error: matchInsertError } = await supabase
      .from("matches")
      .insert({
        request_id: requestId,
        user_a_id: challengerId,
        user_b_id: targetId
      })
      .select("id")
      .single();
    if (matchInsertError) throw matchInsertError;
    matchId = newMatch.id;
  }

  const { data: existingRoom, error: roomQueryError } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("match_id", matchId)
    .maybeSingle();
  if (roomQueryError) throw roomQueryError;

  if (existingRoom?.id) return existingRoom.id;

  const { data: newRoom, error: roomInsertError } = await supabase
    .from("chat_rooms")
    .insert({ match_id: matchId })
    .select("id")
    .single();
  if (roomInsertError) throw roomInsertError;
  return newRoom.id;
}

async function seedConversation(roomId, adminId, targetId, targetName) {
  const { count, error: countError } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);
  if (countError) throw countError;

  if ((count || 0) >= 12) {
    return false;
  }

  const messages = convo(targetName).map((entry, index) => ({
    room_id: roomId,
    sender_id: entry.sender === "admin" ? adminId : targetId,
    content: entry.content,
    format: entry.format,
    created_at: new Date(Date.now() - (12 - index) * 60_000).toISOString()
  }));

  const { error: insertError } = await supabase.from("chat_messages").insert(messages);
  if (insertError) throw insertError;
  return true;
}

async function main() {
  const { data: authUsersPage, error: authUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  if (authUsersError) throw authUsersError;

  const authUsers = authUsersPage.users || [];
  const adminAuth = authUsers.find((u) => (u.email || "").toLowerCase() === "admin@gitlove.com");
  if (!adminAuth) {
    throw new Error("admin@gitlove.com not found in Supabase Auth. Create admin first.");
  }

  const adminApp = await ensureAppUser(adminAuth);
  const challengeId = await getOrCreateChallengeId();

  let seeded = 0;
  for (const email of womenEmails) {
    const targetAuth = authUsers.find((u) => (u.email || "").toLowerCase() === email);
    if (!targetAuth) {
      console.log(`Skip ${email}: auth user not found`);
      continue;
    }
    const targetApp = await ensureAppUser(targetAuth);
    const roomId = await ensureMatchedRoom(adminApp.id, targetApp.id, challengeId);
    const didSeed = await seedConversation(roomId, adminApp.id, targetApp.id, targetApp.name);
    if (didSeed) seeded += 1;
    console.log(`Conversation ready for ${targetApp.name} (${email})`);
  }

  console.log(`Done. Seeded/updated ${seeded} chat threads.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
