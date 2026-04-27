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

const TARGET_MESSAGES_PER_ROOM = 90;

const women = [
  { email: "katrina@gitlove.com", name: "Katrina", stack: "Next.js + TypeScript", focus: "frontend perf" },
  { email: "amara@gitlove.com", name: "Amara", stack: "Go + Redis", focus: "platform reliability" },
  { email: "yuna@gitlove.com", name: "Yuna", stack: "Swift + Firebase", focus: "mobile architecture" },
  { email: "julia@gitlove.com", name: "Julia", stack: "Kotlin + Spring", focus: "backend APIs" },
  { email: "alana@gitlove.com", name: "Alana", stack: "Python + Airflow", focus: "data pipelines" },
  { email: "seraphina@gitlove.com", name: "Seraphina", stack: "Rust + Axum", focus: "security and correctness" },
  { email: "isabelle@gitlove.com", name: "Isabelle", stack: "React + Node", focus: "full-stack product delivery" },
  { email: "mei@gitlove.com", name: "Mei", stack: "PyTorch + FastAPI", focus: "ml serving" },
  { email: "sloane@gitlove.com", name: "Sloane", stack: "Terraform + Kubernetes", focus: "infra automation" },
  { email: "nadia@gitlove.com", name: "Nadia", stack: "Vue + TypeScript", focus: "design systems" },
  { email: "maria@gitlove.com", name: "Maria", stack: "Go + Postgres", focus: "sre and observability" }
];

