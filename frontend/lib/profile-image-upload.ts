"use client";

import { User } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export async function uploadProfileImageFile(file: File) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase is not configured on the frontend");
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("You must be logged in to upload an image");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/uploads/profile-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`
    },
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Upload failed (${response.status})`);
  }

  return (await response.json()) as { appUser: User };
}
