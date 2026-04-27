"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { api } from "@/lib/api";
import { User } from "@/lib/types";

export default function UserPublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;

  const userQuery = useQuery({
    queryKey: ["user-public", userId],
    queryFn: () => api.get<User>(`/users/${userId}`),
    enabled: Boolean(userId)
  });

  const user = userQuery.data ?? null;

  return (
    <RequireAuth>
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        {!user ? (
          <div className="rounded-2xl border border-line bg-panel p-6 text-sm text-muted">
            {userQuery.isError ? "Failed to load profile." : "Loading profile..."}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <section className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-line bg-panel shadow-2xl">
              <img
                src={user.profile?.profileImage || "/images/admin.png"}
                alt={user.name}
                className="h-[70vh] min-h-[560px] w-full object-cover"
              />
            </section>

            <section className="rounded-3xl border border-line bg-gradient-to-b from-panel to-panelAlt p-6">
              <h1 className="text-2xl font-bold text-text">
                {user.name}
                <span className="ml-2 text-base font-medium text-muted">
                  {user.profile?.age ? `${user.profile.age}` : ""}
                </span>
              </h1>
              <p className="mt-1 text-sm text-muted">{user.profile?.occupation || "Occupation not set"}</p>

              <div className="mt-5 grid grid-cols-1 gap-2 rounded-2xl border border-line bg-panelAlt p-4 text-sm">
                <Row label="Gender" value={user.profile?.gender || "Not set"} />
                <Row label="Location" value={user.profile?.locationText || "Not set"} />
                <Row label="Language" value={user.profile?.languageChoice || "Not set"} />
                <Row label="Framework" value={user.profile?.favoriteFramework || "Not set"} />
                <Row label="OS" value={user.profile?.favoriteOS || "Not set"} />
                <Row label="Editor" value={user.profile?.editorChoice || "Not set"} />
                <Row label="Data Structure" value={user.profile?.favoriteDataStructure || "Not set"} />
                <Row label="Algorithm" value={user.profile?.favoriteAlgorithm || "Not set"} />
                <Row label="Vibe" value={user.profile?.vibeBadge || "Not set"} />
                <Row label="GitHub" value={user.profile?.githubUsername || "Not set"} />
                <Row label="Challenge Level" value={user.profile?.challengeLevel || "EASY"} />
                <Row label="Hobbies" value={user.profile?.hobbies.join(", ") || "Not set"} />
              </div>
            </section>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-text">{value}</span>
    </div>
  );
}