function hash(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function rng(seedInput) {
  let seed = hash(seedInput) || 1;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

function codeSnippet(rand) {
  const snippets = [
    "const byId = new Map(rows.map(r => [r.id, r]));\nreturn ids.map(id => byId.get(id)).filter(Boolean);",
    "await db.tx(async (trx) => {\n  await trx.insert(request);\n  await trx.insert(audit);\n});",
    "const cacheKey = `match:${userId}`;\nconst cached = await redis.get(cacheKey);\nif (cached) return JSON.parse(cached);",
    "type Event = { type: 'PASS' | 'FAIL'; at: string };\nconst next = reduceState(current, event);",
    "SELECT room_id, count(*)\nFROM chat_messages\nWHERE created_at > now() - interval '24 hours'\nGROUP BY room_id;",
    "if (ctx.signal.aborted) throw new Error('cancelled');\nawait Promise.race([runJob(), timeout(3000)]);"
  ];
  return pick(rand, snippets);
}

function buildThread(person) {
  const rand = rng(person.email);
  const thread = [];

  const adminOpeners = [
    `Hey ${person.name}, I was reviewing the ${person.focus} workstream. How do you usually break down tasks in ${person.stack}?`,
    `Your profile says ${person.stack}. I'm tuning GitLove and trying to tighten ${person.focus}. Want to compare approaches?`,
    `I’m preparing this release and your stack (${person.stack}) is exactly what we’re debating right now.`
  ];
  const targetOpeners = [
    "I usually start by reducing the blast radius first, then optimize once observability is clean.",
    "I split by boundary: transport layer, domain rules, and persistence adapters. Keeps regressions obvious.",
    "For me the key is instrumentation first, then architecture changes."
  ];

  thread.push({ sender: "admin", format: "MARKDOWN", content: pick(rand, adminOpeners) });
  thread.push({ sender: "target", format: "MARKDOWN", content: pick(rand, targetOpeners) });

  const adminLines = [
    "Makes sense. I’ve seen flaky behavior around retries and state transitions in the challenge flow.",
    "I’m trying to ensure DM creation is idempotent so duplicate swipes don't produce duplicate rooms.",
    "We also need demo-safe logs. I want clear traces for each request lifecycle event.",
    "I think we should isolate validators from transport so LC grading can evolve safely.",
    "I’m caching read-heavy endpoints but avoiding stale match states.",
    "How strict are you on schema migrations during fast iteration cycles?"
  ];

  const targetLines = [
    "For retries, I gate everything with a unique key and optimistic checks in DB.",
    "I agree on validators. Keep parse/syntax checks separate from correctness checks.",
    "For migrations, additive first. Backfill async. Remove old columns later.",
    "Also worth enforcing explicit status enums to avoid hidden invalid states.",
    "For demo stability, I add targeted synthetic data and verify query plans.",
    "I’d definitely add room creation in the same logical flow as match transitions."
  ];

  for (let i = 0; i < 28; i += 1) {
    thread.push({
      sender: i % 2 === 0 ? "admin" : "target",
      format: "MARKDOWN",
      content: i % 2 === 0 ? pick(rand, adminLines) : pick(rand, targetLines)
    });

    if (i % 4 === 1) {
      thread.push({
        sender: i % 2 === 0 ? "admin" : "target",
        format: "CODE",
        content: codeSnippet(rand)
      });
    }
  }

  thread.push({
    sender: "admin",
    format: "MARKDOWN",
    content: `Perfect. I’ll include your ${person.focus} notes in the release checklist for this demo build.`
  });
  thread.push({
    sender: "target",
    format: "MARKDOWN",
    content: "Good plan. Ping me if you want one more pass on edge cases before presentation."
  });

  return thread;
}

async function getOrCreateChallengeId() {
  const { data: existing, error } = await supabase
    .from("challenges")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (existing?.id) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("challenges")
    .insert({
      slug: "seed-two-sum",
      title: "Two Sum",
      difficulty: "EASY",
      description: "<p>Seed challenge for seeded chats.</p>",
      starter_code: { typescript: "function twoSum(nums:number[], target:number){ return []; }" },
      test_cases: []
    })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return created.id;
}

async function ensureAppUser(authUser) {
  const email = (authUser.email || "").toLowerCase();
  const name =
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    email.split("@")[0] ||
    "Developer";

  const now = new Date().toISOString();

  // First, reuse existing app user row by email (handles legacy rows whose id differs from auth id).
  const { data: existingByEmail, error: existingByEmailError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (existingByEmailError) throw existingByEmailError;

  if (existingByEmail) {
    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({ name, updated_at: now })
      .eq("id", existingByEmail.id)
      .select("*")
      .single();
    if (updateError) throw updateError;
    return updated;
  }

  // If there is no email row yet, create/update by auth id.
  const { data, error } = await supabase
    .from("users")
    .upsert({ id: authUser.id, email, name, updated_at: now }, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function ensureMatchedRoom(challengerId, targetId, challengeId) {
  const { data: existingRequest, error: requestError } = await supabase
    .from("interest_requests")
    .select("id")
    .eq("challenger_id", challengerId)
    .eq("target_id", targetId)
    .in("status", ["PENDING_RECIPIENT", "MATCHED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (requestError) throw requestError;

  let requestId = existingRequest?.id;
  if (!requestId) {
    const { data: createdRequest, error: insertRequestError } = await supabase
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
    if (insertRequestError) throw insertRequestError;
    requestId = createdRequest.id;
  }

  const { data: existingMatch, error: matchError } = await supabase
    .from("matches")
    .select("id")
    .eq("request_id", requestId)
    .maybeSingle();
  if (matchError) throw matchError;

  let matchId = existingMatch?.id;
  if (!matchId) {
    const { data: createdMatch, error: insertMatchError } = await supabase
      .from("matches")
      .insert({ request_id: requestId, user_a_id: challengerId, user_b_id: targetId })
      .select("id")
      .single();
    if (insertMatchError) throw insertMatchError;
    matchId = createdMatch.id;
  }

  const { data: existingRoom, error: roomError } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("match_id", matchId)
    .maybeSingle();
  if (roomError) throw roomError;

  if (existingRoom?.id) return existingRoom.id;

  const { data: createdRoom, error: insertRoomError } = await supabase
    .from("chat_rooms")
    .insert({ match_id: matchId })
    .select("id")
    .single();
  if (insertRoomError) throw insertRoomError;
  return createdRoom.id;
}

async function seedConversation(roomId, adminId, targetId, person) {
  const { count, error: countError } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);
  if (countError) throw countError;

  const existingCount = count || 0;
  if (existingCount >= TARGET_MESSAGES_PER_ROOM) return 0;

  const thread = buildThread(person);
  const needed = TARGET_MESSAGES_PER_ROOM - existingCount;
  const toInsert = thread.slice(0, needed);
  const startMs = Date.now() - 1000 * 60 * (existingCount + needed) * 20;

  const rows = [];
  for (let i = 0; i < toInsert.length; i += 1) {
    const msg = toInsert[i];
    rows.push({
      room_id: roomId,
      sender_id: msg.sender === "admin" ? adminId : targetId,
      content: msg.content,
      format: msg.format,
      created_at: new Date(startMs + i * 1000 * 60 * (8 + (i % 9))).toISOString()
    });
  }

  const { error: insertError } = await supabase.from("chat_messages").insert(rows);
  if (insertError) throw insertError;
  return rows.length;
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
    throw new Error("admin@gitlove.com not found in Supabase Auth.");
  }

  const adminApp = await ensureAppUser(adminAuth);
  const challengeId = await getOrCreateChallengeId();

  let totalInserted = 0;
  for (const person of women) {
    const targetAuth = authUsers.find((u) => (u.email || "").toLowerCase() === person.email);
    if (!targetAuth) {
      console.log(`Skip ${person.email}: auth user not found`);
      continue;
    }

    const targetApp = await ensureAppUser(targetAuth);
    const roomId = await ensureMatchedRoom(adminApp.id, targetApp.id, challengeId);
    const inserted = await seedConversation(roomId, adminApp.id, targetApp.id, person);
    totalInserted += inserted;
    console.log(`${person.name}: +${inserted} messages`);
  }

  console.log(`Done. Inserted ${totalInserted} messages total.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
