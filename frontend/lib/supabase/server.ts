import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredPublicKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return key;
}

export function getSupabaseAdminClient() {
  if (!adminClient) {
    adminClient = createClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false
        }
      }
    );
  }

  return adminClient;
}

export function getSupabaseAnonServerClient() {
  if (!anonClient) {
    anonClient = createClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredPublicKey(),
      {
        auth: {
          persistSession: false
        }
      }
    );
  }

  return anonClient;
}
