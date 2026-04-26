"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getClientConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, publicKey };
}

export function isSupabaseConfigured() {
  const { url, publicKey } = getClientConfig();
  return Boolean(url && publicKey);
}

export function getSupabaseConfigIssues() {
  const issues: string[] = [];
  const { url, publicKey } = getClientConfig();

  if (!url) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!publicKey) {
    issues.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return issues;
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    const { url, publicKey } = getClientConfig();
    browserClient = createClient(url!, publicKey!);
  }

  return browserClient;
}
