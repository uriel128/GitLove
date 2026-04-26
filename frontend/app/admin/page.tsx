"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AdminManagedUser } from "@/lib/types";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ?? "";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { currentUser, getAccessToken } = useAuth();
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});
  const normalizedEmail = currentUser?.email.trim().toLowerCase() ?? "";
  const isAdmin = Boolean(ADMIN_EMAIL) && normalizedEmail === ADMIN_EMAIL;

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return apiRequest<AdminManagedUser[]>("/admin/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    },
    enabled: isAdmin
  });

  const passwordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const accessToken = await getAccessToken();
      const normalizedPassword = password.trim();

      if (normalizedPassword.length < 8) {
        throw new Error("Temporary password must be at least 8 characters");
      }

      await apiRequest<{ ok: true }>(`/admin/users/${userId}/password`, {
        method: "POST",
        body: {
          password: normalizedPassword
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return normalizedPassword;
    },
    onSuccess: (_result, variables) => {
      setPasswordDrafts((prev) => ({ ...prev, [variables.userId]: "" }));
      setActionStatus((prev) => ({
        ...prev,
        [variables.userId]: "Temporary password updated"
      }));
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error, variables) => {
      setActionStatus((prev) => ({
        ...prev,
        [variables.userId]: `Update failed: ${error instanceof Error ? error.message : "Unknown error"}`
      }));
    }
  });

  const sortedUsers = useMemo(() => {
    if (!usersQuery.data) {
      return [];
    }

    return [...usersQuery.data].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [usersQuery.data]);

  return (
    <RequireAuth>
      <div className="space-y-4">
        <section className="rounded-md border border-line bg-panel p-4">
          <h1 className="text-lg font-semibold">Admin / Accounts</h1>
          <div className="mt-1 text-xs text-muted">
            Signed in as {currentUser?.email ?? "unknown"}
          </div>
        </section>

        {!ADMIN_EMAIL ? (
          <section className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            `NEXT_PUBLIC_ADMIN_EMAIL` is not configured, so admin access is disabled.
          </section>
        ) : null}

        {ADMIN_EMAIL && !isAdmin ? (
          <section className="rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            This account is not the configured admin user.
          </section>
        ) : null}

        {isAdmin ? (
          <section className="rounded-md border border-line bg-panel p-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold">Managed Accounts</h2>
              <p className="text-xs text-muted">
                Passwords are not readable. You can review accounts here and set a new temporary
                password when you need to recover access.
              </p>
            </div>

            {usersQuery.isLoading ? (
              <div className="mt-3 text-sm text-muted">Loading accounts...</div>
            ) : null}

            {usersQuery.isError ? (
              <div className="mt-3 text-sm text-rose-300">
                Failed to load accounts: {usersQuery.error.message}
              </div>
            ) : null}

            {sortedUsers.length > 0 ? (
              <div className="mt-4 space-y-3">
                {sortedUsers.map((user) => {
                  const status = actionStatus[user.id];
                  const passwordValue = passwordDrafts[user.id] ?? "";
                  const isSaving = passwordMutation.isPending && passwordMutation.variables?.userId === user.id;

                  return (
                    <div
                      key={user.id}
                      className="rounded-md border border-line bg-panelAlt px-4 py-3 text-sm"
                    >
                      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="font-medium text-text">{user.name}</div>
                          <div className="text-xs text-muted">{user.email || "No email address"}</div>
                          <div className="mt-1 text-xs text-muted">
                            Created {formatDate(user.createdAt)} · Last sign-in{" "}
                            {user.lastSignInAt ? formatDate(user.lastSignInAt) : "Never"}
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            Provider: {user.providers.length > 0 ? user.providers.join(", ") : "Unknown"} ·
                            Profile: {user.hasProfile ? "Ready" : "Not created"} · Challenge:{" "}
                            {user.challengeLevel ?? "Unset"}
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            Occupation: {user.occupation ?? "Not set"}
                          </div>
                        </div>

                        <div className="mt-3 w-full max-w-sm md:mt-0">
                          <label className="mb-1 block text-xs font-medium text-muted">
                            Temporary password
                          </label>
                          <input
                            type="password"
                            value={passwordValue}
                            onChange={(event) =>
                              setPasswordDrafts((prev) => ({
                                ...prev,
                                [user.id]: event.target.value
                              }))
                            }
                            placeholder="At least 8 characters"
                            className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm outline-none transition focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              passwordMutation.mutate({
                                userId: user.id,
                                password: passwordValue
                              })
                            }
                            disabled={isSaving}
                            className="mt-2 rounded-md border border-accent/60 bg-accent/10 px-3 py-2 text-xs font-medium text-accent disabled:opacity-50"
                          >
                            {isSaving ? "Updating..." : "Set Temporary Password"}
                          </button>
                          <div className="mt-2 text-xs text-muted">
                            {status ?? "Reset the account by assigning a new temporary password."}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </RequireAuth>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}
