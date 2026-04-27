"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, KeyRound, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { hasAdminRoleFromAuthUser } from "@/lib/authz";
import { AdminManagedUser } from "@/lib/types";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { currentUserId, getAccessToken } = useAuth();
  const [query, setQuery] = useState("");
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [statusByUserId, setStatusByUserId] = useState<Record<string, string>>({});

  const authMeQuery = useQuery({
    queryKey: ["admin-auth-me", currentUserId],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return apiRequest<{ authUser: { app_metadata?: { role?: unknown; roles?: unknown } | null } }>(
        "/auth/me",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
    },
    enabled: Boolean(currentUserId)
  });

  const isAdmin = hasAdminRoleFromAuthUser(authMeQuery.data?.authUser ?? null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return apiRequest<AdminManagedUser[]>("/admin/users", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    },
    enabled: isAdmin,
    staleTime: 20_000
  });

  const filteredUsers = useMemo(() => {
    const all = usersQuery.data ?? [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return all
      .filter(
        (user) =>
          user.name.toLowerCase().includes(normalized) || user.email.toLowerCase().includes(normalized)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [query, usersQuery.data]);

  const passwordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const accessToken = await getAccessToken();
      await apiRequest<{ ok: true }>(`/admin/users/${userId}/password`, {
        method: "POST",
        body: { password: password.trim() },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    },
    onSuccess: (_result, variables) => {
      setPasswordDrafts((prev) => ({ ...prev, [variables.userId]: "" }));
      setStatusByUserId((prev) => ({ ...prev, [variables.userId]: "Password updated" }));
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error, variables) => {
      setStatusByUserId((prev) => ({
        ...prev,
        [variables.userId]: error instanceof Error ? error.message : "Password update failed"
      }));
    }
  });

  const nameMutation = useMutation({
    mutationFn: async ({ userId, name }: { userId: string; name: string }) => {
      const accessToken = await getAccessToken();
      await apiRequest<{ ok: true }>(`/admin/users/${userId}/name`, {
        method: "POST",
        body: { name: name.trim() },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    },
    onSuccess: (_result, variables) => {
      setStatusByUserId((prev) => ({ ...prev, [variables.userId]: "Name updated" }));
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error, variables) => {
      setStatusByUserId((prev) => ({
        ...prev,
        [variables.userId]: error instanceof Error ? error.message : "Name update failed"
      }));
    }
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, banned }: { userId: string; banned: boolean }) => {
      const accessToken = await getAccessToken();
      await apiRequest<{ ok: true }>(`/admin/users/${userId}/ban`, {
        method: "POST",
        body: { banned },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return banned;
    },
    onSuccess: (banned, variables) => {
      setStatusByUserId((prev) => ({
        ...prev,
        [variables.userId]: banned ? "User banned" : "User unbanned"
      }));
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error, variables) => {
      setStatusByUserId((prev) => ({
        ...prev,
        [variables.userId]: error instanceof Error ? error.message : "Ban update failed"
      }));
    }
  });

  return (
    <RequireAuth>
      <div className="space-y-4">
        <section className="rounded-2xl border border-line bg-gradient-to-r from-panel to-panelAlt p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <h1 className="text-lg font-semibold text-text">Admin Account Controls</h1>
          </div>
          <p className="mt-1 text-xs text-muted">
            Search users, inspect profile readiness, and manage account controls.
          </p>
        </section>

        {authMeQuery.isLoading ? (
          <section className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
            Checking admin access...
          </section>
        ) : null}

        {!authMeQuery.isLoading && !isAdmin ? (
          <section className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            This account does not have admin role in Supabase.
          </section>
        ) : null}

        {isAdmin ? (
          <section className="rounded-2xl border border-line bg-panel p-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by username or email"
                className="w-full rounded-xl border border-line bg-panelAlt py-2.5 pl-9 pr-3 text-sm text-text outline-none focus:border-accent"
              />
            </label>

            {usersQuery.isLoading ? (
              <div className="mt-4 text-sm text-muted">Loading accounts...</div>
            ) : null}

            {usersQuery.isError ? (
              <div className="mt-4 text-sm text-rose-300">
                Failed to load accounts: {usersQuery.error.message}
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {filteredUsers.map((user) => {
                const isBanned = Boolean(user.bannedUntil);
                const status = statusByUserId[user.id] ?? "No pending admin action";
                const passwordValue = passwordDrafts[user.id] ?? "";
                const nameValue = nameDrafts[user.id] ?? user.name;

                return (
                  <div key={user.id} className="rounded-xl border border-line bg-panelAlt p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {user.profileImage ? (
                            <img src={user.profileImage} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                              {user.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-text">{user.name}</p>
                            <p className="truncate text-xs text-muted">{user.email}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted">
                          Created {formatDate(user.createdAt)} · Last sign-in{" "}
                          {user.lastSignInAt ? formatDate(user.lastSignInAt) : "Never"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {user.hasProfile ? "Profile ready" : "Profile incomplete"} ·{" "}
                          {user.gender ?? "No gender"} · {user.locationText ?? "No location"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Challenge {user.challengeLevel ?? "Unset"} · {isBanned ? "BANNED" : "ACTIVE"}
                        </p>
                        <p className="mt-2 text-xs text-muted">{status}</p>
                      </div>

                      <div className="w-full max-w-md space-y-2">
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input
                            value={nameValue}
                            onChange={(event) =>
                              setNameDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))
                            }
                            placeholder="Change display name"
                            className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text outline-none focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() => nameMutation.mutate({ userId: user.id, name: nameValue })}
                            className="rounded-lg border border-line bg-panel px-3 py-2 text-xs text-text transition hover:bg-panelAlt"
                          >
                            Save Name
                          </button>
                        </div>

                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input
                            type="password"
                            value={passwordValue}
                            onChange={(event) =>
                              setPasswordDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))
                            }
                            placeholder="Temporary password (8+ chars)"
                            className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text outline-none focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() => passwordMutation.mutate({ userId: user.id, password: passwordValue })}
                            className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-3 py-2 text-xs text-text transition hover:bg-panelAlt"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Password
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => banMutation.mutate({ userId: user.id, banned: !isBanned })}
                            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs transition ${
                              isBanned
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                            }`}
                          >
                            <Ban className="h-3.5 w-3.5" />
                            {isBanned ? "Unban" : "Ban"}
                          </button>
                          <Link
                            href={`/users/${user.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-3 py-2 text-xs text-text transition hover:bg-panelAlt"
                          >
                            <UserRoundCheck className="h-3.5 w-3.5" />
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </RequireAuth>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}
